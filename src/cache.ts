import * as fsp from 'fs/promises';
import * as path from 'path';
import { PlatformDescriptor } from './platform';
import { PositronChannel } from './types';

const COMPLETE_FILE = 'is-complete';
export const DEFAULT_CACHE_ROOT = '.positron-test';

export function buildDir(
  cacheRoot: string,
  channel: PositronChannel,
  version: string,
  descriptor: PlatformDescriptor,
): string {
  return path.join(cacheRoot, channel, version, descriptor.platform);
}

export function executablePath(dir: string, descriptor: PlatformDescriptor): string {
  return path.join(dir, ...descriptor.appExecutableRelPath);
}

export async function isComplete(dir: string, version: string): Promise<boolean> {
  try {
    const marker = await fsp.readFile(path.join(dir, COMPLETE_FILE), 'utf-8');
    return marker.trim() === version;
  } catch {
    return false;
  }
}

export async function markComplete(dir: string, version: string): Promise<void> {
  await fsp.writeFile(path.join(dir, COMPLETE_FILE), version, 'utf-8');
}
