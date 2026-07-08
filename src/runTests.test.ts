/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2026 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { test } from 'node:test';
import assert from 'node:assert';
import { mergeLaunchArgs } from './runTests';

test('mergeLaunchArgs prepends the user-data-dir and defaults, then extras', () => {
  const args = mergeLaunchArgs('/tmp/ud', ['--foo']);
  assert.deepStrictEqual(args, [
    '--user-data-dir', '/tmp/ud',
    '--disable-extensions', '--skip-welcome', '--skip-release-notes',
    '--foo',
  ]);
});

test('mergeLaunchArgs works with no extras', () => {
  const args = mergeLaunchArgs('/tmp/ud');
  assert.deepStrictEqual(args, [
    '--user-data-dir', '/tmp/ud',
    '--disable-extensions', '--skip-welcome', '--skip-release-notes',
  ]);
});
