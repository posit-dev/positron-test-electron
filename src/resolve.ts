/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2026 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { getJson as defaultGetJson } from './http';
import { getPlatformDescriptor, hostPlatform, PlatformDescriptor } from './platform';
import { PositronChannel, DownloadOptions } from './types';

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
