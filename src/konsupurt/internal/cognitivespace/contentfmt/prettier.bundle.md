# prettier.bundle.js

`prettier.bundle.js` is a vendored build artifact, not source. It is committed
so that npm is never a Konsupu build dependency.

It is prettier 3.9.8 with its `meriyah` parser and `estree` printer bundled into
one plain global script. The script installs:

```js
globalThis.__konsupuFormat = (source) => prettier.format(source, { parser: "meriyah", plugins: [parser, estree] });
```

The script is deliberately a global script rather than an ES module: konsupujs
compiles it with `JS_EVAL_FLAG_COMPILE_ONLY` and evaluates it without a module
loader, so cognition module resolution stays untouched.

`contentfmt.Formatter` compiles the bundle once per process and keeps the
resulting function in one isolated QuickJS runtime; every later call reuses it.
The binding lives in `src/konsupurt/internal/cognitivespace/formatjs`. Prettier's
entry returns a Promise, so the formatter drains its own private QuickJS job
queue; that runtime is isolated from cognition execution, which stays
synchronous.

## Regenerating

Only do this to change the pinned prettier version. The bundle is produced with
the esbuild dependency the repository already has, so no new dependency is
required.

```sh
npm pack prettier@3.9.8
mkdir -p /tmp/prettier-build && cd /tmp/prettier-build
tar xf /path/to/prettier-3.9.8.tgz
```

Create `entry.js`:

```js
import * as prettier from "./package/standalone.mjs";
import * as parser from "./package/plugins/meriyah.mjs";
import * as estree from "./package/plugins/estree.mjs";
globalThis.__konsupuFormat = (source) =>
  prettier.format(source, { parser: "meriyah", plugins: [parser, estree] });
```

Create `bundle.go` in a throwaway module that requires `github.com/evanw/esbuild`
and bundles `entry.js` with `Format: api.FormatIIFE`, `Platform: api.PlatformNeutral`,
`Target: api.ES2020`, and `LegalComments: api.LegalCommentsInline`. Write the
single output file to `prettier.bundle.js`.

The result must contain no Node built-ins (`require`, `process`, `Buffer`,
`__dirname`); a bare `module.exports` match inside prettier's own grammar
strings is expected and harmless.

After replacing the file, run `./xmake.agents test` and `konsupu format` on a
Cognition Space: prettier output is deterministic for a given version, but a
version change can reformat existing source.
