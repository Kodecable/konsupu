package revision

type PublicationKind string

const (
	PublicationInitialization PublicationKind = "initialization"
	PublicationResolve        PublicationKind = "resolve"
	PublicationLearning       PublicationKind = "learning"
)

type Publication struct {
	Kind    PublicationKind
	Summary string
}
