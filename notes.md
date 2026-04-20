searhable AEO audits : https://app.searchable.com/share/report/ajZifWAVbAUZ

---

## v6 rollout — 2026-04-23

### Layouts (ready to deploy)

| page | slug | file | sections | size |
|---|---|---|---|---|
| Home | `home` (ID 18) | `layouts/home.v6.json` | 18 | 133 KB |
| About | `billy-beck-iii` | `layouts/about.v6.json` | 11 | 100 KB |
| Coaching | `coaching` | `layouts/coaching.v6.json` | 11 | 91 KB |
| Testimonials | `testimonials` | `layouts/testimonials.v6.json` | 14 | 102 KB |
| Contact | `contact` | `layouts/contact.v6.json` | 7 | 64 KB |

Shared partials: `layouts/_navbar.v6.json`, `layouts/_footer.v6.json`
Composition: `node layouts/compose.mjs <page>` → `<page>.v6.json`

### Navbar fix
- 2-column grid (logo 35% / right cluster 65%) replacing the old 3-column layout
- Logo + tagline on left (tagline hidden on mobile)
- Nav links inline-right + red CTA button with pulse hover
- Mobile: logo + CTA only, nav links hidden

### Design tokens
- Palette: `#0a0a0a` bg · `#141311` card · `#060606` footer · `#242220` border · `#e63946` red · `#14b8a6` teal · `#f5f2eb` warm light
- Fonts: Anton (display 72–168px, -1 to -3 tracking, uppercase) · Oswald (headings) · Space Mono (11px eyebrows, 4px tracking, uppercase) · Inter (body)
- Eyebrow convention: `01 / SECTION NAME` teal Space Mono

### Deployment status — BLOCKED
- `billybeck-elementor` MCP returns `[object Object]` on all reads/writes — needs server restart
- `layouts/deploy.mjs` hits `401 rest_cannot_edit` on both JWT and App Password (WP Farm scopes REST auth)
- ⚠ **Page 18 currently holds a 1-section noop probe (draft)** — needs restoration with `home.v6.json` after MCP recovers

### Deploy order once MCP recovers
1. Restore home: `update_page_from_file pageId=18 elementorFilePath=layouts/home.v6.json title="Billy Beck III — Forge Your Strongest Self" status=publish`
2. Create `/billy-beck-iii`, `/coaching`, `/testimonials`, `/contact` via `create_page` (pass `elementor_data` as stringified JSON from each `*.v6.json`)
3. Set slugs via `wp_update_page` on each new page
4. Regenerate Elementor cache on each page (bust stale frontend CSS)
