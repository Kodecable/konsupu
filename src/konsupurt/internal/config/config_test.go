package config

import (
	"strings"
	"testing"
)

const validConfig = `{
  "llm": {
    "driver": "openai-completion",
    "model": "test",
    "context_window_tokens": 98304,
    "max_output_tokens": 32768,
    "openai_completion": {
      "base_url": "https://example.test/v1",
      "api_key": "",
      "headers": {}
    }
  },
  "javascript": {
    "memory_limit_bytes": 67108864,
    "stack_limit_bytes": 1048576,
    "interrupt_budget": 1000000,
    "timeout_milliseconds": 5000
  }
}`

func TestDecodeStrictConfiguration(t *testing.T) {
	config, err := Decode(strings.NewReader(validConfig))
	if err != nil {
		t.Fatal(err)
	}
	if config.LLM.Driver != OpenAICompletionDriver || config.LLM.Model != "test" {
		t.Fatalf("config=%+v", config)
	}
}

func TestDecodeRejectsUnknownFieldAndTrailingValue(t *testing.T) {
	for _, source := range []string{
		strings.Replace(validConfig, `"model": "test"`, `"model": "test", "unknown": true`, 1),
		validConfig + `{}`,
		strings.Replace(validConfig, `"headers": {}`, `"headers": null`, 1),
		strings.Replace(validConfig, `"driver": "openai-completion"`, `"driver": "unknown"`, 1),
		"null",
		strings.Replace(validConfig, `"headers": {}`, `"headers": {"Bad Header": "x"}`, 1),
		strings.Replace(validConfig, `"headers": {}`, `"headers": {"X-Test": "bad\r\nvalue"}`, 1),
		strings.Replace(validConfig, `"api_key": ""`, `"api_key": "bad\u0000key"`, 1),
		strings.Replace(validConfig, `"timeout_milliseconds": 5000`, `"timeout_milliseconds": 18446744073709551615`, 1),
	} {
		if _, err := Decode(strings.NewReader(source)); err == nil {
			t.Fatalf("Decode(%q) succeeded", source)
		}
	}
}
