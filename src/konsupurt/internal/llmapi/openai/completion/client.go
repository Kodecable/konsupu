package completion

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"maps"
	"net/http"
	"net/url"
	"slices"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"konsupurt/internal/llmapi"
)

const defaultMaxResponseBytes int64 = 16 << 20

type Options struct {
	BaseURL          string
	APIKey           string
	Headers          map[string]string
	Body             map[string]json.RawMessage // extra top-level request fields
	Debug            io.Writer                  // when set, requests and response headers are written here
	Client           *http.Client
	MaxResponseBytes int64
}

type Client struct {
	endpoint         string
	apiKey           string
	headers          map[string]string
	body             map[string]json.RawMessage
	debug            io.Writer
	http             *http.Client
	maxResponseBytes int64
}

func New(options Options) (*Client, error) {
	endpoint, err := endpointURL(options.BaseURL)
	if err != nil {
		return nil, err
	}
	for name, value := range options.Headers {
		switch strings.ToLower(http.CanonicalHeaderKey(name)) {
		case strings.ToLower("Authorization"), strings.ToLower("Content-Type"), strings.ToLower("Content-Length"):
			return nil, fmt.Errorf("OpenAI completion header %q is managed by the client", name)
		}
		if !validHeaderName(name) {
			return nil, fmt.Errorf("OpenAI completion header name %q is invalid", name)
		}
		if !validHeaderValue(value) {
			return nil, fmt.Errorf("OpenAI completion header %q has an invalid value", name)
		}
	}
	if !validHeaderValue(options.APIKey) {
		return nil, errors.New("OpenAI completion API key contains invalid control characters")
	}
	for name, value := range options.Body {
		if slices.Contains(managedFields, name) {
			return nil, fmt.Errorf("OpenAI completion body field %q is managed by the client", name)
		}
		if !json.Valid(value) {
			return nil, fmt.Errorf("OpenAI completion body field %q is not valid JSON", name)
		}
	}
	client := options.Client
	if client == nil {
		client = http.DefaultClient
	}
	limit := options.MaxResponseBytes
	if limit <= 0 {
		limit = defaultMaxResponseBytes
	}
	return &Client{
		endpoint: endpoint, apiKey: options.APIKey, headers: cloneHeaders(options.Headers),
		body: maps.Clone(options.Body), debug: options.Debug, http: client, maxResponseBytes: limit,
	}, nil
}

func (c *Client) Generate(ctx context.Context, request llmapi.Request) (llmapi.Response, error) {
	if c == nil {
		return llmapi.Response{}, errors.New("OpenAI completion client is nil")
	}
	wireRequest, err := encodeRequest(request)
	if err != nil {
		return llmapi.Response{}, err
	}
	body, err := c.marshal(wireRequest)
	if err != nil {
		return llmapi.Response{}, fmt.Errorf("encode OpenAI completion request: %w", err)
	}
	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(body))
	if err != nil {
		return llmapi.Response{}, fmt.Errorf("create OpenAI completion request: %w", err)
	}
	for name, value := range c.headers {
		httpRequest.Header.Set(name, value)
	}
	httpRequest.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		httpRequest.Header.Set("Authorization", "Bearer "+c.apiKey)
	}
	c.debugRequest(httpRequest, body)
	response, err := c.http.Do(httpRequest)
	if err != nil {
		c.debugf("<- transport error: %v\n", err)
		return llmapi.Response{}, fmt.Errorf("OpenAI completion request: %w", err)
	}
	c.debugResponse(response)
	defer response.Body.Close()
	data, err := io.ReadAll(io.LimitReader(response.Body, c.maxResponseBytes+1))
	if err != nil {
		return llmapi.Response{}, fmt.Errorf("read OpenAI completion response: %w", err)
	}
	if int64(len(data)) > c.maxResponseBytes {
		return llmapi.Response{}, &llmapi.Error{Kind: llmapi.ErrorProtocol, StatusCode: response.StatusCode, Message: fmt.Sprintf("OpenAI completion response exceeds %d bytes", c.maxResponseBytes)}
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return llmapi.Response{}, decodeHTTPError(response, data)
	}
	var wireResponse responseBody
	decoder := json.NewDecoder(bytes.NewReader(data))
	if err := decoder.Decode(&wireResponse); err != nil {
		return llmapi.Response{}, &llmapi.Error{Kind: llmapi.ErrorProtocol, StatusCode: response.StatusCode, Message: "decode OpenAI completion response: " + err.Error()}
	}
	var trailing any
	if err := decoder.Decode(&trailing); err == nil {
		return llmapi.Response{}, &llmapi.Error{Kind: llmapi.ErrorProtocol, StatusCode: response.StatusCode, Message: "decode OpenAI completion response: multiple JSON values"}
	} else if !errors.Is(err, io.EOF) {
		return llmapi.Response{}, &llmapi.Error{Kind: llmapi.ErrorProtocol, StatusCode: response.StatusCode, Message: "decode OpenAI completion response: " + err.Error()}
	}
	return decodeResponse(wireResponse)
}

// managedFields are owned by the request encoder and cannot come from Options.Body.
var managedFields = []string{"model", "messages", "tools", "tool_choice", "max_tokens", "stream"}

