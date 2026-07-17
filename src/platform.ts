import * as path from 'path';
import { PositronPlatformNotSupportedError } from './errors';

export type PositronPlatform =
  | 'darwin-arm64'
  | 'darwin-x64'
  | 'win32-x64'
  | 'win32-arm64'
  | 'linux-x64'
  | 'linux-arm64';

export interface PlatformDescriptor {
  platform: PositronPlatform;
  cdnSegment: string;            // CDN platform segment: 'mac' | 'win' | 'linux'
  arch: string;                  // CDN path arch segment: 'arm64' | 'x64' (mac) | 'x86_64' (win/linux x64)
  archiveName(version: string): string;
  appExecutableRelPath: string[]; // launch executable, relative to the install dir
  cliRelPath: string[];           // CLI executable, relative to the install dir
}

const MAC_APP_EXECUTABLE = ['Positron.app', 'Contents', 'MacOS', 'Positron'];
const MAC_CLI = ['Positron.app', 'Contents', 'Resources', 'app', 'bin', 'positron'];

const DESCRIPTORS: Record<PositronPlatform, PlatformDescriptor> = {
  'darwin-arm64': {
    platform: 'darwin-arm64',
    cdnSegment: 'mac',
    arch: 'arm64',
    archiveName: (v) => `Positron-darwin-${v}-arm64.zip`,
    appExecutableRelPath: MAC_APP_EXECUTABLE,
    cliRelPath: MAC_CLI,
  },
  'darwin-x64': {
    platform: 'darwin-x64',
    cdnSegment: 'mac',
    arch: 'x64',
    archiveName: (v) => `Positron-darwin-${v}-x64.zip`,
    appExecutableRelPath: MAC_APP_EXECUTABLE,
    cliRelPath: MAC_CLI,
  },
  // Windows: the zip has the VS Code win32 layout — Positron.exe at the root, CLI
  // shim at bin/positron.cmd. CDN path arch segment is 'x86_64' for x64.
  'win32-x64': {
    platform: 'win32-x64',
    cdnSegment: 'win',
    arch: 'x86_64',
    archiveName: (v) => `Positron-win32-${v}-x64.zip`,
    appExecutableRelPath: ['Positron.exe'],
    cliRelPath: ['bin', 'positron.cmd'],
  },
  'win32-arm64': {
    platform: 'win32-arm64',
    cdnSegment: 'win',
    arch: 'arm64',
    archiveName: (v) => `Positron-win32-${v}-arm64.zip`,
    appExecutableRelPath: ['Positron.exe'],
    cliRelPath: ['bin', 'positron.cmd'],
  },
  // Linux: the tar.gz extracts its contents flat — the 'positron' Electron binary
  // at the root, CLI shell script at bin/positron. CDN path arch segment is
  // 'x86_64' for x64.
  'linux-x64': {
    platform: 'linux-x64',
    cdnSegment: 'linux',
    arch: 'x86_64',
    archiveName: (v) => `Positron-linux-${v}-x64.tar.gz`,
    appExecutableRelPath: ['positron'],
    cliRelPath: ['bin', 'positron'],
  },
  'linux-arm64': {
    platform: 'linux-arm64',
    cdnSegment: 'linux',
    arch: 'arm64',
    archiveName: (v) => `Positron-linux-${v}-arm64.tar.gz`,
    appExecutableRelPath: ['positron'],
    cliRelPath: ['bin', 'positron'],
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
  if (
    (platform === 'darwin' || platform === 'win32' || platform === 'linux') &&
    (arch === 'arm64' || arch === 'x64')
  ) {
    return `${platform}-${arch}` as PositronPlatform;
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
