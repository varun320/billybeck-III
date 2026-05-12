#!/usr/bin/env node
// Push the Single Post Theme Builder template to elementor_library.
// Tries wp_add_cpt first (with meta as an undocumented extra), falls back
// to wp_update_cpt if a draft exists.
//
// Usage:
//   node push-template.mjs probe                        — list elementor_library entries
//   node push-template.mjs create-single                — create a new "Single Post" template
//   node push-template.mjs update <id>                  — push single.v6.json into existing template id
//   node push-template.mjs raw <method> <jsonArgs>      — raw JSON-RPC tool call

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
  await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'push-template', version: '1.0' } });
  await fetch(mcpUrl, { method: 'POST', headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }).catch(() => {});
}
async function call(name, args) {
  const out = await rpc('tools/call', { name, arguments: args });
  if (out.isError) throw new Error(`Tool ${name} failed: ${(out.content || []).map(c => c.text).join('\n').slice(0, 400)}`);
  const txt = (out.content || []).map(c => c.text || '').join('\n');
  try { return JSON.parse(txt); } catch { return txt; }
}

const cmd = process.argv[2];
const SINGLE_FILE = resolve(__dirname, 'single.v6.json');
const SINGLE_TITLE = 'Single Post — Field Notes Template';

await init();

if (cmd === 'probe') {
  const r = await call('wp_cpt_search', { post_type: 'elementor_library', per_page: 50 });
  const arr = r.results || (Array.isArray(r) ? r : []);
  arr.forEach(t => console.log(`${t.ID}  ${t.post_status}  /${t.post_name}  — ${t.post_title}`));
  process.exit(0);
}

if (cmd === 'create-single') {
  const layout = JSON.parse(readFileSync(SINGLE_FILE, 'utf8'));
  // Try add_cpt with meta as undocumented extra
  console.log('Attempting wp_add_cpt with meta passthrough...');
  let created;
  try {
    created = await call('wp_add_cpt', {
      post_type: 'elementor_library',
      title: SINGLE_TITLE,
      content: ' ',
      status: 'publish',
      meta: {
        _elementor_data: JSON.stringify(layout),
        _elementor_edit_mode: 'builder',
        _elementor_template_type: 'single',
        _elementor_version: '4.0.7',
        _elementor_conditions: ['include/singular/post'],
        _wp_page_template: 'elementor_canvas',
      },
      template_type: 'single',
    });
    console.log('Created:', JSON.stringify(created).slice(0, 400));
  } catch (e) {
    console.log('Failed:', e.message.slice(0, 300));
    process.exit(1);
  }
  // Re-pull and verify meta was set
  const id = created.ID || created.id;
  if (!id) { console.log('No ID returned; cannot verify'); process.exit(1); }
  const verify = await call('wp_get_cpt', { post_type: 'elementor_library', id, context: 'edit' });
  console.log('Verify:', 'meta keys:', Object.keys(verify.meta || {}).join(','), '| _elementor_data length:', (verify.meta?._elementor_data || '').length);
  process.exit(0);
}

if (cmd === 'update') {
  const id = parseInt(process.argv[3], 10);
  if (!id) throw new Error('update <id>');
  const layout = JSON.parse(readFileSync(SINGLE_FILE, 'utf8'));
  const result = await call('wp_update_cpt', {
    post_type: 'elementor_library',
    id,
    title: SINGLE_TITLE,
    status: 'publish',
    meta: {
      _elementor_data: JSON.stringify(layout),
      _elementor_edit_mode: 'builder',
      _elementor_template_type: 'single',
      _elementor_version: '4.0.7',
      _elementor_conditions: ['include/singular/post'],
      _wp_page_template: 'elementor_canvas',
    },
  });
  console.log('Updated:', JSON.stringify(result).slice(0, 400));
  const verify = await call('wp_get_cpt', { post_type: 'elementor_library', id, context: 'edit' });
  console.log('Verify meta keys:', Object.keys(verify.meta || {}).join(','));
  console.log('_elementor_data length:', (verify.meta?._elementor_data || '').length);
  console.log('_elementor_template_type:', verify.meta?._elementor_template_type);
  console.log('_elementor_conditions:', JSON.stringify(verify.meta?._elementor_conditions));
  process.exit(0);
}

if (cmd === 'raw') {
  const method = process.argv[3];
  const args = JSON.parse(process.argv[4] || '{}');
  const r = await call(method, args);
  console.log(JSON.stringify(r, null, 2).slice(0, 2000));
  process.exit(0);
}

console.error('Commands: probe | create-single | update <id> | raw <tool> <jsonArgs>');
process.exit(1);
