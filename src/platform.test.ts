import { test } from 'node:test';
import assert from 'node:assert';
import * as path from 'path';
import {
  getPlatformDescriptor,
  resolveCliArgsFromPositronExecutablePath,
} from './platform';
import { PositronPlatformNotSupportedError } from './errors';

test('getPlatformDescriptor returns a mac descriptor for darwin-arm64', () => {
  const d = getPlatformDescriptor('darwin-arm64');
  assert.strictEqual(d.cdnSegment, 'mac');
  assert.strictEqual(d.arch, 'arm64');
  assert.strictEqual(d.archiveName('2026.08.0-365'), 'Positron-darwin-2026.08.0-365-arm64.zip');
});

test('getPlatformDescriptor throws for an unsupported platform', () => {
  assert.throws(() => getPlatformDescriptor('win32-x64'), PositronPlatformNotSupportedError);
});

test('resolveCliArgsFromPositronExecutablePath derives the CLI path from the executable', () => {
  const exe = path.join('/cache', 'Positron.app', 'Contents', 'MacOS', 'Positron');
  const [cli] = resolveCliArgsFromPositronExecutablePath(exe, 'darwin-arm64');
  assert.strictEqual(
    cli,
    path.join('/cache', 'Positron.app', 'Contents', 'Resources', 'app', 'bin', 'positron'),
  );
});
