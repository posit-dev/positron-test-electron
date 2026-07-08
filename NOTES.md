# Research Notes

This document preserves the original prototype's research findings from the spike on the Positron API (`posit-dev/positron#14530`). These notes document what was learned during development but are not essential for using the package.

## Findings

### The Positron API is live in a downloaded build

Confirmed. Running against daily `2026.08.0` (build 23), inside the downloaded
extension host:

- `inPositron()` returns `true`.
- `tryAcquirePositronApi()` returns a live object (not `undefined`, which is what
  it returns under plain VS Code).
- `positron.version` is a non-empty string (`"2026.08.0"`).

This is the whole point of the spike: an extension that depends only on
`@posit-dev/positron` and targets a downloaded Positron gets the real API in its
test host, with no clone/build of the fork.

**Why it works:** `src/bootstrap-esm.ts` defines
`globalThis.acquirePositronApi = () => require('positron')`. That bootstrap is
shared by the extension host process, so the global is present for any loaded
extension in a real (and therefore downloaded) build.
`@posit-dev/positron`'s `tryAcquirePositronApi()` just calls that global.

## Gotchas

- **Gatekeeper: not an issue with a programmatic download.** The cached
  `Positron.app` carries only `com.apple.provenance`, never
  `com.apple.quarantine`. macOS applies quarantine to browser/LaunchServices
  downloads, not to an archive fetched with `https.get` and extracted with CLI
  `unzip`. So Gatekeeper does not block the headless launch. `runTests.ts` still
  runs `xattr -dr com.apple.quarantine` defensively; it is a no-op in the common
  case (and would matter only if a build were obtained via a browser).
- **`--user-data-dir` is mandatory.** The runner launches with a fresh temp
  `--user-data-dir`. It isolates state across runs and, combined with the flags
  below, keeps first-run prompts out of the way. positron-python's harness also
  needs it to dodge a path-length issue on CI.
- **First-run dialogs are suppressed** by the clean user-data-dir plus
  `--skip-welcome` and `--skip-release-notes`. No welcome, release-notes, or
  workspace-trust prompt appeared; the run is fully headless.
- **`--disable-extensions` does not disable Positron's built-in extensions.**
  It disables third-party/user extensions, but built-ins still load: on the first
  run `posit.assistant` auto-updated and `positron.positron-assistant` logged a
  benign `authentication id 'posit-ai' has already been registered` warning (and
  some `GitHubLoginFailed` rejections, expected with no credentials in a headless
  host). The extension under test (`extensionDevelopmentPath`) always loads
  regardless. None of this affected the API acquisition.
- **Built-in runtime providers register runtimes under `--disable-extensions`.**
  Verified by `runtime.test.ts`: with the flag on, `positron-python` and
  `positron-r` both activate (positron-python via its `onStartupFinished`
  activation event) and register runtimes -- 26 total (`Python`, `R`) on this dev
  machine. So a third-party author can keep `--disable-extensions` for a clean,
  deterministic host and still exercise runtime-dependent `positron.*` APIs
  (`getRegisteredRuntimes`, `executeCode`, sessions). Note discovery is async and
  providers register at different speeds -- R is near-instant, Python interpreter
  discovery takes longer -- so a runtime test must poll/wait for the set to settle
  rather than reading it once. Keep the flag on by default; only drop it (and
  install the specific dependency via `resolveCliArgsFromVSCodeExecutablePath` +
  `--install-extension`) when the extension depends on a *marketplace* extension.

## `buildNumber` typings/runtime mismatch (follow-up)

`src/positron-dts/positron.d.ts` declares `export const buildNumber: number`, but
at runtime `positron.buildNumber` is a **string** (`"23"`). The test asserts only
that it is defined and logs its actual `typeof`. Worth a follow-up fix to the
typings (or the runtime value) so they agree.
