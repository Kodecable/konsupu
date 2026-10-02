package completion

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"konsupurt/internal/llmapi"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(request *http.Request) (*http.Response, error) {
	return f(request)
}

func TestClientMapsProviderNeutralRequestAndResponse(t *testing.T) {
	httpClient := &http.Client{Transport: roundTripFunc(func(request *http.Request) (*http.Response, error) {
		if request.URL.String() != "https://example.invalid/v1/chat/completions" || request.Header.Get("Authorization") != "Bearer secret" || request.Header.Get("X-Test") != "value" {
			t.Errorf("unexpected HTTP request url=%s headers=%v", request.URL, request.Header)
		}
		var body map[string]any
		if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
			t.Error(err)
		}
		if body["model"] != "model" || body["tool_choice"] != "required" || body["max_tokens"] != float64(128) {
			t.Errorf("unexpected request body %#v", body)
		}
		return httpResponse(200, `{
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "tool_calls": [{
        "id": "call-1",
        "type": "function",
        "function": {"name": "finish", "arguments": "{\"answer\":42}"}
      }]
    },
    "finish_reason": "tool_calls"
  }],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 5,
    "total_tokens": 25,
    "prompt_tokens_details": {"cached_tokens": 0}
  }
}`, nil), nil
	})}
	client, err := New(Options{BaseURL: "https://example.invalid/v1", APIKey: "secret", Headers: map[string]string{"X-Test": "value"}, Client: httpClient})
	if err != nil {
		t.Fatal(err)
	}
	result, err := client.Generate(context.Background(), llmapi.Request{
		Model: "model", Messages: []llmapi.Message{{Role: llmapi.RoleUser, Content: "hello"}},
		Tools:      []llmapi.ToolDefinition{{Name: "finish", Description: "finish", Parameters: map[string]any{"type": "object"}}},
		ToolChoice: llmapi.ToolChoice{Mode: llmapi.ToolChoiceRequired}, MaxOutputTokens: 128,
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Message.ToolCalls) != 1 || result.Message.ToolCalls[0].Name != "finish" || result.Usage.CachedInputTokens == nil || *result.Usage.CachedInputTokens != 0 {
		t.Fatalf("unexpected result %#v", result)
	}
}

func TestCachedTokensPreservesMissingAndExplicitZero(t *testing.T) {
	for _, test := range []struct {
		name    string
		details string
		missing bool
	}{
		{name: "missing", details: "", missing: true},
		{name: "zero", details: `,"prompt_tokens_details":{"cached_tokens":0}`},
	} {
		t.Run(test.name, func(t *testing.T) {
			client, _ := New(Options{BaseURL: "https://example.invalid", Client: responseClient(200,
				`{"choices":[{"message":{"role":"assistant","content":"ok"},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2`+test.details+`}}`, nil)})
			response, err := client.Generate(context.Background(), basicRequest())
			if err != nil {
				t.Fatal(err)
			}
			if (response.Usage.CachedInputTokens == nil) != test.missing {
				t.Fatalf("cached token presence=%v want missing=%v", response.Usage.CachedInputTokens, test.missing)
			}
		})
	}
}

func TestInvalidTokenUsageIsAProtocolError(t *testing.T) {
	for _, usage := range []string{
		`"prompt_tokens":-1,"completion_tokens":1`,
		`"prompt_tokens":1,"completion_tokens":1,"prompt_tokens_details":{"cached_tokens":2}`,
	} {
		client, _ := New(Options{
			BaseURL: "https://example.invalid",
			Client: responseClient(
				200,
				`{"choices":[{"message":{"role":"assistant","content":"ok"}}],"usage":{`+usage+`}}`,
				nil,
			),
		})
		_, err := client.Generate(context.Background(), basicRequest())
		var apiError *llmapi.Error
		if !errors.As(err, &apiError) || apiError.Kind != llmapi.ErrorProtocol {
			t.Fatalf("usage=%s error=%#v", usage, err)
		}
	}
}

