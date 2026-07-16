import { spawnSync } from 'child_process';
import * as fsp from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { runTests as vscodeRunTests } from '@vscode/test-electron';
import { downloadAndUnzipPositron } from './download';
import { PositronTestOptions } from './types';

const BASE_LAUNCH_ARGS = ['--skip-welcome', '--skip-release-notes'];

/**
 * Seed the test host's user settings so it behaves deterministically.
 *
 * The important one is disabling extension auto-update. When tests run with
 * extensions enabled (`disableExtensions: false`), Positron's startup
 * auto-update treats the extension loaded from `extensionDevelopmentPath` as an
 * "outdated" gallery extension and disables/replaces it mid-run — so
 * `vscode.extensions.getExtension(...)` returns undefined by the time the tests
 * query it. A test host should never reach out to the gallery anyway, so we
 * turn off both the background update check and the update itself.
 *
 * Written into the temp user-data-dir we control, which avoids passing a second
 * `--user-data-dir` launch arg (`@vscode/test-electron` chokes on the
 * duplicate) and works regardless of `disableExtensions`.
 */
export async function seedUserSettings(userDataDir: string): Promise<void> {
  const userDir = path.join(userDataDir, 'User');
  await fsp.mkdir(userDir, { recursive: true });
  await fsp.writeFile(
    path.join(userDir, 'settings.json'),
    JSON.stringify(
      {
        'extensions.autoUpdate': false,
        'extensions.autoCheckUpdates': false,
      },
      null,
      2,
    ),
  );
}

export function mergeLaunchArgs(
  userDataDir: string,
  extra: string[] = [],
  disableExtensions = true,
): string[] {
  return [
    '--user-data-dir', userDataDir,
    ...(disableExtensions ? ['--disable-extensions'] : []),
    ...BASE_LAUNCH_ARGS,
    ...extra,
  ];
}

export async function runTests(options: PositronTestOptions): Promise<number> {
  const executablePath = await downloadAndUnzipPositron(options);

  // Defensive Gatekeeper safety net: a no-op for programmatic downloads (they carry
  // no com.apple.quarantine), but keeps the launch robust if a build was obtained
  // via a browser. `xattr -dr` exits 0 whether or not the attribute was present.
  if (process.platform === 'darwin') {
    const appBundle = path.resolve(executablePath, '..', '..', '..'); // Positron.app
    spawnSync('xattr', ['-dr', 'com.apple.quarantine', appBundle]);
  }

  // A clean temp user-data-dir isolates state across runs and suppresses first-run
  // prompts (workspace trust, release notes).
  const userDataDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'positron-uddir-'));
  await seedUserSettings(userDataDir);

  return vscodeRunTests({
    vscodeExecutablePath: executablePath,
    extensionDevelopmentPath: options.extensionDevelopmentPath,
    extensionTestsPath: options.extensionTestsPath,
    launchArgs: mergeLaunchArgs(
      userDataDir,
      options.launchArgs,
      options.disableExtensions ?? true,
    ),
  });
}
