package cognitivespace

import (
	"errors"
	"os"
	"path/filepath"
)

type WorkspaceOptions struct {
	Role          Role
	ReferenceRoot string
}

type Workspace struct {
	root      string
	cognition string
	reference string
}

func (s *Space) NewWorkspace(options WorkspaceOptions) (*Workspace, error) {
	if s == nil || s.root == "" {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return nil, errors.New("Cognition Space is not open")
	}
	switch options.Role {
	case RoleInputTranslation, RoleOutputTranslation, RoleLearning:
	default:
		return nil, errors.New("this Cognition Space role does not use an Agent workspace")
	}
	root, err := os.MkdirTemp("", "konsupu-agent-*")
	if err != nil {
		return nil, err
	}
	cleanup := func(value error) (*Workspace, error) {
		_ = os.RemoveAll(root)
		return nil, value
	}
	cognition := filepath.Join(root, "CognitionSpace")
	if err := os.Symlink(s.root, cognition); err != nil {
		return cleanup(err)
	}
	referenceRoot := options.ReferenceRoot
	if referenceRoot == "" {
		referenceRoot = filepath.Join(root, ".empty-reference-library")
		if err := os.Mkdir(referenceRoot, 0o555); err != nil {
			return cleanup(err)
		}
	}
	absoluteReference, err := filepath.Abs(referenceRoot)
	if err != nil {
		return cleanup(err)
	}
	info, err := os.Stat(absoluteReference)
	if err != nil || !info.IsDir() {
		return cleanup(errors.New("ReferenceLibrary root must be a directory"))
	}
	reference := filepath.Join(root, "ReferenceLibrary")
	if err := os.Symlink(absoluteReference, reference); err != nil {
		return cleanup(err)
	}
	return &Workspace{root: root, cognition: cognition, reference: reference}, nil
}

func (w *Workspace) Root() string          { return w.root }
func (w *Workspace) CognitionRoot() string { return w.cognition }
func (w *Workspace) ReferenceRoot() string { return w.reference }

func (w *Workspace) Close() error {
	if w == nil || w.root == "" {
		return nil
	}
	root := w.root
	w.root = ""
	return os.RemoveAll(root)
}