func TestHTTPAndProtocolErrorsAreClassified(t *testing.T) {
	for _, test := range []struct {
		name   string
		status int
		body   string
		kind   llmapi.ErrorKind
	}{
		{name: "authentication", status: 401, body: `{"error":{"message":"bad key"}}`, kind: llmapi.ErrorAuthentication},
		{name: "rate limit", status: 429, body: `{"error":{"message":"slow"}}`, kind: llmapi.ErrorRateLimited},
		{name: "unavailable", status: 503, body: `down`, kind: llmapi.ErrorUnavailable},
		{name: "malformed", status: 200, body: `{`, kind: llmapi.ErrorProtocol},
		{name: "trailing", status: 200, body: `{} {}`, kind: llmapi.ErrorProtocol},
	} {
		t.Run(test.name, func(t *testing.T) {
			client, _ := New(Options{BaseURL: "https://example.invalid", Client: responseClient(test.status, test.body, nil)})
			_, err := client.Generate(context.Background(), basicRequest())
			var apiError *llmapi.Error
			if !errors.As(err, &apiError) || apiError.Kind != test.kind {
				t.Fatalf("error=%#v want kind=%s", err, test.kind)
			}
		})
	}
}

func TestRetryAfterAndContextCancellation(t *testing.T) {
	client, _ := New(Options{BaseURL: "https://example.invalid", Client: responseClient(429,
		`{"error":{"message":"wait"}}`, http.Header{"Retry-After": []string{"3"}})})
	_, err := client.Generate(context.Background(), basicRequest())
	var apiError *llmapi.Error
	if !errors.As(err, &apiError) || apiError.RetryAfter != 3*time.Second {
		t.Fatalf("retry error=%#v", err)
	}
	canceledClient := &http.Client{Transport: roundTripFunc(func(request *http.Request) (*http.Response, error) {
		return nil, request.Context().Err()
	})}
	client, _ = New(Options{BaseURL: "https://example.invalid", Client: canceledClient})
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, err = client.Generate(ctx, basicRequest())
	if !errors.Is(err, context.Canceled) && !strings.Contains(err.Error(), "context canceled") {
		t.Fatalf("cancellation was not propagated: %v", err)
	}
}

func TestEmptyAPIKeyOmitsAuthorizationAndManagedHeadersAreRejected(t *testing.T) {
	httpClient := &http.Client{Transport: roundTripFunc(func(request *http.Request) (*http.Response, error) {
		if request.Header.Get("Authorization") != "" {
			t.Errorf("unexpected Authorization header")
		}
		return httpResponse(200, `{"choices":[{"message":{"role":"assistant","content":"ok"}}],"usage":{"prompt_tokens":1,"completion_tokens":1}}`, nil), nil
	})}
	client, err := New(Options{BaseURL: "https://example.invalid", Client: httpClient})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := client.Generate(context.Background(), basicRequest()); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"Authorization", "Content-Type", "Content-Length", ""} {
		if _, err := New(Options{BaseURL: "https://example.invalid", Headers: map[string]string{name: "x"}}); err == nil {
			t.Fatalf("managed or invalid header %q was accepted", name)
		}
	}
	for _, options := range []Options{
		{BaseURL: "https://example.invalid", Headers: map[string]string{"Bad Header": "x"}},
		{BaseURL: "https://example.invalid", Headers: map[string]string{"X-Test": "bad\r\nvalue"}},
		{BaseURL: "https://example.invalid", APIKey: "bad\x00key"},
	} {
		if _, err := New(options); err == nil {
			t.Fatalf("unsafe options were accepted: %#v", options)
		}
	}
}

func basicRequest() llmapi.Request {
	return llmapi.Request{
		Model: "model", Messages: []llmapi.Message{{Role: llmapi.RoleUser, Content: "hello"}},
		ToolChoice: llmapi.ToolChoice{Mode: llmapi.ToolChoiceNone}, MaxOutputTokens: 16,
	}
}

func responseClient(status int, body string, headers http.Header) *http.Client {
	return &http.Client{Transport: roundTripFunc(func(*http.Request) (*http.Response, error) {
		return httpResponse(status, body, headers), nil
	})}
}

func httpResponse(status int, body string, headers http.Header) *http.Response {
	if headers == nil {
		headers = make(http.Header)
	}
	return &http.Response{
		StatusCode: status, Status: http.StatusText(status), Header: headers,
		Body: io.NopCloser(strings.NewReader(body)),
	}
}
