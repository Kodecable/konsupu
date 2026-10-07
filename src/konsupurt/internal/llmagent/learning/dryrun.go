package learning

import (
	"context"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"konsupurt/internal/llmagent/base"
)

// DryRunner is a Learner that can run a Learning workflow without publishing,
// for inspection. Whatever the Agent wrote stays in the working tree: the
// caller restores the Revision it started from.
type DryRunner interface {
	DebugLearn(ctx context.Context, kind string, gap any, trace base.Trace) (DryRun, error)
}

// DryRun is what one dry Learning run did to the Cognition Space.
type DryRun struct {
	// Finished is set when finish() passed every check that precedes
	// publication, so a real run would have published these Changes.
	Finished bool         `json:"finished"`
	Changes  []FileChange `json:"changes"`
}

// FileChange is one visible file the Agent added, modified or removed.
type FileChange struct {
	Path   string `json:"path"`
	Status string `json:"status"`
	Diff   string `json:"diff"`
}

// dryFinish is the Final of a finish() that would have published.
type dryFinish struct{}

// DebugLearn runs the Learning workflow for gap, with finish() validating and
// testing the draft but never publishing it. The Changes are read from the
// working tree even when the run fails, so a run that ran out of iterations
// still shows what it had written.
func (a *Agent) DebugLearn(ctx context.Context, kind string, gap any, trace base.Trace) (DryRun, error) {
	before, err := readVisibleFiles(a.space.Root())
	if err != nil {
		return DryRun{}, err
	}
	final, runErr := a.run(ctx, kind, gap, trace, true)
	after, readErr := readVisibleFiles(a.space.Root())
	result := DryRun{Changes: diffFiles(before, after)}
	if _, ok := final.(dryFinish); ok {
		result.Finished = true
	}
	return result, errors.Join(runErr, readErr)
}

// readVisibleFiles reads every file of the Cognition Space. Hidden paths are
// Runtime metadata and never part of it.
func readVisibleFiles(root string) (map[string]string, error) {
	files := make(map[string]string)
	err := filepath.WalkDir(root, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if path == root {
			return nil
		}
		if strings.HasPrefix(entry.Name(), ".") {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if entry.IsDir() || !entry.Type().IsRegular() {
			return nil
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		relative, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		files[filepath.ToSlash(relative)] = string(data)
		return nil
	})
	return files, err
}

func diffFiles(before, after map[string]string) []FileChange {
	paths := make([]string, 0, len(before)+len(after))
	for path := range before {
		paths = append(paths, path)
	}
	for path := range after {
		if _, ok := before[path]; !ok {
			paths = append(paths, path)
		}
	}
	sort.Strings(paths)
	changes := []FileChange{}
	for _, path := range paths {
		old, hadOld := before[path]
		current, hasCurrent := after[path]
		switch {
		case hadOld && hasCurrent && old == current:
			continue
		case !hadOld:
			changes = append(changes, FileChange{Path: path, Status: "added", Diff: unifiedDiff("", current)})
		case !hasCurrent:
			changes = append(changes, FileChange{Path: path, Status: "removed", Diff: unifiedDiff(old, "")})
		default:
			changes = append(changes, FileChange{Path: path, Status: "modified", Diff: unifiedDiff(old, current)})
		}
	}
	return changes
}
