export class PositronPlatformNotSupportedError extends Error {
  constructor(platform: string) {
    super(
      `Positron test builds are not published for '${platform}'. ` +
      `v1 supports darwin-arm64 and darwin-x64; Windows/Linux archives are pending.`,
    );
    this.name = 'PositronPlatformNotSupportedError';
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
