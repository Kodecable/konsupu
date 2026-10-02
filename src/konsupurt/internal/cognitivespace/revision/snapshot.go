package revision

import "crypto/rand"

type Snapshot struct {
	identity [16]byte
	tree     TreeID
}

// NewSnapshot issues an opaque snapshot handle for a Revision backend. The
// handle deliberately exposes no backend token or filesystem identity.
func NewSnapshot(tree TreeID) (Snapshot, error) {
	result := Snapshot{tree: tree}
	if _, err := rand.Read(result.identity[:]); err != nil {
		return Snapshot{}, err
	}
	return result, nil
}

func (s Snapshot) TreeID() TreeID { return s.tree }
