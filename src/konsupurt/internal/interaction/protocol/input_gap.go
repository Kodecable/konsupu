package protocol

type NearMatch struct {
	Path       string  `json:"path"`
	Export     *string `json:"export,omitempty"`
	Limitation string  `json:"limitation"`
}

type MissingCapability struct {
	Description string      `json:"description"`
	NearMatches []NearMatch `json:"near_matches"`
}

type InputTranslationGap struct {
	Missing []MissingCapability `json:"missing"`
}

func (g InputTranslationGap) Validate() error { return validateMissing(g.Missing) }
