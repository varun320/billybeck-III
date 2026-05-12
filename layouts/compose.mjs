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

// Inject active-state on the nav link matching the current page.
// Desktop nav links carry: color:#9a9a9a + border-bottom:1px solid transparent
// Mobile nav links carry:  color:#ffffff  + border-left:3px solid transparent
// For the link with data-page="<page>", swap to the red active treatment and
// add data-active="true" so the onmouseout handler keeps the active styling.
const ACTIVE_MAP = {
  about: 'about',
  coaching: 'coaching',
  testimonials: 'testimonials',
  contact: 'contact',
  blog: 'blog',
  legion: 'legion',
  single: 'blog',
};
const activeKey = ACTIVE_MAP[page];
if (activeKey === 'legion') {
  // Legion has its own teal-pill styling -- active state inverts to filled teal
  // (background:#14b8a6, color:#0a0a0a) which is visually distinct from the red
  // active treatment used by every other nav link.
  const tagRe = /<a data-page="legion"([^>]*)>/g;
  function activate(node) {
    if (Array.isArray(node)) { for (const item of node) activate(item); return; }
    if (!node || typeof node !== 'object') return;
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === 'string' && (k === 'editor' || k === 'tab_content')) {
        node[k] = v.replace(tagRe, (_, attrs) => {
          const a = attrs
            .replace('color:#14b8a6', 'color:#0a0a0a')
            .replace('background-color:transparent', 'background-color:#14b8a6')
            .replace('box-shadow:0 0 0 0 rgba(20,184,166,0)', 'box-shadow:0 0 18px rgba(20,184,166,0.4)');
          return `<a data-page="legion" data-active="true"${a}>`;
        });
      } else if (v && typeof v === 'object') {
        activate(v);
      }
    }
  }
  activate(composed);
} else if (activeKey) {
  const tagRe = new RegExp(`<a data-page="${activeKey}"([^>]*)>`, 'g');
  function activate(node) {
    if (Array.isArray(node)) { for (const item of node) activate(item); return; }
    if (!node || typeof node !== 'object') return;
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === 'string' && (k === 'editor' || k === 'tab_content')) {
        node[k] = v.replace(tagRe, (_, attrs) => {
          let a = attrs
            .replace('color:#9a9a9a', 'color:#c8102e')
            .replace('color:#ffffff', 'color:#c8102e')
            .replace('border-bottom:1px solid transparent', 'border-bottom:1px solid #c8102e')
            .replace('border-left:3px solid transparent', 'border-left:3px solid #c8102e')
            .replace(/font-weight:[^;"]*;?/, '');
          // Add font-weight:700 + data-active flag at the end
          return `<a data-page="${activeKey}" data-active="true"${a.replace('data-page="' + activeKey + '"', '').replace('text-decoration:none;', 'text-decoration:none;font-weight:700;')}>`;
        });
      } else if (v && typeof v === 'object') {
        activate(v);
      }
    }
  }
  activate(composed);
}

const outPath = join(__dirname, `${page}.v6.json`);
writeFileSync(outPath, JSON.stringify(composed, null, 2) + '\n');
console.log(`Wrote ${outPath} (${composed.length} sections, base="${base}", active="${activeKey || 'none'}")`);
