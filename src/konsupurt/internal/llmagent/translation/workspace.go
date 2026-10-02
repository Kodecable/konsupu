package translation

import (
	"context"
	"errors"
	"path"
	"strings"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/ripgrep"
)

const translationSpacePrefix = "CognitionSpace"

type workspaceReader struct {
	delegate cognitivespace.Reader
}

func (r workspaceReader) List(
	ctx context.Context,
	name string,
	depth int,
) ([]cognitivespace.Entry, error) {
	if name == "" || name == "." {
		if depth < 1 || depth > 8 {
			return nil, errors.New("list depth must be between 1 and 8")
		}
		return []cognitivespace.Entry{{
			Path: translationSpacePrefix, Directory: true,
		}}, nil
	}
	internal, err := translationSpacePath(name)
	if err != nil {
		return nil, err
	}
	entries, err := r.delegate.List(ctx, internal, depth)
	if err != nil {
		return nil, err
	}
	for index := range entries {
		entries[index].Path = translationSpacePrefix + "/" + entries[index].Path
	}
	return entries, nil
}

func (r workspaceReader) Read(
	ctx context.Context,
	name string,
	offset int64,
	limit int64,
) (cognitivespace.Excerpt, error) {
	internal, err := translationSpacePath(name)
	if err != nil {
		return cognitivespace.Excerpt{}, err
	}
	if internal == "." {
		return cognitivespace.Excerpt{}, errors.New("read path is not a source file")
	}
	return r.delegate.Read(ctx, internal, offset, limit)
}

func (r workspaceReader) Search(
	ctx context.Context,
	args []string,
) (cognitivespace.SearchResult, error) {
	mapped := append([]string(nil), args...)
	mapped, err := ripgrep.RewriteScopes(mapped, func(scope string) (string, error) {
		if scope == "." {
			return ".", nil
		}
		internal, scopeErr := translationSpacePath(scope)
		if scopeErr != nil {
			return "", scopeErr
		}
		return internal, nil
	})
	if err != nil {
		return cognitivespace.SearchResult{}, err
	}
	result, err := r.delegate.Search(ctx, mapped)
	if err != nil {
		return result, err
	}
	for index := range result.Records {
		result.Records[index].Path = translationSpacePrefix + "/" + result.Records[index].Path
	}
	ripgrep.Finalize(&result)
	return result, nil
}

func translationSpacePath(name string) (string, error) {
	if strings.Contains(name, "\\") || strings.HasPrefix(name, "/") ||
		path.Clean(name) != name {
		//lint:ignore ST1005 Translation is a proper noun.
		return "", errors.New("Translation path must be a canonical workspace-relative slash path")
	}
	if name == translationSpacePrefix {
		return ".", nil
	}
	prefix := translationSpacePrefix + "/"
	if !strings.HasPrefix(name, prefix) {
		//lint:ignore ST1005 Translation and CognitionSpace are proper nouns.
		return "", errors.New("Translation filesystem access is limited to CognitionSpace")
	}
	internal := strings.TrimPrefix(name, prefix)
	if internal == "" {
		return ".", nil
	}
	return internal, nil
}
