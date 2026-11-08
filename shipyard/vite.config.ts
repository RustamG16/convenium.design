import react from '@vitejs/plugin-react';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { shipyardForge } from './dev/forge.ts';
import { shipyardLive } from './dev/live.ts';
import { describeIssues, shipSchema } from './src/domain/schema.ts';

const root = dirname(fileURLToPath(import.meta.url));
const shipsDir = resolve(root, 'ships');
const MAX_BODY = 1_000_000;

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string | null> {
  return new Promise((done) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        done(null);
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => done(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => done(null));
  });
}

/**
 * Dev-only save: POST /__shipyard/save writes shipyard/ships/<id>.ship.json after validating with
 * the same zod schema the app uses. `apply: 'serve'` means the production build has no write path.
 */
function shipyardDevSave(): Plugin {
  return {
    name: 'shipyard-dev-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__shipyard/save', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        const origin = req.headers.origin;
        if (origin && new URL(origin).host !== req.headers.host) return json(res, 403, { ok: false, error: 'cross-origin request refused' });
        const body = await readBody(req);
        if (body === null) return json(res, 413, { ok: false, error: 'body too large or unreadable' });
        let raw: unknown;
        try {
          raw = JSON.parse(body);
        } catch {
          return json(res, 400, { ok: false, error: 'not valid JSON' });
        }
        const parsed = shipSchema.safeParse(raw);
        if (!parsed.success) return json(res, 400, { ok: false, error: describeIssues(parsed.error).join('; ') });
        const target = resolve(join(shipsDir, `${parsed.data.id}.ship.json`));
        if (!target.startsWith(shipsDir + sep)) return json(res, 400, { ok: false, error: 'bad id' });
        mkdirSync(shipsDir, { recursive: true });
        writeFileSync(target, `${JSON.stringify(parsed.data, null, 2)}\n`, 'utf8');
        return json(res, 200, { ok: true, path: `shipyard/ships/${parsed.data.id}.ship.json` });
      });
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), shipyardDevSave(), shipyardLive(root), shipyardForge(root)],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { sourcemap: false, target: 'es2022', chunkSizeWarningLimit: 1200 },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
  },
});
