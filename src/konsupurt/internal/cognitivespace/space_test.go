package cognitivespace

import (
	"context"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestInitializeLayoutAndStrictValidation(t *testing.T) {
	root := filepath.Join(t.TempDir(), "space")
	if err := InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := Open(root)
	if err != nil {
		t.Fatal(err)
	}
	if err := space.Validate(context.Background()); err != nil {
		t.Fatal(err)
	}
	entries, err := os.ReadDir(root)
	if err != nil {
		t.Fatal(err)
	}
	var visible []string
	for _, entry := range entries {
		if !hiddenName(entry.Name()) {
			visible = append(visible, entry.Name())
		}
	}
	if strings.Join(visible, ",") != "Interface,Memory,Resolve.js,Test,Test.js" {
		t.Fatalf("unexpected initialized entries %v", visible)
	}
	if err := os.WriteFile(filepath.Join(root, "extra.json"), []byte("{}\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := space.Validate(context.Background()); err == nil || !strings.Contains(err.Error(), "unexpected") {
		t.Fatalf("expected strict root rejection, got %v", err)
	}
}

func TestValidationIgnoresHiddenRuntimeMetadata(t *testing.T) {
	ctx := context.Background()
	for _, test := range []struct {
		name string
		make func(string) error
	}{
		{
			name: "hidden source",
			make: func(root string) error {
				return os.WriteFile(filepath.Join(root, "Interface", ".hidden.js"), []byte(""), 0o600)
			},
		},
		{
			name: "Revision metadata symlink",
			make: func(root string) error {
				return os.Symlink(filepath.Join(root, "Memory"), filepath.Join(root, ".git"))
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			space := initializedSpace(t)
			if err := test.make(space.Root()); err != nil {
				t.Fatal(err)
			}
			if err := space.Validate(ctx); err != nil {
				t.Fatalf("hidden Runtime metadata affected Cognition validation: %v", err)
			}
		})
	}
}

func TestValidationIgnoresDirectoryMarkers(t *testing.T) {
	space := initializedSpace(t)
	memory := filepath.Join(space.Root(), "Memory")
	// A marker is a hidden path: neither its content nor its absence matters.
	if err := os.WriteFile(filepath.Join(memory, DirectoryMarker), []byte("x"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(memory, "Bare"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := space.Validate(context.Background()); err != nil {
		t.Fatalf("hidden marker or missing marker failed validation: %v", err)
	}
}

func TestRoleAccessTraversalSymlinkAndCaseCollision(t *testing.T) {
	ctx := context.Background()
	space := initializedSpace(t)
	input := space.Reader(RoleInputTranslation)
	if _, err := input.Read(ctx, "Resolve.js", 0, 100); err == nil {
		t.Fatal("Input Translation could read Resolve.js")
	}
	if _, err := input.Read(ctx, "../outside", 0, 100); err == nil {
		t.Fatal("path traversal was accepted")
	}
	if err := os.Symlink(filepath.Join(space.Root(), "Resolve.js"), filepath.Join(space.Root(), "Interface", "link.js")); err != nil {
		t.Fatal(err)
	}
	if _, err := input.Read(ctx, "Interface/link.js", 0, 100); err == nil {
		t.Fatal("Agent followed a Cognition Space symlink")
	}
	if err := os.Remove(filepath.Join(space.Root(), "Interface", "link.js")); err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Interface/Thing.js", `export const Thing = true;`); err != nil {
		t.Fatal(err)
	}
	if _, err := input.Read(ctx, "Interface/thing.js", 0, 100); err == nil ||
		!strings.Contains(err.Error(), "conflicts by case") {
		t.Fatalf("case-confused read path was accepted: %v", err)
	}
	if err := editor.Create(ctx, "Interface/thing.js", `export const Other = true;`); err == nil || !strings.Contains(err.Error(), "conflicts by case") {
		t.Fatalf("expected case collision rejection, got %v", err)
	}
}

func TestDirectoryMarkersAndFormattedAtomicWrites(t *testing.T) {
	ctx := context.Background()
	space := initializedSpace(t)
	editor, err := space.Editor(RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Interface/Nested/", ""); err != nil {
		t.Fatal(err)
	}
	marker := filepath.Join(space.Root(), "Interface", "Nested", DirectoryMarker)
	if info, err := os.Stat(marker); err != nil || !info.Mode().IsRegular() {
		t.Fatalf("directory marker missing: %v", err)
	}
	if err := editor.Create(ctx, "Interface/Nested/Value.js", `export const Value={answer:42}`); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(filepath.Join(space.Root(), "Interface", "Nested", "Value.js"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(data), "answer: 42") || !strings.HasSuffix(string(data), "\n") {
		t.Fatalf("source was not formatted: %q", data)
	}
	if err := editor.Remove(ctx, "Interface/Nested"); err == nil {
		t.Fatal("non-empty directory removal succeeded")
	}
	if err := editor.Remove(ctx, "Interface/Nested/Value.js"); err != nil {
		t.Fatal(err)
	}
	if err := editor.Remove(ctx, "Interface/Nested"); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(marker); !os.IsNotExist(err) {
		t.Fatalf("directory was not removed: %v", err)
	}
	if err := editor.Create(ctx, "Extra.js", `export default 1;`); err == nil {
		t.Fatal("Learning added a sixth Cognition Space root entry")
	}
	if err := editor.Move(ctx, "Interface", "Other"); err == nil {
		t.Fatal("Learning renamed a required Cognition Space root entry")
	}
}

func TestValidationRejectsImportPolicyDynamicImportAndUnformattedSource(t *testing.T) {
	ctx := context.Background()
	for _, test := range []struct {
		name   string
		path   string
		source string
		want   string
	}{
		{name: "forbidden graph", path: "Interface/Bad.js", source: `import "../Test.js"; export default 1;`, want: "cannot import"},
		{name: "dynamic import", path: "Interface/Bad.js", source: `export default import("./Other.js");`, want: "dynamic import"},
		{name: "implicit extension", path: "Interface/Bad.js", source: `import "./Other"; export default 1;`, want: "explicit .js"},
	} {
		t.Run(test.name, func(t *testing.T) {
			space := initializedSpace(t)
			editor, _ := space.Editor(RoleLearning)
			if strings.Contains(test.source, "Other.js") {
				if err := editor.Create(ctx, "Interface/Other.js", `export default 1;`); err != nil {
					t.Fatal(err)
				}
			}
			if err := editor.Create(ctx, test.path, test.source); err != nil {
				t.Fatal(err)
			}
			if err := space.Validate(ctx); err == nil || !strings.Contains(err.Error(), test.want) {
				t.Fatalf("expected %q rejection, got %v", test.want, err)
			}
		})
	}
	space := initializedSpace(t)
	if err := os.WriteFile(filepath.Join(space.Root(), "Resolve.js"), []byte("export function Resolve(x){return x}\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := space.Validate(ctx); err == nil || !strings.Contains(err.Error(), "canonically formatted") {
		t.Fatalf("expected canonical format rejection, got %v", err)
	}
}

func TestValidationRequiresEntrypointExportsAndExactSourceSuffixes(t *testing.T) {
	ctx := context.Background()
	for _, test := range []struct {
		name   string
		path   string
		source string
		want   string
	}{
		{
			name:   "missing Resolve export",
			path:   "Resolve.js",
			source: `export const Other = true;`,
			want:   "required Resolve export",
		},
		{
			name:   "missing Test export",
			path:   "Test.js",
			source: `export const Other = true;`,
			want:   "required Test export",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			space := initializedSpace(t)
			editor, err := space.Editor(RoleLearning)
			if err != nil {
				t.Fatal(err)
			}
			if test.path == "Resolve.js" {
				if err := editor.Write(ctx, "Test.js", `export function Test() {}`); err != nil {
					t.Fatal(err)
				}
			}
			if err := editor.Write(ctx, test.path, test.source); err != nil {
				t.Fatal(err)
			}
			if err := space.Validate(ctx); err == nil || !strings.Contains(err.Error(), test.want) {
				t.Fatalf("expected %q rejection, got %v", test.want, err)
			}
		})
	}

	space := initializedSpace(t)
	editor, err := space.Editor(RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Memory/state.JSON", `{}`); err == nil {
		t.Fatal("Learning created an uppercase JSON source suffix")
	}
	if jsonAllowed(RoleResolve, JSONRead, "Memory/state.JSON") {
		t.Fatal("JSON Host accepted an uppercase JSON suffix")
	}
	if err := os.WriteFile(filepath.Join(space.Root(), "Memory", "state.JSON"), []byte("{}\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := space.Validate(ctx); err == nil || !strings.Contains(err.Error(), "unsupported") {
		t.Fatalf("uppercase source suffix passed validation: %v", err)
	}
}

func TestWorkspaceAlwaysExposesEmptyReadOnlyReferenceLibrary(t *testing.T) {
	space := initializedSpace(t)
	workspace, err := space.NewWorkspace(WorkspaceOptions{Role: RoleLearning})
	if err != nil {
		t.Fatal(err)
	}
	defer workspace.Close()
	if info, err := os.Stat(workspace.CognitionRoot()); err != nil || !info.IsDir() {
		t.Fatalf("CognitionSpace workspace link is invalid: %v", err)
	}
	if info, err := os.Stat(workspace.ReferenceRoot()); err != nil || !info.IsDir() {
		t.Fatalf("ReferenceLibrary workspace link is invalid: %v", err)
	}
	if _, err := space.NewWorkspace(WorkspaceOptions{Role: RoleResolve}); err == nil {
		t.Fatal("Resolve unexpectedly received an Agent workspace")
	}
}

func TestAgentFacingErrorsRedactPhysicalSpaceRoot(t *testing.T) {
	space := initializedSpace(t)
	_, err := space.Reader(RoleInputTranslation).Read(
		context.Background(), "Interface/Missing.js", 0, 16,
	)
	if err == nil {
		t.Fatal("missing source read succeeded")
	}
	if strings.Contains(err.Error(), space.Root()) ||
		!strings.Contains(err.Error(), "CognitionSpace") {
		t.Fatalf("physical root leaked through Reader error: %v", err)
	}
	if !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("path redaction lost errors.Is semantics: %v", err)
	}

	_, err = space.ReadModule(
		context.Background(), RoleInputTranslation, "Interface/Missing.js",
	)
	if err == nil || strings.Contains(err.Error(), space.Root()) {
		t.Fatalf("physical root leaked through module loader error: %v", err)
	}
}

func TestCognitionPathsAndEntryNamesRequireUTF8(t *testing.T) {
	space := initializedSpace(t)
	invalid := "Interface/" + string([]byte{0xff}) + ".js"
	if _, err := space.Reader(RoleInputTranslation).Read(
		context.Background(), invalid, 0, 16,
	); err == nil || !strings.Contains(err.Error(), "UTF-8") {
		t.Fatalf("invalid UTF-8 tool path was accepted: %v", err)
	}
	path := filepath.Join(space.Root(), "Interface", string([]byte{0xff})+".js")
	if err := os.WriteFile(path, []byte("export default 1;\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := space.Validate(context.Background()); err == nil ||
		!strings.Contains(err.Error(), "UTF-8") {
		t.Fatalf("invalid UTF-8 Cognition entry was accepted: %v", err)
	}
}

func TestJavaScriptHostPermissionsAreRoleScoped(t *testing.T) {
	for _, operation := range []JSONOperation{JSONWrite, JSONCreate, JSONRemove, JSONMove} {
		if !jsonAllowed(RoleTest, operation, "Memory/state.json") {
			t.Fatalf("Test role cannot mutate Memory JSON operation %d", operation)
		}
	}
	if !jsonAllowed(RoleTest, JSONRead, "Memory/state.json") ||
		!jsonAllowed(RoleTest, JSONRead, "Test/fixture.json") {
		t.Fatal("Test role must be able to read Memory and Test JSON fixtures")
	}
	if jsonAllowed(RoleTest, JSONWrite, "Test/fixture.json") {
		t.Fatal("Test role unexpectedly writes Test JSON fixtures")
	}
	if jsonAllowed(RoleInputTranslation, JSONRead, "Test/fixture.json") ||
		jsonAllowed(RoleOutputTranslation, JSONWrite, "Memory/state.json") {
		t.Fatal("Translation role exceeded its read-only Memory JSON capability")
	}
	if !jsonAllowed(RoleResolve, JSONWrite, "Memory/state.json") ||
		jsonAllowed(RoleResolve, JSONWrite, "Test/fixture.json") {
		t.Fatal("Resolve JSON mutation must be limited to Memory")
	}
	if moduleAllowed(RoleInputTranslation, "Resolve.js") ||
		moduleAllowed(RoleOutputTranslation, "Test.js") ||
		!moduleAllowed(RoleTest, "Test/helper.js") {
		t.Fatal("JavaScript module graph role boundary is incorrect")
	}
}

func TestJSONHostRejectsTraversalAndDirectoryOperations(t *testing.T) {
	ctx := context.Background()
	space := initializedSpace(t)
	if _, err := space.JSON(ctx, RoleResolve, JSONCreate, "Memory/../Memory/state.json", "", `{}`); err == nil {
		t.Fatal("JSON Host accepted a path containing a parent traversal")
	}
	if _, err := space.JSON(ctx, RoleResolve, JSONCreate, "Memory/state.json/", "", `{}`); err == nil {
		t.Fatal("JSON Host accepted a directory path")
	}
	if _, err := space.JSON(ctx, RoleResolve, JSONCreate, "Memory/state.json", "", `{}`); err != nil {
		t.Fatalf("create JSON fixture: %v", err)
	}

	editor, err := space.Editor(RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Memory/archive.json/", ""); err != nil {
		t.Fatalf("create directory fixture: %v", err)
	}
	if _, err := space.JSON(ctx, RoleResolve, JSONRemove, "Memory/archive.json", "", ""); err == nil ||
		!strings.Contains(err.Error(), "regular file") {
		t.Fatalf("JSON Host removed a directory: %v", err)
	}
	if _, err := space.JSON(ctx, RoleResolve, JSONMove, "Memory/archive.json", "Memory/renamed.json", ""); err == nil ||
		!strings.Contains(err.Error(), "regular file") {
		t.Fatalf("JSON Host moved a directory: %v", err)
	}
	if info, err := os.Stat(filepath.Join(space.Root(), "Memory", "archive.json")); err != nil || !info.IsDir() {
		t.Fatalf("JSON directory fixture changed after rejected operations: %v", err)
	}
}

func TestJSONHostRejectsHiddenPathsForEveryOperation(t *testing.T) {
	ctx := context.Background()
	space := initializedSpace(t)
	for _, test := range []struct {
		name        string
		operation   JSONOperation
		path        string
		destination string
	}{
		{name: "read hidden file", operation: JSONRead, path: "Memory/.runtime.json"},
		{name: "write hidden file", operation: JSONWrite, path: "Memory/.runtime.json"},
		{name: "create hidden file", operation: JSONCreate, path: "Memory/.runtime.json"},
		{name: "remove hidden file", operation: JSONRemove, path: "Memory/.runtime.json"},
		{name: "move hidden source", operation: JSONMove, path: "Memory/.runtime.json", destination: "Memory/state.json"},
		{name: "move hidden destination", operation: JSONMove, path: "Memory/state.json", destination: "Memory/.runtime.json"},
		{name: "nested hidden directory", operation: JSONRead, path: "Memory/.runtime/state.json"},
	} {
		t.Run(test.name, func(t *testing.T) {
			if _, err := space.JSON(ctx, RoleResolve, test.operation, test.path, test.destination, `{}`); err == nil {
				t.Fatalf("JSON Host accepted hidden path %q for operation %d", test.path, test.operation)
			}
		})
	}
}

func TestSearchUsesRipgrepAndFiltersHiddenOrRoleInvisibleResults(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("the fake ripgrep fixture is a POSIX shell script")
	}
	ctx := context.Background()
	space := initializedSpace(t)
	editor, err := space.Editor(RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Interface/Visible.js", `export const Visible = true;`); err != nil {
		t.Fatal(err)
	}
	arguments := filepath.Join(t.TempDir(), "args.txt")
	executable := filepath.Join(t.TempDir(), "rg")
	script := "#!/bin/sh\nprintf '%s\\n' \"$@\" > \"$KONSUPU_COGNITION_RG_ARGS\"\nprintf '%s\\n' '{\"type\":\"match\",\"data\":{\"path\":{\"text\":\"Interface/Visible.js\"},\"lines\":{\"text\":\"visible\\n\"},\"line_number\":1,\"absolute_offset\":0,\"submatches\":[]}}'\nprintf '%s\\n' '{\"type\":\"match\",\"data\":{\"path\":{\"text\":\"Interface/.private.js\"},\"lines\":{\"text\":\"private\\n\"},\"line_number\":1,\"absolute_offset\":0,\"submatches\":[]}}'\nprintf '%s\\n' '{\"type\":\"match\",\"data\":{\"path\":{\"text\":\"Memory/private.json\"},\"lines\":{\"text\":\"memory\\n\"},\"line_number\":1,\"absolute_offset\":0,\"submatches\":[]}}'\n"
	if err := os.WriteFile(executable, []byte(script), 0o700); err != nil {
		t.Fatal(err)
	}
	t.Setenv("KONSUPU_COGNITION_RG_ARGS", arguments)
	if err := space.SetRipgrep(executable); err != nil {
		t.Fatal(err)
	}
	result, err := space.Reader(RoleInputTranslation).Search(ctx, []string{"-e", "visible"})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Records) != 1 || result.Records[0].Path != "Interface/Visible.js" {
		t.Fatalf("Cognition search leaked hidden or role-invisible records: %#v", result)
	}
	data, err := os.ReadFile(arguments)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(data), "--hidden\n") || !strings.Contains(string(data), "Interface\n") {
		t.Fatalf("Cognition ripgrep argv violated visibility policy: %q", data)
	}
}

func TestRuntimeLockBlocksAnotherProcessAndIsReleasedAfterProcessExit(t *testing.T) {
	const helperEnvironment = "KONSUPU_RUNTIME_LOCK_TEST_MODE"
	const rootEnvironment = "KONSUPU_RUNTIME_LOCK_TEST_ROOT"
	if mode := os.Getenv(helperEnvironment); mode != "" {
		lock, err := AcquireRuntimeLock(os.Getenv(rootEnvironment))
		if mode == "blocked" && errors.Is(err, errRuntimeAlreadyActive) {
			return
		}
		if mode == "abandon" && err == nil {
			// Do not close the file. Process exit must release its advisory lock.
			_ = lock
			return
		}
		if err == nil {
			_ = lock.Close()
			t.Fatalf("child process unexpectedly acquired Runtime lock in %s mode", mode)
		}
		t.Fatalf("child process received an unexpected lock error in %s mode: %v", mode, err)
	}

	root := filepath.Join(t.TempDir(), "space")
	if err := InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	lock, err := AcquireRuntimeLock(root)
	if err != nil {
		t.Fatal(err)
	}
	defer lock.Close()
	command := exec.Command(os.Args[0], "-test.run=^TestRuntimeLockBlocksAnotherProcessAndIsReleasedAfterProcessExit$")
	command.Env = append(os.Environ(), helperEnvironment+"=blocked", rootEnvironment+"="+root)
	if output, err := command.CombinedOutput(); err != nil {
		t.Fatalf("second process did not reject the Runtime lock: %v\n%s", err, output)
	}
	if err := lock.Close(); err != nil {
		t.Fatal(err)
	}
	command = exec.Command(os.Args[0], "-test.run=^TestRuntimeLockBlocksAnotherProcessAndIsReleasedAfterProcessExit$")
	command.Env = append(os.Environ(), helperEnvironment+"=abandon", rootEnvironment+"="+root)
	if output, err := command.CombinedOutput(); err != nil {
		t.Fatalf("child process could not acquire Runtime lock: %v\n%s", err, output)
	}
	lock, err = AcquireRuntimeLock(root)
	if err != nil {
		t.Fatalf("lock remained stale after child process exit: %v", err)
	}
	if err := lock.Close(); err != nil {
		t.Fatal(err)
	}
	space, err := Open(root)
	if err != nil {
		t.Fatal(err)
	}
	if err := space.Validate(context.Background()); err != nil {
		t.Fatalf("Runtime lock affected Cognition validation: %v", err)
	}
	if _, err := space.Reader(RoleLearning).Read(context.Background(), runtimeLockFileName, 0, 1); err == nil {
		t.Fatal("Agent-facing view accessed hidden Runtime lock")
	}
}

func initializedSpace(t *testing.T) *Space {
	t.Helper()
	root := filepath.Join(t.TempDir(), "space")
	if err := InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := Open(root)
	if err != nil {
		t.Fatal(err)
	}
	return space
}
