#!/usr/bin/env node
// WordPress deploy helper — speaks MCP JSON-RPC to the wpmcp streamable endpoint
// using the JWT from .env. Pushes Elementor layouts as _elementor_data meta.
//
// Usage:
//   node deploy.mjs whoami                                             — confirm auth
//   node deploy.mjs list                                               — list pages
//   node deploy.mjs update <pageId> <layoutFile> [title] [status]      — update existing page
//   node deploy.mjs create <slug> <layoutFile> <title> [status]        — create new page
//   node deploy.mjs regen <pageId>                                     — clear elementor css cache
//   node deploy.mjs push-all                                           — deploy all five v6 pages
//
// .env requirements:
//   WP_MCP_URL       full streamable endpoint URL
//   WP_MCP_JWT       JWT with edit_posts capability

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

function loadEnv(path) {
  if (!existsSync(path)) throw new Error(`.env not found: ${path}`);
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

const env = loadEnv(envPath);
const mcpUrl = env.WP_MCP_URL;
const jwt = env.WP_MCP_JWT;
if (!mcpUrl || !jwt) {
  console.error('Missing WP_MCP_URL or WP_MCP_JWT in .env');
  process.exit(2);
}

let nextId = 1;
let sessionId = null;

async function rpc(method, params, retry = 3) {
  const id = nextId++;
  const body = { jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) };
  const headers = {
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;

  let res, text;
  for (let attempt = 1; attempt <= retry; attempt++) {
    try {
      res = await fetch(mcpUrl, { method: 'POST', headers, body: JSON.stringify(body) });
      const sid = res.headers.get('mcp-session-id');
      if (sid && !sessionId) sessionId = sid;
      text = await res.text();
      if (res.ok) break;
      if ([500, 502, 503, 504, 520, 521, 522, 523, 524, 525].includes(res.status) && attempt < retry) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw new Error(`HTTP ${res.status} ${res.statusText}\n${text.slice(0, 400)}`);
    } catch (e) {
      if (attempt < retry && /fetch failed|ECONNRESET|ETIMEDOUT|handshake/i.test(e.message)) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw e;
    }
  }
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}\n${text.slice(0, 400)}`);

  let data;
  if (ct.includes('text/event-stream')) {
    // parse SSE: find last "data:" line with our response id
    for (const block of text.split(/\r?\n\r?\n/)) {
      const dataLines = block.split(/\r?\n/).filter(l => l.startsWith('data:')).map(l => l.slice(5).trim());
      if (!dataLines.length) continue;
      const payload = dataLines.join('\n');
      try {
        const parsed = JSON.parse(payload);
        if (parsed.id === id) { data = parsed; break; }
      } catch {}
    }
    if (!data) throw new Error(`No SSE response matched id=${id}\nRaw:\n${text.slice(0, 800)}`);
  } else {
    data = JSON.parse(text);
  }

  if (data.error) throw new Error(`RPC error ${data.error.code}: ${data.error.message}\n${JSON.stringify(data.error.data || {}, null, 2)}`);
  return data.result;
}

async function initSession() {
  const initRes = await rpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'billybeck-deploy', version: '1.0' },
  });
  // notifications/initialized has no response id — best-effort fire-and-forget
  try {
    await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
      },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    });
  } catch {}
  return initRes;
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

async function updatePage(pageId, meta, extra = {}) {
  return callTool('wp_update_page', { id: pageId, meta, ...extra });
}

async function createPage(title, meta, extra = {}) {
  return callTool('wp_add_page', { title, content: ' ', status: extra.status || 'publish', meta, ...extra });
}

async function run() {
  const cmd = process.argv[2];

  if (cmd === 'whoami') {
    await initSession();
    const me = await callTool('wp_get_current_user', {});
    console.log(`Auth OK — ${me.name} (id ${me.id}) @ ${me.link}`);
    return;
  }

  if (cmd === 'list') {
    await initSession();
    const pages = await callTool('wp_pages_search', { per_page: 50, status: ['publish', 'draft'] });
    const arr = Array.isArray(pages) ? pages : [pages];
    arr.forEach(p => console.log(`${String(p.id).padStart(3)}  ${p.status.padEnd(7)}  /${p.slug || '(none)'}  — ${p.title?.rendered || ''}`));
    return;
  }

  if (cmd === 'update') {
    const pageId = parseInt(process.argv[3], 10);
    const file = process.argv[4];
    const title = process.argv[5];
    const status = process.argv[6] || 'publish';
    if (!pageId || !file) throw new Error('update <pageId> <layoutFile> [title] [status]');
    const layout = JSON.parse(readFileSync(resolve(__dirname, file), 'utf8'));
    await initSession();
    const extra = { status };
    if (title) extra.title = { raw: title };
    const result = await updatePage(pageId, {
      _elementor_data: JSON.stringify(layout),
      _elementor_edit_mode: 'builder',
      _elementor_version: '3.18.0',
    }, extra);
    console.log(`Updated page ${result.id} (${result.link})`);
    return;
  }

  if (cmd === 'create') {
    const slug = process.argv[3];
    const file = process.argv[4];
    const title = process.argv[5];
    const status = process.argv[6] || 'publish';
    if (!slug || !file || !title) throw new Error('create <slug> <layoutFile> <title> [status]');
    const layout = JSON.parse(readFileSync(resolve(__dirname, file), 'utf8'));
    await initSession();
    const result = await createPage(title, {
      _elementor_data: JSON.stringify(layout),
      _elementor_edit_mode: 'builder',
      _elementor_version: '3.18.0',
      _wp_page_template: 'elementor_canvas',
    }, { slug, status, template: 'elementor_canvas' });
    console.log(`Created page ${result.id} (/${result.slug}) — ${result.link}`);
    return;
  }

  if (cmd === 'regen') {
    const pageId = parseInt(process.argv[3], 10);
    await initSession();
    const result = await updatePage(pageId, { _elementor_css: '' });
    console.log(`Cleared Elementor CSS cache for page ${result.id}`);
    return;
  }

  if (cmd === 'push-all') {
    await initSession();
    // 1. restore/update home
    console.log('→ Updating home (id 18)...');
    const home = JSON.parse(readFileSync(resolve(__dirname, 'home.v6.json'), 'utf8'));
    await updatePage(18, {
      _elementor_data: JSON.stringify(home),
      _elementor_edit_mode: 'builder',
      _elementor_version: '3.18.0',
    }, { title: { raw: 'Billy Beck III — Forge Your Strongest Self' }, status: 'publish' });
    console.log('  ✓ home updated');

    const pages = [
      { slug: 'billy-beck-iii', file: 'about.v6.json',        title: 'About — Billy Beck III' },
      { slug: 'coaching',       file: 'coaching.v6.json',     title: 'Coaching — Billy Beck III' },
      { slug: 'testimonials',   file: 'testimonials.v6.json', title: 'Testimonials — Billy Beck III' },
      { slug: 'contact',        file: 'contact.v6.json',      title: 'Contact — Billy Beck III' },
    ];
    for (const p of pages) {
      console.log(`→ Checking /${p.slug}...`);
      const existing = await callTool('wp_pages_search', { slug: [p.slug], status: ['publish', 'draft'], per_page: 1 });
      const arr = Array.isArray(existing) ? existing : [existing].filter(Boolean);
      const layout = JSON.parse(readFileSync(resolve(__dirname, p.file), 'utf8'));
      const meta = {
        _elementor_data: JSON.stringify(layout),
        _elementor_edit_mode: 'builder',
        _elementor_version: '3.18.0',
        _wp_page_template: 'elementor_canvas',
      };
      if (arr.length) {
        console.log(`  found page ${arr[0].id}, updating...`);
        await updatePage(arr[0].id, meta, { title: { raw: p.title }, status: 'publish', template: 'elementor_canvas' });
        console.log(`  ✓ /${p.slug} updated`);
      } else {
        console.log('  not found, creating...');
        const created = await createPage(p.title, meta, { slug: p.slug, status: 'publish', template: 'elementor_canvas' });
        console.log(`  ✓ /${p.slug} created (id ${created.id})`);
      }
    }
    console.log('\nAll pages deployed. Run `node deploy.mjs regen <id>` per page if frontend shows stale CSS.');
    return;
  }

  console.error('Commands: whoami | list | update | create | regen | push-all');
  process.exit(1);
}

run().catch(err => { console.error(err.message || err); process.exit(1); });
