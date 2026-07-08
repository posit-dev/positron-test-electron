#!/usr/bin/env node
/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2026 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/
import { runTests } from './runTests';
import { PositronTestOptions, PositronChannel } from './types';
import { PositronPlatform } from './platform';

export function parseArgs(argv: string[]): PositronTestOptions {
  const opts: Partial<PositronTestOptions> = {};
  const launchArgs: string[] = [];
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    switch (arg) {
      case '--channel': opts.channel = argv[++i] as PositronChannel; break;
      case '--version': opts.version = argv[++i]; break;
      case '--platform': opts.platform = argv[++i] as PositronPlatform; break;
      case '--cache-path': opts.cachePath = argv[++i]; break;
      case '--extension-development-path': opts.extensionDevelopmentPath = argv[++i]; break;
      case '--extension-tests-path': opts.extensionTestsPath = argv[++i]; break;
      case '--': launchArgs.push(...argv.slice(i + 1)); i = argv.length; break;
      default: throw new Error(`Unknown argument: ${arg}`);
    }
    i++;
  }
  if (!opts.extensionDevelopmentPath) {
    throw new Error('--extension-development-path is required');
  }
  if (!opts.extensionTestsPath) {
    throw new Error('--extension-tests-path is required');
  }
  if (launchArgs.length) {
    opts.launchArgs = launchArgs;
  }
  return opts as PositronTestOptions;
}

async function main(): Promise<void> {
  const code = await runTests(parseArgs(process.argv.slice(2)));
  process.exit(code);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