// marshal encodes the request and merges the configured extra fields over it.
func (c *Client) marshal(request requestBody) ([]byte, error) {
	encoded, err := json.Marshal(request)
	if err != nil || len(c.body) == 0 {
		return encoded, err
	}
	fields := map[string]json.RawMessage{}
	if err := json.Unmarshal(encoded, &fields); err != nil {
		return nil, err
	}
	maps.Copy(fields, c.body)
	return json.Marshal(fields)
}

func endpointURL(raw string) (string, error) {
	if raw == "" {
		return "", errors.New("OpenAI completion base URL is required")
	}
	parsed, err := url.Parse(raw)
	if err != nil {
		return "", fmt.Errorf("parse OpenAI completion base URL: %w", err)
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return "", errors.New("OpenAI completion base URL must use HTTP or HTTPS")
	}
	if parsed.Host == "" || parsed.User != nil {
		return "", errors.New("OpenAI completion base URL has invalid authority")
	}
	parsed.Path = strings.TrimRight(parsed.Path, "/")
	if !strings.HasSuffix(parsed.Path, "/chat/completions") {
		parsed.Path += "/chat/completions"
	}
	return parsed.String(), nil
}

func cloneHeaders(input map[string]string) map[string]string {
	output := make(map[string]string, len(input))
	for name, value := range input {
		output[name] = value
	}
	return output
}

func validHeaderName(value string) bool {
	if value == "" {
		return false
	}
	for index := 0; index < len(value); index++ {
		character := value[index]
		if !((character >= 'a' && character <= 'z') ||
			(character >= 'A' && character <= 'Z') ||
			(character >= '0' && character <= '9') ||
			strings.ContainsRune("!#$%&'*+-.^_`|~", rune(character))) {
			return false
		}
	}
	return true
}

func validHeaderValue(value string) bool {
	for index := 0; index < len(value); index++ {
		character := value[index]
		if (character < 0x20 && character != '\t') || character == 0x7f {
			return false
		}
	}
	return true
}

func (c *Client) debugf(format string, args ...any) {
	if c.debug != nil {
		fmt.Fprintf(c.debug, format, args...)
	}
}

// debugRequest writes the outgoing request. Credentials never appear: the
// Authorization value is masked.
func (c *Client) debugRequest(request *http.Request, body []byte) {
	if c.debug == nil {
		return
	}
	c.debugf("-> %s %s\n", request.Method, request.URL)
	writeHeaders(c.debug, request.Header, "   ")
	c.debugf("   body (%d bytes): %s\n", len(body), body)
}

func (c *Client) debugResponse(response *http.Response) {
	if c.debug == nil {
		return
	}
	c.debugf("<- %d %s\n", response.StatusCode, http.StatusText(response.StatusCode))
	writeHeaders(c.debug, response.Header, "   ")
}

// credentialHeader reports whether a header likely carries a secret.
func credentialHeader(name string) bool {
	lower := strings.ToLower(name)
	for _, part := range []string{"auth", "key", "token", "secret", "cookie"} {
		if strings.Contains(lower, part) {
			return true
		}
	}
	return false
}

func writeHeaders(output io.Writer, header http.Header, indent string) {
	names := make([]string, 0, len(header))
	for name := range header {
		names = append(names, name)
	}
	slices.Sort(names)
	for _, name := range names {
		for _, value := range header[name] {
			if credentialHeader(name) {
				value = "***"
			}
			fmt.Fprintf(output, "%s%s: %s\n", indent, name, value)
		}
	}
}

// maxErrorBodyBytes bounds the response body quoted in an error message.
const maxErrorBodyBytes = 4096

func truncateBody(body string) string {
	if len(body) <= maxErrorBodyBytes {
		return body
	}
	cut := maxErrorBodyBytes
	for cut > 0 && !utf8.RuneStart(body[cut]) {
		cut--
	}
	return body[:cut] + fmt.Sprintf("...[truncated, %d bytes in total]", len(body))
}

func decodeHTTPError(response *http.Response, data []byte) error {
	kind := llmapi.ErrorInvalidRequest
	switch {
	case response.StatusCode == http.StatusUnauthorized || response.StatusCode == http.StatusForbidden:
		kind = llmapi.ErrorAuthentication
	case response.StatusCode == http.StatusTooManyRequests:
		kind = llmapi.ErrorRateLimited
	case response.StatusCode >= 500:
		kind = llmapi.ErrorUnavailable
	}
	body := strings.TrimSpace(string(data))
	message := body
	var payload errorBody
	if json.Unmarshal(data, &payload) == nil && payload.Error.Message != "" {
		message = payload.Error.Message
	}
	if message == "" {
		message = http.StatusText(response.StatusCode)
	}
	// Keep the whole response body in the error: providers put the useful
	// detail (type, code, param, gateway fields) anywhere in it.
	if body != "" && body != message {
		message = truncateBody(message) + "\nresponse body: " + truncateBody(body)
	} else {
		message = truncateBody(message)
	}
	var retryAfter time.Duration
	if seconds, err := strconv.Atoi(response.Header.Get("Retry-After")); err == nil && seconds > 0 {
		retryAfter = time.Duration(seconds) * time.Second
	}
	return &llmapi.Error{Kind: kind, StatusCode: response.StatusCode, Message: fmt.Sprintf("OpenAI completion HTTP %d: %s", response.StatusCode, message), RetryAfter: retryAfter}
}
