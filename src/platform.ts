import * as path from 'path';
import { PositronPlatformNotSupportedError } from './errors';

export type PositronPlatform = 'darwin-arm64' | 'darwin-x64';

export interface PlatformDescriptor {
  platform: PositronPlatform;
  cdnSegment: string;            // CDN platform segment, e.g. 'mac'
  arch: string;                  // 'arm64' | 'x64'
  archiveName(version: string): string;
  appExecutableRelPath: string[]; // launch executable, relative to the install dir
  cliRelPath: string[];           // CLI executable, relative to the install dir (VERIFY: Task 9)
}

const DESCRIPTORS: Record<PositronPlatform, PlatformDescriptor> = {
  'darwin-arm64': {
    platform: 'darwin-arm64',
    cdnSegment: 'mac',
    arch: 'arm64',
    archiveName: (v) => `Positron-darwin-${v}-arm64.zip`,
    appExecutableRelPath: ['Positron.app', 'Contents', 'MacOS', 'Positron'],
    cliRelPath: ['Positron.app', 'Contents', 'Resources', 'app', 'bin', 'positron'],
  },
  'darwin-x64': {
    platform: 'darwin-x64',
    cdnSegment: 'mac',
    arch: 'x64',
    archiveName: (v) => `Positron-darwin-${v}-x64.zip`,
    appExecutableRelPath: ['Positron.app', 'Contents', 'MacOS', 'Positron'],
    cliRelPath: ['Positron.app', 'Contents', 'Resources', 'app', 'bin', 'positron'],
  },
};

export function getPlatformDescriptor(platform: string): PlatformDescriptor {
  const descriptor = DESCRIPTORS[platform as PositronPlatform];
  if (!descriptor) {
    throw new PositronPlatformNotSupportedError(platform);
  }
  return descriptor;
}

export function hostPlatform(): PositronPlatform {
  const { platform, arch } = process;
  if (platform === 'darwin' && (arch === 'arm64' || arch === 'x64')) {
    return `darwin-${arch}`;
  }
  throw new PositronPlatformNotSupportedError(`${platform}-${arch}`);
}

/**
 * Given the path to the launched Positron executable, return the argv for the
 * bundled CLI (e.g. for `--install-extension`). Mirrors
 * `resolveCliArgsFromVSCodeExecutablePath`, whose implementation hardcodes VS Code's
 * `bin/code`.
 */
export function resolveCliArgsFromPositronExecutablePath(
  executablePath: string,
  platform: PositronPlatform = hostPlatform(),
): string[] {
  const descriptor = getPlatformDescriptor(platform);
  const upToInstallDir = descriptor.appExecutableRelPath.map(() => '..');
  const installDir = path.resolve(executablePath, ...upToInstallDir);
  return [path.join(installDir, ...descriptor.cliRelPath)];
}
