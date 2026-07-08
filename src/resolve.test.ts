/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2026 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { test } from 'node:test';
import assert from 'node:assert';
import { getPlatformDescriptor } from './platform';
import { channelSegment, archiveUrl, resolveBuild } from './resolve';

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
