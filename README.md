# @posit-dev/positron-test-electron

Download Positron and run `@vscode/test-electron`-style extension-host
integration tests against the live `positron.*` API without building Positron from
source.

> Supports macOS (`darwin-arm64`, `darwin-x64`), Windows (`win32-x64`, `win32-arm64`),
> and Linux (`linux-x64`, `linux-arm64`).
>
> **Windows/Linux caveat:** `channel: 'daily'` and pinned `version`s work today. The
> latest `channel: 'stable'` is not available yet — the first stable release built
> from the new archive workflow has not been cut. Until then, use `daily` or pin a
> `version` on Windows/Linux. (macOS `stable` works.) See
> [issue #2](https://github.com/posit-dev/positron-test-electron/issues/2).

## Install

```sh
npm install --save-dev @posit-dev/positron-test-electron
```

## Usage (programmatic)

```ts
import * as path from 'path';
import { runTests } from '@posit-dev/positron-test-electron';

async function main() {
  const code = await runTests({
    channel: 'daily', // or 'stable'; or pin: version: '2026.08.0-365'
    extensionDevelopmentPath: path.resolve(__dirname, '../../'),
    extensionTestsPath: path.resolve(__dirname, './suite/index.js'),
  });
  process.exit(code);
}
main();
```

## Usage (CLI)

```sh
npx positron-test-electron \
  --channel daily \
  --extension-development-path . \
  --extension-tests-path ./out/test/index.js
```

## Options

| Option | CLI flag | Default | Meaning |
|---|---|---|---|
| `channel` | `--channel` | `daily` | `stable` → releases, `daily` → dailies |
| `version` | `--version` | latest | exact pin, e.g. `2026.08.0-365` (reproducible CI) |
| `platform` | `--platform` | host | `darwin-arm64` \| `darwin-x64` \| `win32-x64` \| `win32-arm64` \| `linux-x64` \| `linux-arm64` |
| `cachePath` | `--cache-path` | `.positron-test` | cache root |
| `extensionDevelopmentPath` | `--extension-development-path` | — | required |
| `extensionTestsPath` | `--extension-tests-path` | — | required |
| `disableExtensions` | `--enable-extensions` (sets `false`) | `true` | isolate the extension under test; set `false` when tests need other extensions |
| `launchArgs` | after `--` | see below | merged after the defaults |

Default launch args: `--disable-extensions --skip-welcome --skip-release-notes`, plus
a fresh temp `--user-data-dir`. When `disableExtensions` is `false`,
`--disable-extensions` is omitted so Positron's bundled extensions (language
runtimes, notebook export, etc.) load alongside the extension under test.
