package protocol

type InteractionResult struct {
	Answer               string `json:"answer"`
	Revision             string `json:"revision"`
	LearningPublications int    `json:"learning_publications"`
}
