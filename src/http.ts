import * as fs from 'fs';
import { IncomingMessage } from 'http';
import * as https from 'https';
import { HttpError } from './errors';

const USER_AGENT = 'positron-test-electron';

export function get(url: string): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': USER_AGENT } }, resolve);
    req.once('error', reject);
  });
}

export async function getJson(url: string): Promise<{ status: number; body: string }> {
  const res = await get(url);
  res.setEncoding('utf-8');
  let body = '';
  for await (const chunk of res) {
    body += chunk;
  }
  return { status: res.statusCode ?? 0, body };
}

export async function getToFile(url: string, dest: string): Promise<void> {
  let res = await get(url);
  while ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
    res = await get(res.headers.location);
  }
  if (res.statusCode !== 200) {
    res.resume(); // drain
    throw new HttpError(res.statusCode ?? 0, `Download failed: HTTP ${res.statusCode} for ${url}`);
  }
  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(dest);
    res.pipe(writer);
    writer.once('finish', () => resolve());
    writer.once('error', reject);
  });
}
