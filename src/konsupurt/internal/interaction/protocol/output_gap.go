package protocol

type OutputTranslationGap struct {
	Missing []MissingCapability `json:"missing"`
}

func (g OutputTranslationGap) Validate() error { return validateMissing(g.Missing) }
