import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getToFile as defaultGetToFile } from './http';
import { HttpError, PositronChecksumError, PositronVersionNotFoundError } from './errors';
import { resolveBuild as defaultResolveBuild, ResolvedBuild } from './resolve';
import { buildDir, executablePath, isComplete, markComplete, DEFAULT_CACHE_ROOT } from './cache';
import { DownloadOptions } from './types';

export async function sha256OfFile(file: string): Promise<string> {
  const hash = createHash('sha256');
  const stream = fs.createReadStream(file);
  for await (const chunk of stream) {
    hash.update(chunk as Buffer);
  }
  return hash.digest('hex');
}

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args);
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} failed (exit ${result.status}): ${result.stderr?.toString()}`,
    );
  }
}

/**
 * Extracting a Windows zip needs bsdtar, which ships with Windows 10+ as
 * System32\tar.exe. A bare `tar` on PATH can instead resolve to GNU tar (e.g.
 * from Git for Windows), which cannot read zip archives — so resolve the system
 * bsdtar by absolute path and only fall back to PATH if it's missing.
 */
function windowsBsdtar(): string {
  const systemRoot = process.env.SystemRoot || process.env.windir || 'C:\\Windows';
  const bsdtar = path.join(systemRoot, 'System32', 'tar.exe');
  return fs.existsSync(bsdtar) ? bsdtar : 'tar';
}

function defaultExtract(archive: string, destDir: string): void {
  if (archive.endsWith('.tar.gz') || archive.endsWith('.tgz')) {
    // Linux archives. `tar` (GNU on Linux, bsdtar elsewhere) handles gzip tarballs
    // and preserves the executable bit on the Positron binary.
    run('tar', ['-xzf', archive, '-C', destDir]);
  } else if (process.platform === 'win32') {
    // Windows zip — extract with the bundled bsdtar (avoids a dependency on
    // `unzip`, which Windows lacks).
    run(windowsBsdtar(), ['-xf', archive, '-C', destDir]);
  } else {
    // macOS zip. `unzip` preserves the symlinks and permissions inside the
    // Positron.app bundle (frameworks rely on them).
    run('unzip', ['-q', archive, '-d', destDir]);
  }
}

export interface DownloadDeps {
  getToFile: (url: string, dest: string) => Promise<void>;
  extract: (archive: string, destDir: string) => void;
}

export async function downloadBuild(
  build: ResolvedBuild,
  targetDir: string,
  deps: DownloadDeps = { getToFile: defaultGetToFile, extract: defaultExtract },
): Promise<void> {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'positron-dl-'));
  const archive = path.join(tmp, path.basename(new URL(build.url).pathname));
  try {
    try {
      await deps.getToFile(build.url, archive);
    } catch (err) {
      if (err instanceof HttpError && err.statusCode === 404) {
        throw new PositronVersionNotFoundError(build.version);
      }
      throw err;
    }

    if (build.sha256) {
      const actual = await sha256OfFile(archive);
      if (actual.toLowerCase() !== build.sha256.toLowerCase()) {
        throw new PositronChecksumError(
          `sha256 mismatch for ${build.version}: expected ${build.sha256}, got ${actual}`,
        );
      }
    } else {
      console.warn(
        `No sha256 available for Positron ${build.version}; skipping checksum ` +
        `verification (pending per-version CDN sidecars).`,
      );
    }

    await fsp.rm(targetDir, { recursive: true, force: true });
    await fsp.mkdir(targetDir, { recursive: true });
    deps.extract(archive, targetDir);
    await markComplete(targetDir, build.version); // written last
  } finally {
    await fsp.rm(tmp, { recursive: true, force: true });
  }
}

export interface AcquireDeps {
  resolveBuild: typeof defaultResolveBuild;
  downloadBuild: typeof downloadBuild;
}

/**
 * Resolve, cache-check, and (on a miss) download a Positron build. Returns the
 * path to the launch executable. Mirrors `downloadAndUnzipVSCode`.
 */
export async function downloadAndUnzipPositron(
  options: DownloadOptions = {},
  deps: AcquireDeps = { resolveBuild: defaultResolveBuild, downloadBuild },
): Promise<string> {
  const build = await deps.resolveBuild(options);
  const dir = buildDir(options.cachePath ?? DEFAULT_CACHE_ROOT, build.channel, build.version, build.descriptor);
  const exe = executablePath(dir, build.descriptor);
  if (await isComplete(dir, build.version)) {
    return exe;
  }
  await deps.downloadBuild(build, dir);
  return exe;
}
