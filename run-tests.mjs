// Cross-platform test runner. `node --test out/*.test.js` relies on the shell to
// expand the glob (bash does, PowerShell does not) and Node only expands globs in
// --test from v21+, so the glob approach fails on Windows + Node 20. Instead,
// discover the compiled test files here and pass them to the runner as explicit
// arguments, which needs no shell or Node globbing.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(root, 'out');

let files;
try {
  files = readdirSync(outDir)
    .filter((f) => f.endsWith('.test.js'))
    .map((f) => path.join('out', f));
} catch {
  files = [];
}

if (files.length === 0) {
  console.error('No compiled test files found in out/. Run `npm run build` first.');
  process.exit(1);
}

const res = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(res.status ?? 1);
