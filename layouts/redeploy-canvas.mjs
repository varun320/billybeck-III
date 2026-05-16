#!/usr/bin/env node
// Push pages back onto elementor_canvas template with baked navbar + footer.
// - For home (id 18): use .home.live.json (preserves user manual edits to body)
// - For others: use the freshly composed <page>.v6.json (navbar + body + footer)

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
  await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'redeploy-canvas', version: '1.0' } });
  await fetch(mcpUrl, { method: 'POST', headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }).catch(() => {});
}
async function call(name, args) {
  const out = await rpc('tools/call', { name, arguments: args });
  if (out.isError) throw new Error(`Tool ${name} failed: ${(out.content || []).map(c => c.text).join('\n').slice(0, 400)}`);
  const txt = (out.content || []).map(c => c.text || '').join('\n');
  try { return JSON.parse(txt); } catch { return txt; }
}

await init();

// Site title is "Billy Beck III" (set globally) — WP appends it to page titles
// automatically. Keep page titles short so the browser tab reads e.g.
// "Coaching - Billy Beck III" instead of "Coaching — Billy Beck III - Billy Beck III".
const PAGES = [
  { id: 18,  file: '.home.live.json',         title: 'Home' },
  { id: 28,  file: 'about.v6.json',           title: 'About' },
  { id: 29,  file: 'coaching.v6.json',        title: 'Coaching' },
  { id: 30,  file: 'testimonials.v6.json',    title: 'Testimonials' },
  { id: 31,  file: 'contact.v6.json',         title: 'Contact' },
  { id: 102, file: 'legion.v6.json',          title: 'Legion of Lions' },
  { id: 124, file: 'blog.v6.json',            title: 'Blog' },
];

for (const p of PAGES) {
  const layout = JSON.parse(readFileSync(resolve(__dirname, p.file), 'utf8'));
  const meta = {
    _elementor_data: JSON.stringify(layout),
    _elementor_edit_mode: 'builder',
    _elementor_version: '4.0.7',
    _wp_page_template: 'elementor_canvas',
  };
  await call('wp_update_page', { id: p.id, meta, template: 'elementor_canvas', status: 'publish', title: { raw: p.title } });
  await call('wp_update_page', { id: p.id, meta: { _elementor_css: '' } });
  console.log(`✓ pushed id ${p.id} (${layout.length} sections, canvas, cache flushed)`);
}
console.log('\nDone. All pages back on elementor_canvas with baked navbar+footer.');
