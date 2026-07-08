/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2026 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

export { runTests } from './runTests';
export { downloadAndUnzipPositron } from './download';
export {
  resolveCliArgsFromPositronExecutablePath,
  getPlatformDescriptor,
  hostPlatform,
} from './platform';
export {
  PositronPlatformNotSupportedError,
  PositronVersionNotFoundError,
  PositronChecksumError,
} from './errors';

export type { PositronPlatform, PlatformDescriptor } from './platform';
export type { PositronChannel, DownloadOptions, PositronTestOptions } from './types';
export type { ResolvedBuild } from './resolve';
