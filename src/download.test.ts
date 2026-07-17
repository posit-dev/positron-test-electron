import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getPlatformDescriptor } from './platform';
import { isComplete, buildDir, markComplete } from './cache';
import { HttpError, PositronChecksumError, PositronVersionNotFoundError } from './errors';
import { downloadBuild, downloadAndUnzipPositron, extractCommand } from './download';
import type { ResolvedBuild } from './resolve';

const descriptor = getPlatformDescriptor('darwin-arm64');
// sha256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
const HELLO_SHA = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';

function build(sha256?: string): ResolvedBuild {
  return {
    version: '1.2.3',
    url: 'https://cdn.example/Positron-darwin-1.2.3-arm64.zip',
    sha256,
    descriptor,
    channel: 'daily',
  };
}

const writeHello = async (_url: string, dest: string) => { await fs.promises.writeFile(dest, 'hello'); };
const fakeExtract = (_archive: string, destDir: string) => {
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, 'placeholder'), 'x');
};

test('downloadBuild verifies sha256, extracts, and marks complete', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pte-dl-'));
  await downloadBuild(build(HELLO_SHA), dir, { getToFile: writeHello, extract: fakeExtract });
  assert.strictEqual(await isComplete(dir, '1.2.3'), true);
});

test('downloadBuild throws PositronChecksumError on mismatch and does not mark complete', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pte-dl-'));
  await assert.rejects(
    () => downloadBuild(build('deadbeef'), dir, { getToFile: writeHello, extract: fakeExtract }),
    PositronChecksumError,
  );
  assert.strictEqual(await isComplete(dir, '1.2.3'), false);
});

test('downloadBuild proceeds (warning) when no sha256 is available', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pte-dl-'));
  await downloadBuild(build(undefined), dir, { getToFile: writeHello, extract: fakeExtract });
  assert.strictEqual(await isComplete(dir, '1.2.3'), true);
});

test('downloadBuild maps a 404 to PositronVersionNotFoundError', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pte-dl-'));
  const notFound = async () => { throw new HttpError(404, 'nope'); };
  await assert.rejects(
    () => downloadBuild(build(HELLO_SHA), dir, { getToFile: notFound, extract: fakeExtract }),
    PositronVersionNotFoundError,
  );
});

test('downloadAndUnzipPositron short-circuits on a cache hit', async () => {
  const cacheRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pte-acq-'));
  const resolved = build(HELLO_SHA);
  const dir = buildDir(cacheRoot, 'daily', '1.2.3', descriptor);
  fs.mkdirSync(dir, { recursive: true });
  await markComplete(dir, '1.2.3');

  let downloadCalled = false;
  const exe = await downloadAndUnzipPositron(
    { cachePath: cacheRoot, platform: 'darwin-arm64' },
    {
      resolveBuild: async () => resolved,
      downloadBuild: async () => { downloadCalled = true; },
    },
  );
  assert.strictEqual(downloadCalled, false);
  assert.strictEqual(exe, path.join(dir, 'Positron.app', 'Contents', 'MacOS', 'Positron'));
});

test('downloadAndUnzipPositron downloads on a cache miss', async () => {
  const cacheRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pte-acq-'));
  let downloadCalled = false;
  await downloadAndUnzipPositron(
    { cachePath: cacheRoot, platform: 'darwin-arm64' },
    {
      resolveBuild: async () => build(HELLO_SHA),
      downloadBuild: async () => { downloadCalled = true; },
    },
  );
  assert.strictEqual(downloadCalled, true);
});

test('extractCommand uses tar -xzf for .tar.gz regardless of host platform', () => {
  for (const platform of ['linux', 'darwin', 'win32'] as NodeJS.Platform[]) {
    const cmd = extractCommand('/tmp/Positron-linux-1-x64.tar.gz', '/dest', platform);
    assert.strictEqual(cmd.command, 'tar');
    assert.deepStrictEqual(cmd.args, ['-xzf', '/tmp/Positron-linux-1-x64.tar.gz', '-C', '/dest']);
  }
  // .tgz is also recognized
  assert.strictEqual(extractCommand('/tmp/x.tgz', '/dest', 'linux').command, 'tar');
});

test('extractCommand uses bsdtar (tar) for a Windows zip', () => {
  const cmd = extractCommand('/tmp/Positron-win32-1-x64.zip', '/dest', 'win32');
  // System32\tar.exe when present, else 'tar' — host-independent shape check.
  assert.match(cmd.command, /tar(\.exe)?$/i);
  assert.deepStrictEqual(cmd.args, ['-xf', '/tmp/Positron-win32-1-x64.zip', '-C', '/dest']);
});

test('extractCommand uses unzip for a macOS zip', () => {
  const cmd = extractCommand('/tmp/Positron-darwin-1-arm64.zip', '/dest', 'darwin');
  assert.strictEqual(cmd.command, 'unzip');
  assert.deepStrictEqual(cmd.args, ['-q', '/tmp/Positron-darwin-1-arm64.zip', '-d', '/dest']);
});
