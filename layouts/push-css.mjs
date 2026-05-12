#!/usr/bin/env node
// Push the single-post styling CSS into Customizer Additional CSS (post_type=custom_css).
// WP stores Customizer CSS as a single post per theme, post_name=<theme-slug>.
//
// Usage:
//   node push-css.mjs probe         — list any custom_css posts
//   node push-css.mjs push          — create or update the hello-elementor custom_css post
//   node push-css.mjs site-title    — set site title to "Billy Beck III" (header brand)

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
  const headers = { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  const res = await fetch(mcpUrl, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) }) });
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
  await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'push-css', version: '1.0' } });
  await fetch(mcpUrl, { method: 'POST', headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }).catch(() => {});
}
async function call(name, args) {
  const out = await rpc('tools/call', { name, arguments: args });
  if (out.isError) throw new Error(`Tool ${name} failed: ${(out.content || []).map(c => c.text).join('\n').slice(0, 400)}`);
  const txt = (out.content || []).map(c => c.text || '').join('\n');
  try { return JSON.parse(txt); } catch { return txt; }
}

const cmd = process.argv[2];
const THEME_SLUG = 'hello-elementor';
const CSS_PATH = resolve(__dirname, 'single-post.css');

await init();

if (cmd === 'probe') {
  const r = await call('wp_cpt_search', { post_type: 'custom_css', per_page: 50, status: 'publish' });
  const arr = r.results || (Array.isArray(r) ? r : []);
  arr.forEach(p => console.log(`${p.ID}  ${p.post_status}  /${p.post_name}  — ${p.post_title}`));
  if (!arr.length) console.log('(no custom_css posts)');
  process.exit(0);
}

if (cmd === 'push') {
  const css = readFileSync(CSS_PATH, 'utf8');
  // Find existing custom_css for this theme
  const existing = await call('wp_cpt_search', { post_type: 'custom_css', per_page: 50, status: 'publish' });
  const arr = existing.results || (Array.isArray(existing) ? existing : []);
  const target = arr.find(p => p.post_name === THEME_SLUG);
  if (target) {
    console.log(`Updating existing custom_css post id ${target.ID}...`);
    const r = await call('wp_update_cpt', {
      post_type: 'custom_css',
      id: target.ID,
      title: THEME_SLUG,
      content: css,
      status: 'publish',
    });
    console.log('Updated:', JSON.stringify(r).slice(0, 300));
  } else {
    console.log(`Creating new custom_css post for theme "${THEME_SLUG}"...`);
    const r = await call('wp_add_cpt', {
      post_type: 'custom_css',
      title: THEME_SLUG,
      content: css,
      status: 'publish',
    });
    console.log('Created:', JSON.stringify(r).slice(0, 300));
  }
  process.exit(0);
}

if (cmd === 'site-title') {
  const r = await call('wp_update_general_settings', { title: 'Billy Beck III' });
  console.log('Site title set:', JSON.stringify(r).slice(0, 200));
  process.exit(0);
}

console.error('Commands: probe | push | site-title');
process.exit(1);
