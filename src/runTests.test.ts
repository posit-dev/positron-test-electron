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

test('mergeLaunchArgs omits --disable-extensions when disableExtensions is false', () => {
  const args = mergeLaunchArgs('/tmp/ud', ['--foo'], false);
  assert.deepStrictEqual(args, [
    '--user-data-dir', '/tmp/ud',
    '--skip-welcome', '--skip-release-notes',
    '--foo',
  ]);
});
