import { test } from 'node:test';
import assert from 'node:assert';
import { getPlatformDescriptor } from './platform';
import { channelSegment, archiveUrl, resolveBuild } from './resolve';
import { PositronStableNotAvailableError } from './errors';

const descriptor = getPlatformDescriptor('darwin-arm64');

test('channelSegment maps stable→releases and daily→dailies', () => {
  assert.strictEqual(channelSegment('stable'), 'releases');
  assert.strictEqual(channelSegment('daily'), 'dailies');
});

test('archiveUrl builds the pinned CDN url', () => {
  const url = archiveUrl('daily', descriptor, '2026.08.0-365');
  assert.strictEqual(
    url,
    'https://cdn.posit.co/positron/dailies/mac/arm64/Positron-darwin-2026.08.0-365-arm64.zip',
  );
});

test('archiveUrl builds the Windows CDN url (x86_64 path segment, x64 archive)', () => {
  const url = archiveUrl('daily', getPlatformDescriptor('win32-x64'), '2026.08.0-365');
  assert.strictEqual(
    url,
    'https://cdn.posit.co/positron/dailies/win/x86_64/Positron-win32-2026.08.0-365-x64.zip',
  );
});

test('archiveUrl builds the Linux CDN url (tar.gz)', () => {
  const url = archiveUrl('stable', getPlatformDescriptor('linux-x64'), '2026.08.0-365');
  assert.strictEqual(
    url,
    'https://cdn.posit.co/positron/releases/linux/x86_64/Positron-linux-2026.08.0-365-x64.tar.gz',
  );
});

test('resolveBuild (latest) reads version/url/sha256 from releases.json', async () => {
  const fakeJson = JSON.stringify({
    version: '2026.08.0-365',
    url: 'https://cdn.posit.co/positron/dailies/mac/arm64/Positron-darwin-2026.08.0-365-arm64.zip',
    sha256hash: 'abc123',
    commit: 'deadbeef',
    codeoss_version: '1.118.0',
  });
  const build = await resolveBuild(
    { channel: 'daily', platform: 'darwin-arm64' },
    { getJson: async () => ({ status: 200, body: fakeJson }) },
  );
  assert.strictEqual(build.version, '2026.08.0-365');
  assert.strictEqual(build.sha256, 'abc123');
  assert.strictEqual(build.channel, 'daily');
});

test('resolveBuild (stable latest) throws a clear error when the CDN object is missing', async () => {
  // Windows/Linux stable latest 403s until the first stable archive release (issue #2).
  await assert.rejects(
    () => resolveBuild(
      { channel: 'stable', platform: 'win32-x64' },
      { getJson: async () => ({ status: 403, body: '' }) },
    ),
    PositronStableNotAvailableError,
  );
});

test('resolveBuild (stable pinned) works without hitting the missing releases.json', async () => {
  const build = await resolveBuild(
    { channel: 'stable', platform: 'linux-x64', version: '2026.08.0-124' },
    { getJson: async () => { throw new Error('must not fetch when pinned'); } },
  );
  assert.strictEqual(
    build.url,
    'https://cdn.posit.co/positron/releases/linux/x86_64/Positron-linux-2026.08.0-124-x64.tar.gz',
  );
});

test('resolveBuild (pinned) is deterministic and makes no network call', async () => {
  const build = await resolveBuild(
    { channel: 'daily', platform: 'darwin-arm64', version: '2026.06.1-6' },
    { getJson: async () => { throw new Error('must not fetch when pinned'); } },
  );
  assert.strictEqual(build.version, '2026.06.1-6');
  assert.strictEqual(build.sha256, undefined);
  assert.strictEqual(
    build.url,
    'https://cdn.posit.co/positron/dailies/mac/arm64/Positron-darwin-2026.06.1-6-arm64.zip',
  );
});
