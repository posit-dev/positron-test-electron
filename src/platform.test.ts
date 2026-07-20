import { test } from 'node:test';
import assert from 'node:assert';
import * as path from 'path';
import {
  getPlatformDescriptor,
  hostPlatform,
  resolveCliArgsFromPositronExecutablePath,
} from './platform';
import { PositronPlatformNotSupportedError } from './errors';

test('getPlatformDescriptor returns a mac descriptor for darwin-arm64', () => {
  const d = getPlatformDescriptor('darwin-arm64');
  assert.strictEqual(d.cdnSegment, 'mac');
  assert.strictEqual(d.arch, 'arm64');
  assert.strictEqual(d.archiveName('2026.08.0-365'), 'Positron-darwin-2026.08.0-365-arm64.zip');
});

test('getPlatformDescriptor returns a win descriptor for win32-x64', () => {
  const d = getPlatformDescriptor('win32-x64');
  assert.strictEqual(d.cdnSegment, 'win');
  assert.strictEqual(d.arch, 'x86_64'); // CDN path segment differs from the archive-name arch
  assert.strictEqual(d.archiveName('2026.08.0-365'), 'Positron-win32-2026.08.0-365-x64.zip');
  assert.deepStrictEqual(d.appExecutableRelPath, ['Positron.exe']);
});

test('getPlatformDescriptor returns a linux descriptor for linux-x64', () => {
  const d = getPlatformDescriptor('linux-x64');
  assert.strictEqual(d.cdnSegment, 'linux');
  assert.strictEqual(d.arch, 'x86_64');
  assert.strictEqual(d.archiveName('2026.08.0-365'), 'Positron-linux-2026.08.0-365-x64.tar.gz');
  assert.deepStrictEqual(d.appExecutableRelPath, ['positron']);
});

test('getPlatformDescriptor throws for an unsupported platform', () => {
  assert.throws(() => getPlatformDescriptor('win32-ia32'), PositronPlatformNotSupportedError);
});

test('hostPlatform resolves to a supported descriptor on this host (mac/win/linux x64/arm64)', function () {
  const { platform, arch } = process;
  const supportedHost =
    (platform === 'darwin' || platform === 'win32' || platform === 'linux') &&
    (arch === 'arm64' || arch === 'x64');
  if (!supportedHost) {
    // Unsupported host (e.g. linux-ia32): hostPlatform must reject, not guess.
    assert.throws(() => hostPlatform(), PositronPlatformNotSupportedError);
    return;
  }
  const host = hostPlatform();
  assert.strictEqual(host, `${platform}-${arch}`);
  // hostPlatform and the descriptor map must agree — no unmapped host slips through.
  assert.strictEqual(getPlatformDescriptor(host).platform, host);
});

// The resolver uses path.resolve internally (which anchors to the current drive
// on Windows), so the expected values go through path.resolve too — keeping these
// assertions host-independent.
test('resolveCliArgsFromPositronExecutablePath derives the CLI path from the executable', () => {
  const exe = path.join('/cache', 'Positron.app', 'Contents', 'MacOS', 'Positron');
  const [cli] = resolveCliArgsFromPositronExecutablePath(exe, 'darwin-arm64');
  assert.strictEqual(
    cli,
    path.resolve('/cache', 'Positron.app', 'Contents', 'Resources', 'app', 'bin', 'positron'),
  );
});

test('resolveCliArgsFromPositronExecutablePath derives the CLI path on Windows', () => {
  const exe = path.join('/cache', 'Positron.exe');
  const [cli] = resolveCliArgsFromPositronExecutablePath(exe, 'win32-x64');
  assert.strictEqual(cli, path.resolve('/cache', 'bin', 'positron.cmd'));
});

test('resolveCliArgsFromPositronExecutablePath derives the CLI path on Linux', () => {
  const exe = path.join('/cache', 'positron');
  const [cli] = resolveCliArgsFromPositronExecutablePath(exe, 'linux-x64');
  assert.strictEqual(cli, path.resolve('/cache', 'bin', 'positron'));
});
