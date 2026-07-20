import { getJson as defaultGetJson } from './http';
import { getPlatformDescriptor, hostPlatform, PlatformDescriptor } from './platform';
import { PositronChannel, DownloadOptions } from './types';
import { PositronStableNotAvailableError } from './errors';

const CDN_BASE = 'https://cdn.posit.co/positron';

export interface ResolvedBuild {
  version: string;
  url: string;
  sha256?: string;
  descriptor: PlatformDescriptor;
  channel: PositronChannel;
}

interface ReleasesJson {
  version: string;
  url: string;
  sha256hash: string;
}

export function channelSegment(channel: PositronChannel): string {
  return channel === 'stable' ? 'releases' : 'dailies';
}

export function baseUrlFor(channel: PositronChannel, descriptor: PlatformDescriptor): string {
  return `${CDN_BASE}/${channelSegment(channel)}/${descriptor.cdnSegment}/${descriptor.arch}`;
}

export function archiveUrl(
  channel: PositronChannel,
  descriptor: PlatformDescriptor,
  version: string,
): string {
  return `${baseUrlFor(channel, descriptor)}/${descriptor.archiveName(version)}`;
}

export interface ResolveDeps {
  getJson: (url: string) => Promise<{ status: number; body: string }>;
}

export async function resolveBuild(
  options: DownloadOptions,
  deps: ResolveDeps = { getJson: defaultGetJson },
): Promise<ResolvedBuild> {
  const channel = options.channel ?? 'daily';
  const descriptor = getPlatformDescriptor(options.platform ?? hostPlatform());

  // Pinned version: deterministic URL. sha256 verification is deferred to the WS2
  // per-version sidecars, so no hash is available yet for arbitrary pins.
  if (options.version) {
    return {
      version: options.version,
      url: archiveUrl(channel, descriptor, options.version),
      descriptor,
      channel,
    };
  }

  const url = `${baseUrlFor(channel, descriptor)}/releases.json`;
  const { status, body } = await deps.getJson(url);
  if (status !== 200) {
    // Windows/Linux 'stable' latest isn't published until the first stable release
    // from the new archive workflow is cut; the CDN object 404s/403s until then.
    // (macOS 'stable' already resolves.) See issue #2.
    if (channel === 'stable' && (status === 403 || status === 404)) {
      throw new PositronStableNotAvailableError(descriptor.platform);
    }
    throw new Error(`Failed to fetch releases.json: HTTP ${status} for ${url}\n${body.slice(0, 500)}`);
  }
  const release = JSON.parse(body) as ReleasesJson;
  return {
    version: release.version,
    url: release.url,
    sha256: release.sha256hash,
    descriptor,
    channel,
  };
}
