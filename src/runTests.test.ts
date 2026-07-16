import { test } from 'node:test';
import assert from 'node:assert';
import * as fsp from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { mergeLaunchArgs, seedUserSettings } from './runTests';

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

test('seedUserSettings writes User/settings.json disabling extension auto-update', async () => {
  const userDataDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'seed-settings-test-'));
  try {
    await seedUserSettings(userDataDir);

    const settingsPath = path.join(userDataDir, 'User', 'settings.json');
    const settings = JSON.parse(await fsp.readFile(settingsPath, 'utf8'));

    assert.strictEqual(settings['extensions.autoUpdate'], false);
    assert.strictEqual(settings['extensions.autoCheckUpdates'], false);
  } finally {
    await fsp.rm(userDataDir, { recursive: true, force: true });
  }
});
