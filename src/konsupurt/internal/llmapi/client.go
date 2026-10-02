package llmapi

import "context"

// Client is the provider-neutral model API consumed by the agent runtime.
type Client interface {
	Generate(context.Context, Request) (Response, error)
}
