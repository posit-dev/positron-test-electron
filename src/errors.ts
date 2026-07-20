export class PositronPlatformNotSupportedError extends Error {
  constructor(platform: string) {
    super(
      `Positron test builds are not published for '${platform}'. ` +
      `Supported platforms: darwin-arm64, darwin-x64, win32-x64, win32-arm64, ` +
      `linux-x64, linux-arm64.`,
    );
    this.name = 'PositronPlatformNotSupportedError';
  }
}

export class PositronStableNotAvailableError extends Error {
  constructor(platform: string) {
    super(
      `No latest 'stable' Positron build is published for '${platform}' yet. ` +
      `The first stable release including Windows/Linux desktop archives has not ` +
      `been cut. Use channel 'daily', or pin an available 'version'. ` +
      `See https://github.com/posit-dev/positron-test-electron/issues/2.`,
    );
    this.name = 'PositronStableNotAvailableError';
  }
}

export class PositronVersionNotFoundError extends Error {
  constructor(version: string) {
    super(
      `Positron version '${version}' was not found on the CDN. ` +
      `Check available versions at https://github.com/posit-dev/positron/releases.`,
    );
    this.name = 'PositronVersionNotFoundError';
  }
}

export class PositronChecksumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PositronChecksumError';
  }
}

export class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}
