#!/usr/bin/env node
// Upload media files via wpmcp `wp_upload_media` tool (base64 over JSON-RPC).
// Uses JWT auth from .env — does not rely on WP REST + Application Password.
//
// Usage:
//   node upload-media.mjs test <relPath>       — upload one file, print full response
//   node upload-media.mjs press                — upload all assets/press/*.{svg,png,jpg,jpeg,webp},
//                                                write assets/press/_manifest.json

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv(resolve(__dirname, '..', '.env'));
const mcpUrl = env.WP_MCP_URL;
const jwt = env.WP_MCP_JWT;
if (!mcpUrl || !jwt) { console.error('Missing WP_MCP_URL/WP_MCP_JWT'); process.exit(2); }

let sid = null;
let nextId = 1;

async function rpc(method, params, retry = 3) {
  const id = nextId++;
  const body = { jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) };
  const headers = {
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };
  if (sid) headers['Mcp-Session-Id'] = sid;
  let res, text;
  for (let attempt = 1; attempt <= retry; attempt++) {
    try {
      res = await fetch(mcpUrl, { method: 'POST', headers, body: JSON.stringify(body) });
      const nsid = res.headers.get('mcp-session-id');
      if (nsid && !sid) sid = nsid;
      text = await res.text();
      if (res.ok) break;
      if ([500, 502, 503, 504, 520, 521, 522, 523, 524, 525].includes(res.status) && attempt < retry) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
    } catch (e) {
      if (attempt < retry && /fetch failed|ECONNRESET|ETIMEDOUT|handshake/i.test(e.message)) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw e;
    }
  }
  const ct = res.headers.get('content-type') || '';
  let data;
  if (ct.includes('text/event-stream')) {
    for (const block of text.split(/\r?\n\r?\n/)) {
      const dl = block.split(/\r?\n/).filter(l => l.startsWith('data:')).map(l => l.slice(5).trim());
      if (!dl.length) continue;
      try {
        const parsed = JSON.parse(dl.join('\n'));
        if (parsed.id === id) { data = parsed; break; }
      } catch {}
    }
    if (!data) throw new Error(`No SSE response id=${id}: ${text.slice(0, 400)}`);
  } else {
    data = JSON.parse(text);
  }
  if (data.error) throw new Error(`RPC ${data.error.code}: ${data.error.message}\n${JSON.stringify(data.error.data || {})}`);
  return data.result;
}

async function callTool(name, args) {
  const out = await rpc('tools/call', { name, arguments: args });
  if (out.isError) {
    const msg = (out.content || []).map(c => c.text || JSON.stringify(c)).join('\n');
    throw new Error(`Tool ${name} failed:\n${msg}`);
  }
  const txt = (out.content || []).map(c => c.text || '').join('\n');
  try { return JSON.parse(txt); } catch { return txt; }
}

async function init() {
  await rpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'billybeck-upload', version: '1.0' },
  });
  try {
    await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        ...(sid ? { 'Mcp-Session-Id': sid } : {}),
      },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    });
  } catch {}
}

async function uploadOne(filePath, title) {
  const abs = resolve(filePath);
  const buf = readFileSync(abs);
  const b64 = buf.toString('base64');
  const rawSlug = basename(abs, extname(abs)).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return callTool('wp_upload_media', {
    file: b64,
    title: title || rawSlug,
    slug: rawSlug,
    alt_text: title || rawSlug,
    status: 'publish',
  });
}

const files = {
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
};

async function run() {
  const cmd = process.argv[2];
  await init();

  if (cmd === 'test') {
    const rel = process.argv[3];
    if (!rel) throw new Error('test <relPath>');
    const abs = resolve(__dirname, '..', rel);
    console.log(`↑ ${abs}`);
    const r = await uploadOne(abs);
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  if (cmd === 'press') {
    const dir = resolve(__dirname, '..', 'assets', 'press');
    const names = readdirSync(dir).filter(f => files[extname(f).slice(1).toLowerCase()]);
    const manifest = {};
    for (const f of names) {
      const abs = resolve(dir, f);
      const title = `Billy Beck press — ${basename(f, extname(f))}`;
      process.stdout.write(`↑ ${f} ... `);
      try {
        const r = await uploadOne(abs, title);
        const url = r.source_url || r.guid?.rendered || r.link || null;
        manifest[basename(f, extname(f))] = { id: r.id, url, mime: r.mime_type };
        console.log(`id=${r.id}  ${url}`);
      } catch (e) {
        console.log(`FAILED: ${e.message.slice(0, 240)}`);
        manifest[basename(f, extname(f))] = { error: e.message };
      }
    }
    const manifestPath = resolve(dir, '_manifest.json');
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`\nManifest → ${manifestPath}`);
    return;
  }

  console.error('Commands: test <path> | press');
  process.exit(1);
}

run().catch(err => { console.error(err.message || err); process.exit(1); });
