package llmapi

type Usage struct {
	InputTokens       int
	CachedInputTokens *int
	OutputTokens      int
}
