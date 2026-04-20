const fs = require('fs');
const path = require('path');

const ROOT = 'D:/projects/prodigy-ai/projects/billybeck/crawl/billybeck-com';
const PAGES = path.join(ROOT, 'pages');
if (!fs.existsSync(PAGES)) fs.mkdirSync(PAGES, { recursive: true });

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'dataset.json'), 'utf8'));

function slugify(u) {
  try {
    const parsed = new URL(u);
    let p = parsed.pathname.replace(/^\/+|\/+$/g, '');
    if (!p) p = 'home';
    p = p.replace(/\//g, '__').replace(/[^a-zA-Z0-9._-]+/g, '-');
    const host = parsed.host.replace(/^www\./, '');
    return host === 'billybeck.com' ? p : `${host.replace(/\./g, '_')}__${p}`;
  } catch (e) {
    return u.replace(/[^a-zA-Z0-9._-]+/g, '-');
  }
}

const index = [];
const seen = new Set();
for (const item of data) {
  let slug = slugify(item.url);
  let base = slug;
  let n = 1;
  while (seen.has(slug)) slug = `${base}-${++n}`;
  seen.add(slug);

  const filename = `${slug}.md`;
  const title = item.metadata?.title || '';
  const description = item.metadata?.description || '';
  const lang = item.metadata?.languageCode || '';
  const md = item.markdown || item.text || '';

  const front = [
    `---`,
    `url: ${item.url}`,
    `title: ${JSON.stringify(title)}`,
    description ? `description: ${JSON.stringify(description)}` : null,
    lang ? `language: ${lang}` : null,
    `crawled_at: ${item.crawl?.loadedTime || ''}`,
    `---`,
  ].filter(l => l !== null).join('\n');

  fs.writeFileSync(path.join(PAGES, filename), front + '\n\n' + md + '\n', 'utf8');
  index.push({ url: item.url, title, file: `pages/${filename}`, bytes: md.length, lang });
}

// Write index.json and README.md
fs.writeFileSync(path.join(ROOT, 'index.json'), JSON.stringify(index, null, 2), 'utf8');

const readme = [
  `# billybeck.com crawl`,
  ``,
  `- Source: https://billybeck.com/`,
  `- Crawled via Apify actor \`apify/website-content-crawler\``,
  `- Run ID: cEZMUZzNMz53IlkC0`,
  `- Dataset ID: CqYeKLPbCEaTIQtch`,
  `- Pages: ${index.length}`,
  `- Crawled at: ${new Date().toISOString()}`,
  ``,
  `## Files`,
  `- \`dataset.json\` — raw full dataset from Apify (all fields: url, crawl, metadata, text, markdown, html links, screenshotUrl, debug).`,
  `- \`index.json\` — machine-readable list of pages with url, title, file, size.`,
  `- \`pages/*.md\` — one markdown file per crawled URL, with YAML frontmatter.`,
  ``,
  `## Pages`,
  ``,
  ...index.map(i => `- [${i.title || i.url}](${i.file}) — \`${i.url}\``),
  ``,
].join('\n');
fs.writeFileSync(path.join(ROOT, 'README.md'), readme, 'utf8');

console.log('Wrote', index.length, 'pages');
console.log('Total markdown bytes:', index.reduce((s, i) => s + i.bytes, 0));
