package protocol

import (
	"fmt"
	"path"
	"strings"
	"unicode/utf8"
)

type InputRepairDiagnostic struct {
	Message                  string `json:"message"`
	StructuredInputMayMutate bool   `json:"structured_input_may_mutate"`
}

type SourceDiagnostic struct {
	Code    string       `json:"code"`
	Message string       `json:"message"`
	Path    string       `json:"path,omitempty"`
	Line    int          `json:"line,omitempty"`
	Column  int          `json:"column,omitempty"`
	Trace   []TraceFrame `json:"trace,omitempty"`
}

func (d InputRepairDiagnostic) Validate() error {
	if err := bounded("input repair message", d.Message, 1, 1024); err != nil {
		return err
	}
	if !d.StructuredInputMayMutate {
		return fmt.Errorf("input repair diagnostic must warn that StructuredInput may mutate")
	}
	return nil
}

func (d SourceDiagnostic) Validate() error {
	if err := bounded("diagnostic code", d.Code, 1, 128); err != nil {
		return err
	}
	if err := bounded("diagnostic message", d.Message, 1, 2048); err != nil {
		return err
	}
	if d.Path != "" {
		if err := bounded("diagnostic path", d.Path, 1, 1024); err != nil {
			return err
		}
		if err := validateCognitionPath(d.Path); err != nil {
			return fmt.Errorf("diagnostic path: %w", err)
		}
		if (d.Line == 0) != (d.Column == 0) || d.Line < 0 || d.Column < 0 {
			return fmt.Errorf("diagnostic line and column must both be zero or both be positive")
		}
	} else if d.Line != 0 || d.Column != 0 {
		return fmt.Errorf("diagnostic line and column require a path")
	}
	return validateTrace("diagnostic trace", d.Trace)
}

func validateMissing(missing []MissingCapability) error {
	if len(missing) < 1 || len(missing) > 8 {
		return fmt.Errorf("missing capability count must be between 1 and 8")
	}
	for index, capability := range missing {
		if err := bounded(fmt.Sprintf("missing[%d].description", index), capability.Description, 1, 240); err != nil {
			return err
		}
		if len(capability.NearMatches) > 8 {
			return fmt.Errorf("missing[%d].near_matches has more than 8 entries", index)
		}
		for nearIndex, near := range capability.NearMatches {
			prefix := fmt.Sprintf("missing[%d].near_matches[%d]", index, nearIndex)
			if err := validateInterfacePath(near.Path); err != nil {
				return fmt.Errorf("%s.path: %w", prefix, err)
			}
			if near.Export != nil {
				if err := bounded(prefix+".export", *near.Export, 1, 128); err != nil {
					return err
				}
			}
			if err := bounded(prefix+".limitation", near.Limitation, 1, 240); err != nil {
				return err
			}
		}
	}
	return nil
}

func validateInterfacePath(value string) error {
	if err := bounded("path", value, 1, 1024); err != nil {
		return err
	}
	if strings.Contains(value, "\\") || strings.HasPrefix(value, "/") || path.Clean(value) != value {
		return fmt.Errorf("path must be a canonical relative slash path")
	}
	if !strings.HasPrefix(value, "Interface/") || !strings.HasSuffix(value, ".js") {
		return fmt.Errorf("path must identify Interface/**/*.js")
	}
	return nil
}

func validateCognitionPath(value string) error {
	if strings.Contains(value, "\\") || strings.HasPrefix(value, "/") ||
		path.Clean(value) != value {
		return fmt.Errorf("must be a canonical relative slash path")
	}
	segments := strings.Split(value, "/")
	for _, segment := range segments {
		if segment == "" || segment == "." || segment == ".." ||
			strings.HasPrefix(segment, ".") {
			return fmt.Errorf("must not contain empty, traversal, or hidden segments")
		}
	}
	top := segments[0]
	if value != "Resolve.js" && value != "Test.js" &&
		top != "Interface" && top != "Memory" && top != "Test" {
		return fmt.Errorf("must identify Cognition Space source")
	}
	if !strings.HasSuffix(value, ".js") && !strings.HasSuffix(value, ".json") {
		return fmt.Errorf("must identify JavaScript or JSON source")
	}
	return nil
}

func bounded(name, value string, minimum, maximum int) error {
	length := utf8.RuneCountInString(value)
	if !utf8.ValidString(value) || length < minimum || length > maximum {
		return fmt.Errorf("%s length must be between %d and %d Unicode code points", name, minimum, maximum)
	}
	return nil
}
