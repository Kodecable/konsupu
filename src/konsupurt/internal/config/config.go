package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const OpenAICompletionDriver = "openai-completion"

type Config struct {
	LLM        LLMConfig        `json:"llm"`
	JavaScript JavaScriptConfig `json:"javascript"`
}

type LLMConfig struct {
	Driver              string                  `json:"driver"`
	Model               string                  `json:"model"`
	ContextWindowTokens int                     `json:"context_window_tokens"`
	MaxOutputTokens     int                     `json:"max_output_tokens"`
	OpenAICompletion    *OpenAICompletionConfig `json:"openai_completion,omitempty"`
}

type OpenAICompletionConfig struct {
	BaseURL string            `json:"base_url"`
	APIKey  string            `json:"api_key"`
	Headers map[string]string `json:"headers"`
}

type JavaScriptConfig struct {
	MemoryLimitBytes    uint64 `json:"memory_limit_bytes"`
	StackLimitBytes     uint64 `json:"stack_limit_bytes"`
	InterruptBudget     uint64 `json:"interrupt_budget"`
	TimeoutMilliseconds uint64 `json:"timeout_milliseconds"`
}

func Load(path string) (Config, error) {
	file, err := os.Open(path)
	if err != nil {
		return Config{}, fmt.Errorf("open configuration: %w", err)
	}
	defer file.Close()
	return Decode(file)
}

func Decode(reader io.Reader) (Config, error) {
	var value Config
	decoder := json.NewDecoder(reader)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&value); err != nil {
		return Config{}, fmt.Errorf("decode configuration: %w", err)
	}
	var trailing any
	if err := decoder.Decode(&trailing); err == nil {
		return Config{}, errors.New("decode configuration: multiple JSON values")
	} else if !errors.Is(err, io.EOF) {
		return Config{}, fmt.Errorf("decode configuration: %w", err)
	}
	if err := value.Validate(); err != nil {
		return Config{}, err
	}
	return value, nil
}

func (c Config) Validate() error {
	if c.LLM.Driver != OpenAICompletionDriver {
		return fmt.Errorf("llm.driver %q is unsupported", c.LLM.Driver)
	}
	if strings.TrimSpace(c.LLM.Model) == "" {
		return errors.New("llm.model is required")
	}
	if c.LLM.ContextWindowTokens <= 0 || c.LLM.MaxOutputTokens <= 0 || c.LLM.MaxOutputTokens >= c.LLM.ContextWindowTokens {
		return errors.New("llm token limits must be positive and leave input context")
	}
	provider := c.LLM.OpenAICompletion
	if provider == nil {
		return errors.New("llm.openai_completion is required for openai-completion")
	}
	if provider.Headers == nil {
		return errors.New("llm.openai_completion.headers must be an object")
	}
	parsed, err := url.Parse(provider.BaseURL)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" || parsed.User != nil {
		return errors.New("llm.openai_completion.base_url must be an absolute HTTP or HTTPS URL without user information")
	}
	for name, value := range provider.Headers {
		canonical := http.CanonicalHeaderKey(name)
		if canonical == "Authorization" || canonical == "Content-Type" || canonical == "Content-Length" {
			return fmt.Errorf("llm.openai_completion.headers contains managed header %q", name)
		}
		if !validHTTPHeaderName(name) {
			return fmt.Errorf("llm.openai_completion.headers contains invalid name %q", name)
		}
		if !validHTTPHeaderValue(value) {
			return fmt.Errorf("llm.openai_completion.headers contains an invalid value for %q", name)
		}
	}
	if !validHTTPHeaderValue(provider.APIKey) {
		return errors.New("llm.openai_completion.api_key contains invalid control characters")
	}
	if c.JavaScript.MemoryLimitBytes == 0 || c.JavaScript.StackLimitBytes == 0 || c.JavaScript.InterruptBudget == 0 || c.JavaScript.TimeoutMilliseconds == 0 {
		return errors.New("javascript limits must all be positive")
	}
	if c.JavaScript.TimeoutMilliseconds > uint64(math.MaxInt64/int64(time.Millisecond)) {
		return errors.New("javascript.timeout_milliseconds exceeds the supported duration")
	}
	return nil
}

func validHTTPHeaderName(value string) bool {
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

func validHTTPHeaderValue(value string) bool {
	for index := 0; index < len(value); index++ {
		character := value[index]
		if (character < 0x20 && character != '\t') || character == 0x7f {
			return false
		}
	}
	return true
}
