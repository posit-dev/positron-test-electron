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
  /**
   * Launch with `--disable-extensions`, running the extension under test in
   * isolation from all other installed and bundled extensions (the pattern
   * recommended by the VS Code testing docs). Default `true`.
   *
   * Set to `false` when your tests depend on other extensions being active —
   * for example Positron's bundled language runtimes, or another extension's
   * contributed API.
   */
  disableExtensions?: boolean;
  /** Extra launch args, merged after the defaults. */
  launchArgs?: string[];
}
