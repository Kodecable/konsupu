package protocol

type InteractionResult struct {
	Answer               string `json:"answer"`
	Revision             string `json:"revision"`
	LearningPublications int    `json:"learning_publications"`
	// Warnings name Space prompts that failed and fell back to the built-in
	// prompt during the Interaction.
	Warnings []string `json:"warnings,omitempty"`
}
