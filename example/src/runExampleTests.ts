/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2026 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { runTests } from '@posit-dev/positron-test-electron';

async function main(): Promise<void> {
  const code = await runTests({
    channel: 'daily',
    extensionDevelopmentPath: path.resolve(__dirname, '..'),
    extensionTestsPath: path.resolve(__dirname, './test/index.js'),
  });
  process.exit(code);
}

main().catch((err) => {
  console.error('Failed to run Positron example integration test:', err);
  process.exit(1);
});
