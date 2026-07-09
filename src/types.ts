import { PositronPlatform } from './platform';

export type PositronChannel = 'stable' | 'daily';

export interface DownloadOptions {
  /** 'stable' → releases, 'daily' → dailies. Default 'daily'. */
  channel?: PositronChannel;
  /** Exact version pin (e.g. '2026.08.0-365'). Overrides channel-latest. */
  version?: string;
  /** Platform/arch override. Defaults to the host. */
  platform?: PositronPlatform;
  /** Cache root. Default '.positron-test'. */
  cachePath?: string;
}

export interface PositronTestOptions extends DownloadOptions {
  extensionDevelopmentPath: string;
  extensionTestsPath: string;
  /** Extra launch args, merged after the defaults. */
  launchArgs?: string[];
}
