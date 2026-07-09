import { test } from 'node:test';
import assert from 'node:assert';
import { parseArgs } from './cli';

test('parseArgs reads all flags', () => {
  const opts = parseArgs([
    '--channel', 'daily',
    '--version', '2026.08.0-365',
    '--platform', 'darwin-arm64',
    '--cache-path', '.positron-test',
    '--extension-development-path', '/ext',
    '--extension-tests-path', '/ext/out/test/index.js',
  ]);
  assert.strictEqual(opts.channel, 'daily');
  assert.strictEqual(opts.version, '2026.08.0-365');
  assert.strictEqual(opts.platform, 'darwin-arm64');
  assert.strictEqual(opts.cachePath, '.positron-test');
  assert.strictEqual(opts.extensionDevelopmentPath, '/ext');
  assert.strictEqual(opts.extensionTestsPath, '/ext/out/test/index.js');
});

test('parseArgs collects launch args after --', () => {
  const opts = parseArgs([
    '--extension-development-path', '/ext',
    '--extension-tests-path', '/ext/out/test/index.js',
    '--', '--enable-proposed-api', 'foo.bar',
  ]);
  assert.deepStrictEqual(opts.launchArgs, ['--enable-proposed-api', 'foo.bar']);
});

test('parseArgs requires the extension paths', () => {
  assert.throws(() => parseArgs(['--channel', 'daily']), /extension-development-path/);
});

test('parseArgs rejects unknown flags', () => {
  assert.throws(
    () => parseArgs(['--extension-development-path', '/e', '--extension-tests-path', '/t', '--bogus']),
    /Unknown argument: --bogus/,
  );
});
