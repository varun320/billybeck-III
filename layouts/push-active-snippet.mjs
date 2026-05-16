#!/usr/bin/env node
// Create or update an elementor_snippet that injects a tiny client-side script
// at wp_footer to set data-active="true" + active styling on the nav link
// matching the current page slug. This replaces the compose-time active state
// injection that was previously baked per page.
//
// Usage:
//   node push-active-snippet.mjs probe                  — list snippets
//   node push-active-snippet.mjs create                 — create new
//   node push-active-snippet.mjs update <id>            — update existing

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
  await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'push-active-snippet', version: '1.0' } });
  await fetch(mcpUrl, { method: 'POST', headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }).catch(() => {});
}
async function call(name, args) {
  const out = await rpc('tools/call', { name, arguments: args });
  if (out.isError) throw new Error(`Tool ${name} failed: ${(out.content || []).map(c => c.text).join('\n').slice(0, 400)}`);
  const txt = (out.content || []).map(c => c.text || '').join('\n');
  try { return JSON.parse(txt); } catch { return txt; }
}

const SNIPPET_CODE = `<script>
(function(){
  function apply(){
    var path = (location.pathname || '').replace(/\\/$/, '').toLowerCase();
    var slugToKey = {
      '/billybeck/billy-beck-iii': 'about',
      '/billybeck/coaching': 'coaching',
      '/billybeck/testimonials': 'testimonials',
      '/billybeck/contact': 'contact',
      '/billybeck/blog': 'blog',
      '/billybeck/legion-of-lions': 'legion'
    };
    var key = slugToKey[path];
    if (!key && document.body && document.body.className.indexOf('single-post') >= 0) key = 'blog';
    if (!key) return;
    var links = document.querySelectorAll('a[data-page="' + key + '"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      a.setAttribute('data-active', 'true');
      a.dataset.active = 'true';
      if (key === 'legion') {
        a.style.backgroundColor = '#14b8a6';
        a.style.color = '#0a0a0a';
        a.style.boxShadow = '0 0 18px rgba(20,184,166,0.4)';
      } else {
        a.style.color = '#c8102e';
        a.style.fontWeight = '700';
        var bs = a.getAttribute('style') || '';
        if (bs.indexOf('border-bottom:1px solid transparent') >= 0) a.style.borderBottomColor = '#c8102e';
        if (bs.indexOf('border-left:3px solid transparent') >= 0) a.style.borderLeftColor = '#c8102e';
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
</script>`;

await init();
const cmd = process.argv[2];

if (cmd === 'probe') {
  const r = await call('wp_cpt_search', { post_type: 'elementor_snippet', per_page: 50, status: ['publish', 'draft'] });
  const arr = r.results || (Array.isArray(r) ? r : []);
  if (!arr.length) console.log('(no elementor_snippet posts)');
  arr.forEach(t => console.log(`${t.ID}  ${t.post_status}  /${t.post_name}  — ${t.post_title}`));
  process.exit(0);
}

const meta = {
  _elementor_code: SNIPPET_CODE,
  _elementor_location: 'wp_footer',
  _elementor_priority: 10,
};

if (cmd === 'create') {
  const r = await call('wp_add_cpt', {
    post_type: 'elementor_snippet',
    title: 'Active Nav State',
    content: ' ',
    status: 'publish',
    meta,
  });
  console.log('Created:', JSON.stringify(r).slice(0, 200));
  const id = r.results?.ID || r.ID || r.id;
  if (id) {
    // Re-push meta because wp_add_cpt may not persist meta on first call
    const u = await call('wp_update_cpt', { post_type: 'elementor_snippet', id, title: 'Active Nav State', status: 'publish', meta });
    console.log('Meta re-pushed via update');
  }
  process.exit(0);
}

if (cmd === 'update') {
  const id = parseInt(process.argv[3], 10);
  if (!id) throw new Error('update <id>');
  const r = await call('wp_update_cpt', { post_type: 'elementor_snippet', id, title: 'Active Nav State', status: 'publish', meta });
  console.log('Updated:', JSON.stringify(r).slice(0, 200));
  process.exit(0);
}

console.error('Commands: probe | create | update <id>');
process.exit(1);
