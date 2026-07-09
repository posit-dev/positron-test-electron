import * as path from 'path';
import { runTests } from '@posit-dev/positron-test-electron';

async function main(): Promise<void> {
  const code = await runTests({
    channel: 'daily',
    extensionDevelopmentPath: path.resolve(__dirname, '..'),
    extensionTestsPath: path.resolve(__dirname, './test/index.js'),
  });
  process.exit(code);
}

main().catch((err) => {
  console.error('Failed to run Positron example integration test:', err);
  process.exit(1);
});
