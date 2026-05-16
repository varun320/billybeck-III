#!/usr/bin/env node
// Push Header + Footer as Elementor Pro Theme Builder templates into
// elementor_library with location conditions "include/general" (whole site).
//
// Usage:
//   node push-header-footer.mjs create-both             — first-time creation
//   node push-header-footer.mjs update <hdrId> <ftrId>  — update existing templates
//   node push-header-footer.mjs probe                   — list templates

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, '..', '.env'), 'utf8').split(/\r?\n/).map(l => l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i)).filter(Boolean).map(m => {
    let v = m[2]; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    return [m[1], v];
  })
);
const mcpUrl = env.WP_MCP_URL, jwt = env.WP_MCP_JWT;
let nextId = 1, sessionId = null;
async function rpc(method, params) {
  const id = nextId++;
  const body = { jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) };
  const headers = { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  const res = await fetch(mcpUrl, { method: 'POST', headers, body: JSON.stringify(body) });
  const sid = res.headers.get('mcp-session-id'); if (sid && !sessionId) sessionId = sid;
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}\n${text.slice(0, 400)}`);
  let data;
  if ((res.headers.get('content-type') || '').includes('text/event-stream')) {
    for (const block of text.split(/\r?\n\r?\n/)) {
      const dl = block.split(/\r?\n/).filter(l => l.startsWith('data:')).map(l => l.slice(5).trim());
      if (!dl.length) continue;
      try { const p = JSON.parse(dl.join('\n')); if (p.id === id) { data = p; break; } } catch {}
    }
  } else data = JSON.parse(text);
  if (data.error) throw new Error(`RPC ${data.error.code}: ${data.error.message}\n${JSON.stringify(data.error.data || {}, null, 2).slice(0, 400)}`);
  return data.result;
}
async function init() {
  await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'push-header-footer', version: '1.0' } });
  await fetch(mcpUrl, { method: 'POST', headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }).catch(() => {});
}
async function call(name, args) {
  const out = await rpc('tools/call', { name, arguments: args });
  if (out.isError) throw new Error(`Tool ${name} failed: ${(out.content || []).map(c => c.text).join('\n').slice(0, 400)}`);
  const txt = (out.content || []).map(c => c.text || '').join('\n');
  try { return JSON.parse(txt); } catch { return txt; }
}

await init();
const cmd = process.argv[2];

const navbar = JSON.parse(readFileSync(resolve(__dirname, '_navbar.v6.json'), 'utf8'));
const footer = JSON.parse(readFileSync(resolve(__dirname, '_footer.v6.json'), 'utf8'));

function buildMeta(layout, type) {
  return {
    _elementor_data: JSON.stringify(layout),
    _elementor_edit_mode: 'builder',
    _elementor_template_type: type,                  // 'header' or 'footer'
    _elementor_version: '4.0.7',
    _elementor_conditions: ['include/general'],
    _wp_page_template: 'elementor_header_footer',    // template renders header/footer hooks
  };
}

if (cmd === 'probe') {
  const r = await call('wp_cpt_search', { post_type: 'elementor_library', per_page: 50 });
  const arr = r.results || (Array.isArray(r) ? r : []);
  arr.forEach(t => console.log(`${t.ID}  ${t.post_status}  /${t.post_name}  — ${t.post_title}`));
  process.exit(0);
}

if (cmd === 'create-both') {
  const hdr = await call('wp_add_cpt', {
    post_type: 'elementor_library',
    title: 'Site Header',
    content: ' ',
    status: 'publish',
    meta: buildMeta(navbar, 'header'),
    template_type: 'header',
  });
  console.log('Header created:', JSON.stringify(hdr).slice(0, 200));
  const ftr = await call('wp_add_cpt', {
    post_type: 'elementor_library',
    title: 'Site Footer',
    content: ' ',
    status: 'publish',
    meta: buildMeta(footer, 'footer'),
    template_type: 'footer',
  });
  console.log('Footer created:', JSON.stringify(ftr).slice(0, 200));
  process.exit(0);
}

if (cmd === 'update') {
  const hdrId = parseInt(process.argv[3], 10);
  const ftrId = parseInt(process.argv[4], 10);
  if (!hdrId || !ftrId) throw new Error('update <hdrId> <ftrId>');
  const hr = await call('wp_update_cpt', {
    post_type: 'elementor_library', id: hdrId, title: 'Site Header', status: 'publish',
    meta: buildMeta(navbar, 'header'),
  });
  console.log('Header updated:', JSON.stringify(hr).slice(0, 200));
  const fr = await call('wp_update_cpt', {
    post_type: 'elementor_library', id: ftrId, title: 'Site Footer', status: 'publish',
    meta: buildMeta(footer, 'footer'),
  });
  console.log('Footer updated:', JSON.stringify(fr).slice(0, 200));
  process.exit(0);
}

console.error('Commands: probe | create-both | update <hdrId> <ftrId>');
process.exit(1);
