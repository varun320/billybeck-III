#!/usr/bin/env node
// Push body-only Elementor data and switch page template from
// elementor_canvas → elementor_header_footer so the Theme Builder
// Header + Footer templates inject automatically.
//
// Source:
//   - For home (id 18): live snapshot at .home.live.json (preserves manual edits),
//     stripped of navbar + footer sections by id.
//   - For other pages: <page>.body.json (already body-only).
//
// Usage:
//   node deploy-body-only.mjs all       — push all 7 pages (home + 6 others)
//   node deploy-body-only.mjs home      — push only home

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
  if (data.error) throw new Error(`RPC ${data.error.code}: ${data.error.message}`);
  return data.result;
}
async function init() {
  await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'deploy-body-only', version: '1.0' } });
  await fetch(mcpUrl, { method: 'POST', headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }).catch(() => {});
}
async function call(name, args) {
  const out = await rpc('tools/call', { name, arguments: args });
  if (out.isError) throw new Error(`Tool ${name} failed: ${(out.content || []).map(c => c.text).join('\n').slice(0, 400)}`);
  const txt = (out.content || []).map(c => c.text || '').join('\n');
  try { return JSON.parse(txt); } catch { return txt; }
}

const STRIP_IDS = new Set(['sec_nav_d', 'sec_nav_m_top', 'sec_nav_m_menu', 'sec_footer', 'sec_subfooter']);
const base = '/billybeck';

function rewriteInternalUrl(url) {
  if (typeof url !== 'string' || url.length === 0) return url;
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  if (url === base || url.startsWith(base + '/')) return url;
  if (url === '/') return base + '/';
  return base + url;
}
function rewriteWalk(node) {
  if (Array.isArray(node)) { for (const item of node) rewriteWalk(item); return; }
  if (node && typeof node === 'object') {
    if (typeof node.url === 'string') node.url = rewriteInternalUrl(node.url);
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === 'string' && (k === 'editor' || k === 'tab_content' || k === 'text' || k.endsWith('_content'))) {
        node[k] = v.replace(/href="(\/[^"]*)"/g, (_, u) => `href="${rewriteInternalUrl(u)}"`);
      } else if (v && typeof v === 'object') { rewriteWalk(v); }
    }
  }
}

async function pushPage(pageId, layout, title) {
  const meta = {
    _elementor_data: JSON.stringify(layout),
    _elementor_edit_mode: 'builder',
    _elementor_version: '4.0.7',
    _wp_page_template: 'elementor_header_footer',
  };
  const args = { id: pageId, meta, template: 'elementor_header_footer', status: 'publish' };
  if (title) args.title = { raw: title };
  await call('wp_update_page', args);
  await call('wp_update_page', { id: pageId, meta: { _elementor_css: '' } });
  console.log(`  ✓ id ${pageId} pushed + css flushed`);
}

const PAGES = [
  { id: 18,  file: null, title: 'Billy Beck III — Forge Your Strongest Self',  liveOnly: true },
  { id: 28,  file: 'about.body.json',        title: 'About — Billy Beck III' },
  { id: 29,  file: 'coaching.body.json',     title: 'Coaching — Billy Beck III' },
  { id: 30,  file: 'testimonials.body.json', title: 'Testimonials — Billy Beck III' },
  { id: 31,  file: 'contact.body.json',      title: 'Contact — Billy Beck III' },
  { id: 102, file: 'legion.body.json',       title: 'Legion of Lions — Billy Beck III' },
  { id: 124, file: 'blog.body.json',         title: 'Blog — Billy Beck III' },
];

await init();

const cmd = process.argv[2] || 'all';
const targets = cmd === 'home' ? PAGES.filter(p => p.id === 18) : PAGES;

for (const p of targets) {
  let layout;
  if (p.liveOnly) {
    const live = JSON.parse(readFileSync(resolve(__dirname, '.home.live.json'), 'utf8'));
    layout = live.filter(s => !STRIP_IDS.has(s.id));
  } else {
    layout = JSON.parse(readFileSync(resolve(__dirname, p.file), 'utf8'));
  }
  rewriteWalk(layout);
  console.log(`→ pushing id ${p.id} (${layout.length} sections)`);
  await pushPage(p.id, layout, p.title);
}
console.log('\nDone.');
