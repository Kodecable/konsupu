# Konsupu AGENTS.md

## Comments

Write comments in English.

## Build, Test, and Run

This project uses `xmake` as its build system. Use the `./xmake.agents` shell shim from the project root to build, test, and run the project. The shim sets project-local cache directories, switches to the project root, and forwards all arguments to `xmake`.

```shell
./xmake.agents build # Builds the default target and its dependencies.
./xmake.agents run konsupurt --you-args-here # DO NOT run executable directly unless you know exactly what you are doing.
./xmake.agents test # DO NOT run `go test ./...` directly. It's missing Envs.
```

To run the Foundation self-test alone (`src/foundation/Test.js`) use the `test` command. It reads the source and does not create a Revision or modify it; it prints `passed` and exits 0 only when every assertion passes. `go_env_run` executes from `src/konsupurt`, so pass absolute paths:

```shell
./xmake.agents go_env_run -- "$PWD/build/linux/x86_64/release/konsupu" \
  test --space "$PWD/src/foundation" --config "$PWD/<config>.json"
```

`--config` is required. `Test.js` needs no LLM, so a placeholder config works as long as `context_window_tokens` is greater than `max_output_tokens`; `doc/Konsupu_Foundation_使用说明.md` has a ready-to-copy example.

Do NOT verify with `node src/foundation/Test.js`: `Test.js` only exports `Test()` and has no top-level call, so it runs nothing and always succeeds.

If you need to invoke `xmake` directly (you'd better have a good reason for it), run it from the project root and set the environment variables (see `./xmake.agents`. It's a shell script) to avoid accessing the user's cache. These paths keep xmake and Go caches inside the project, which is useful when working in the sandbox.

`xmake` or Go may require network access to download dependencies. DO NOT ignore or fake such failures. If network access is unavailable, ask the user for permission and then run the command with that access enabled.

A xmake task called `go_env_run` allow you run program in konsupurt go envs, and konsupurt workdir. Make sure run `go vet` and `staticcheck` (if installed) after your change.

```shell
./xmake.agents go_env_run -- go vet ./...
./xmake.agents go_env_run -- staticcheck ./...
# And you SHOULD NOT run `./xmake.agents go_env_run -- go test ./..`. It's missing link flags. Use `./xmake.agents test`.
```

Also note that xmake test does not cover foundation source. Using konsupu test.

## Known Issues

**GO toolchain says zig cc is missing**

Cache things. Run `./xmake.agents f -c` once and it should re-generate zig cc wrapper, but you will need read stdout to make sure it is using zig not gcc or clang.

**Changes not work**

Xmake using second-level mtime internally. If your changes are made in one second and run into this problem, just `./xmake.agents clean`.
