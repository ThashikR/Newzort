/**
 * Local test server for the built feed (no dependencies).
 *   npm run serve   → http://localhost:8787/feed.json  (also reachable from your phone on the same Wi-Fi)
 */
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'public');
const PORT = Number(process.env.PORT ?? 8787);

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^([/\\])+/, '');
  if (path.includes('..')) {
    res.writeHead(400).end();
    return;
  }
  try {
    const body = await readFile(join(ROOT, path || 'meta.json'));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Access-Control-Allow-Origin': '*' }).end('Not found');
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Serving ${ROOT}`);
  console.log(`  This PC: http://localhost:${PORT}/feed.json`);
  // List every network adapter — use the Wi-Fi one for your phone
  // (virtual adapters like VirtualBox or WSL can't be reached from a phone).
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family === 'IPv4' && !a.internal) console.log(`  ${name.padEnd(28)} http://${a.address}:${PORT}/feed.json`);
    }
  }
});
