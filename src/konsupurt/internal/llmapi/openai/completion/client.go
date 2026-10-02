package completion

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"konsupurt/internal/llmapi"
)

const defaultMaxResponseBytes int64 = 16 << 20

type Options struct {
	BaseURL          string
	APIKey           string
	Headers          map[string]string
	Client           *http.Client
	MaxResponseBytes int64
}

type Client struct {
	endpoint         string
	apiKey           string
	headers          map[string]string
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
		http: client, maxResponseBytes: limit,
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
	body, err := json.Marshal(wireRequest)
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
	response, err := c.http.Do(httpRequest)
	if err != nil {
		return llmapi.Response{}, fmt.Errorf("OpenAI completion request: %w", err)
	}
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
	message := strings.TrimSpace(string(data))
	var payload errorBody
	if json.Unmarshal(data, &payload) == nil && payload.Error.Message != "" {
		message = payload.Error.Message
	}
	if message == "" {
		message = http.StatusText(response.StatusCode)
	}
	var retryAfter time.Duration
	if seconds, err := strconv.Atoi(response.Header.Get("Retry-After")); err == nil && seconds > 0 {
		retryAfter = time.Duration(seconds) * time.Second
	}
	return &llmapi.Error{Kind: kind, StatusCode: response.StatusCode, Message: fmt.Sprintf("OpenAI completion HTTP %d: %s", response.StatusCode, message), RetryAfter: retryAfter}
}
