package learning

import (
	"context"
	"errors"
	"testing"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/llmagent/base"
)

type snapshotFailureRepository struct {
	revision.Repository
	stage     string
	failure   error
	treeCalls int
	published bool
}

func (*snapshotFailureRepository) HasChanges(context.Context) (bool, error) {
	return true, nil
}

func (r *snapshotFailureRepository) WorkingTree(context.Context) (revision.TreeID, error) {
	r.treeCalls++
	if r.treeCalls > 1 {
		switch r.stage {
		case "verify":
			return "", r.failure
		case "mismatch":
			return "changed", nil
		}
	}
	return "draft", nil
}

func (r *snapshotFailureRepository) Capture(context.Context) (revision.Snapshot, error) {
	if r.stage == "capture" {
		return revision.Snapshot{}, r.failure
	}
	return revision.NewSnapshot("draft")
}

func (r *snapshotFailureRepository) RestoreSnapshot(context.Context, revision.Snapshot) error {
	if r.stage == "restore" {
		return r.failure
	}
	return nil
}

func (r *snapshotFailureRepository) DiscardSnapshot(context.Context, revision.Snapshot) error {
	if r.stage == "discard" {
		return r.failure
	}
	return nil
}

func (r *snapshotFailureRepository) Publish(context.Context, revision.ID, revision.Publication) (revision.ID, error) {
	r.published = true
	return "published", nil
}

type failingContractTests struct {
	contractErr error
	testCalled  bool
}

func (r *failingContractTests) ValidateResolve(context.Context, revision.TreeID) error {
	return r.contractErr
}

func (r *failingContractTests) Test(context.Context, revision.TreeID) (javascript.TestResult, error) {
	r.testCalled = true
	return javascript.TestResult{Passed: true}, nil
}

func TestFinishAbortsOnSnapshotFailure(t *testing.T) {
	root := t.TempDir()
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	for _, stage := range []string{"capture", "restore", "verify", "mismatch", "discard"} {
		for _, contract := range []string{"valid", "invalid"} {
			t.Run(stage+"/"+contract, func(t *testing.T) {
				repository := &snapshotFailureRepository{stage: stage, failure: errors.New("storage failed")}
				tests := &failingContractTests{}
				if contract == "invalid" {
					tests.contractErr = errors.New("invalid Resolve export")
				}
				agent := NewAgent(nil, space, repository, tests, nil)
				_, err := agent.finishTool("initial", "input_translation_gap").Invoke(context.Background(), `{}`)
				var abort *base.AbortError
				if !errors.As(err, &abort) {
					t.Fatalf("snapshot failure did not abort Learning: %v", err)
				}
				if stage != "mismatch" && !errors.Is(err, repository.failure) {
					t.Fatalf("lost storage error: %v", err)
				}
				if tests.testCalled || repository.published {
					t.Fatalf("continued after failure: test=%v published=%v", tests.testCalled, repository.published)
				}
			})
		}
	}
}
