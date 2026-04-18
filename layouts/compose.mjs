#!/usr/bin/env node
// Composes nav + body + footer into a complete page layout JSON.
// Usage: node compose.mjs <page-name>
//   page-name: about | coaching | testimonials | contact | home
// Reads: _navbar.v6.json, _footer.v6.json, <page>.body.json
// Writes: <page>.v6.json
//
// SITE_BASE env var (default "/billybeck") is prepended to all internal
// slash-relative URLs so links work on the subdirectory install. For prod
// root-install, run with SITE_BASE="".

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const page = process.argv[2];
if (!page) { console.error('Usage: node compose.mjs <page-name>'); process.exit(1); }

const nav = JSON.parse(readFileSync(join(__dirname, '_navbar.v6.json'), 'utf8'));
const footer = JSON.parse(readFileSync(join(__dirname, '_footer.v6.json'), 'utf8'));
const body = JSON.parse(readFileSync(join(__dirname, `${page}.body.json`), 'utf8'));

const base = (process.env.SITE_BASE ?? '/billybeck').replace(/\/$/, '');

function rewriteInternalUrl(url) {
  if (typeof url !== 'string' || url.length === 0) return url;
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  if (base === '' ) return url;
  if (url === base || url.startsWith(base + '/')) return url;
  if (url === '/') return base + '/';
  return base + url;
}

function walk(node) {
  if (Array.isArray(node)) { for (const item of node) walk(item); return; }
  if (node && typeof node === 'object') {
    if (typeof node.url === 'string') node.url = rewriteInternalUrl(node.url);
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === 'string' && (k === 'editor' || k === 'tab_content' || k === 'text' || k.endsWith('_content'))) {
        node[k] = v.replace(/href="(\/[^"]*)"/g, (_, u) => `href="${rewriteInternalUrl(u)}"`);
      } else if (v && typeof v === 'object') {
        walk(v);
      }
    }
  }
}

const composed = [...nav, ...body, ...footer];
walk(composed);

const outPath = join(__dirname, `${page}.v6.json`);
writeFileSync(outPath, JSON.stringify(composed, null, 2) + '\n');
console.log(`Wrote ${outPath} (${composed.length} sections, base="${base}")`);
