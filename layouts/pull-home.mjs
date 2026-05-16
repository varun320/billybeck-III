#!/usr/bin/env node
// Pull live home page (id 18) Elementor data and write to .home.live.json.
// Then extract the navbar sections (sec_nav_d, sec_nav_m_top, sec_nav_m_menu)
// and overwrite _navbar.v6.json so compose.mjs uses the live, manually-edited
// navbar going forward.

import { readFileSync, writeFileSync } from 'node:fs';
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
  await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'pull-home', version: '1.0' } });
  await fetch(mcpUrl, { method: 'POST', headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }).catch(() => {});
}
async function call(name, args) {
  const out = await rpc('tools/call', { name, arguments: args });
  if (out.isError) throw new Error(`Tool ${name} failed: ${(out.content || []).map(c => c.text).join('\n').slice(0, 400)}`);
  const txt = (out.content || []).map(c => c.text || '').join('\n');
  try { return JSON.parse(txt); } catch { return txt; }
}

await init();
const page = await call('wp_get_page', { id: 18, context: 'edit' });
const raw = page.meta?._elementor_data;
if (!raw) throw new Error('No _elementor_data on page 18');
const layout = typeof raw === 'string' ? JSON.parse(raw) : raw;

// Save full live snapshot
writeFileSync(resolve(__dirname, '.home.live.json'), JSON.stringify(layout, null, 2));
console.log(`Saved live home snapshot: ${layout.length} root sections`);

// Find navbar sections: matching id prefix or by content cues
const NAV_IDS = new Set(['sec_nav_d', 'sec_nav_m_top', 'sec_nav_m_menu']);
const navSections = layout.filter(s => NAV_IDS.has(s.id));
if (navSections.length !== 3) {
  console.log('Section IDs at root:');
  layout.forEach((s, i) => console.log(`  [${i}] ${s.id} (${s.elType})`));
  console.log(`Found ${navSections.length} of 3 known navbar sections by id; not overwriting _navbar.v6.json automatically.`);
  process.exit(1);
}

writeFileSync(resolve(__dirname, '_navbar.v6.json'), JSON.stringify(navSections, null, 2));
console.log('Wrote _navbar.v6.json from live home navbar');
