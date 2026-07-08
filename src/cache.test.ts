/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2026 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getPlatformDescriptor } from './platform';
import { DEFAULT_CACHE_ROOT, buildDir, executablePath, isComplete, markComplete } from './cache';

const descriptor = getPlatformDescriptor('darwin-arm64');

test('buildDir keys by channel/version/platform under the cache root', () => {
  const dir = buildDir('.positron-test', 'daily', '2026.08.0-365', descriptor);
  assert.strictEqual(dir, path.join('.positron-test', 'daily', '2026.08.0-365', 'darwin-arm64'));
});

test('DEFAULT_CACHE_ROOT is .positron-test', () => {
  assert.strictEqual(DEFAULT_CACHE_ROOT, '.positron-test');
});

test('executablePath joins the descriptor executable path', () => {
  const exe = executablePath('/x/darwin-arm64', descriptor);
  assert.strictEqual(exe, path.join('/x/darwin-arm64', 'Positron.app', 'Contents', 'MacOS', 'Positron'));
});

test('isComplete is false until markComplete writes the matching version', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pte-cache-'));
  assert.strictEqual(await isComplete(dir, '1.2.3'), false);
  await markComplete(dir, '1.2.3');
  assert.strictEqual(await isComplete(dir, '1.2.3'), true);
  assert.strictEqual(await isComplete(dir, '9.9.9'), false); // version mismatch
});
