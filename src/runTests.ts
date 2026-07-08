/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2026 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { spawnSync } from 'child_process';
import * as fsp from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { runTests as vscodeRunTests } from '@vscode/test-electron';
import { downloadAndUnzipPositron } from './download';
import { PositronTestOptions } from './types';

const DEFAULT_LAUNCH_ARGS = ['--disable-extensions', '--skip-welcome', '--skip-release-notes'];

export function mergeLaunchArgs(userDataDir: string, extra: string[] = []): string[] {
  return ['--user-data-dir', userDataDir, ...DEFAULT_LAUNCH_ARGS, ...extra];
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

  return vscodeRunTests({
    vscodeExecutablePath: executablePath,
    extensionDevelopmentPath: options.extensionDevelopmentPath,
    extensionTestsPath: options.extensionTestsPath,
    launchArgs: mergeLaunchArgs(userDataDir, options.launchArgs),
  });
}
