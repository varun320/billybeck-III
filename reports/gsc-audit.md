# GSC Audit — billybeck.com

**Property:** `sc-domain:billybeck.com` (domain property, covers all sub-domains + protocols)
**Permission level:** `siteFullUser`
**Generated:** 2026-04-23
**Primary window:** 90 days (2026-01-23 → 2026-04-22)
**Data source:** Search Console API via `mcp-search-console`

---

## 1. Executive summary

| Metric (last 90d) | Value |
|---|---:|
| Total clicks | 1,400 |
| Total impressions | 106,024 |
| Average CTR | 1.32% |
| Average position | 6.8 |
| Indexed URLs (per sitemap) | 6,444 |

**Three things that matter most:**

1. **The site over-indexes heavily on brand queries.** The top 10 queries by clicks are all brand or brand-adjacent ("billy beck trainer", "billybeck.com/upw", "billy beck iii", "billy beck tony robbins"). Any one of them drops and the traffic drops with it. There is almost no non-brand organic acquisition.
2. **Massive ranking, terrible CTR on informational content.** `/effective-eating/5-highly-effective-nutrition-rules-that-every-smart-trainer-knows` ranks at position **3.2** with **51,017 impressions** yet only **36 clicks** (0.07% CTR). That's roughly a 3%-of-potential capture rate at that rank. Something is wrong with the title/meta/thumbnail for those SERPs, or this is a secondary result being shown in a feature box.
3. **Two sitemaps are submitted, including an HTTP version that should not exist.** Both sitemaps report "Has warnings" (2 and 5 warnings respectively). The duplicate and the http:// variant should be removed.

---

## 2. Performance trend — volume volatile, position stable

Daily clicks range from 2 to **455** (a single-day outlier on 2026-03-15). Impressions range from ~350 to ~11,000/day. Three regimes in the 90-day window:

| Window | Pattern |
|---|---|
| Jan 23 – Feb 13 | Impression spikes (3k–11k/day) on days 1/29, 1/30, 2/2, 2/13 with 0.2–0.3% CTR → a page ranked briefly for a high-volume non-brand query then faded. |
| Feb 14 – Mar 14 | Quiet baseline, ~8 clicks/day, CTR ~1.5%, avg pos ~10. |
| Mar 15 – Apr 22 | 2026-03-15 single-day burst (**455 clicks, 29% CTR**) then settled into a higher baseline (~10 clicks/day at ~8 avg pos). |

**Most recent 4 weeks look normal** — 8–17 clicks/day, 350–1,600 impressions/day, position ~8–10. No obvious ranking collapse or manual-action signature.

**Action.** Confirm internally what happened 2026-03-15. Given the near-100%-brand composition of the top queries that day, it was likely a TV spot, podcast appearance, or email blast pushing people to Google the brand.

---

## 3. Top queries — brand-dominated

### Top 10 queries (90d)

| Query | Clicks | Impressions | CTR | Pos |
|---|---:|---:|---:|---:|
| billy beck trainer | 90 | 183 | 49.2% | 1.6 |
| billybeck.com/upw | 80 | 107 | 74.8% | 1.0 |
| billy beck | 74 | 3,199 | 2.3% | 9.1 |
| billy beck iii | 56 | 184 | 30.4% | 3.9 |
| billybeck/upw | 44 | 53 | 83.0% | 1.0 |
| billy beck upw | 39 | 48 | 81.3% | 1.0 |
| billy beck/tony | 37 | 64 | 57.8% | 1.0 |
| billy beck tony robbins | 28 | 81 | 34.6% | 7.9 |
| billybeck | 27 | 48 | 56.3% | 1.0 |
| billybeck.com | 21 | 37 | 56.8% | 1.0 |

**Brand share:** 100% of the top 10. The next rung down (positions 11–50) is international branded variants plus a handful of generic terms ("eurotraining", "tony robbins personal trainer", "nutrition rules", "best foods to lose belly fat"), most earning 1–2 clicks each.

**Observations.**

- **"billy beck" is not owning its own SERP.** 3,199 impressions, position 9.1, CTR 2.3%. A name search should rank position 1–2 with ~40%+ CTR (competing result: his own homepage). At pos 9 he's losing the brand click to whatever is ranking #1–8. Likely candidates: affiliated/partner domains, Wikipedia, news, YouTube channels. Worth a manual SERP check.
- **"billy beck iii" ranks 3.9 with 30% CTR.** Better, but still not #1 for a full-name query. The `/billy-beck-iii` page shows up but gets only 6 clicks on 652 impressions (1% CTR). The canonical brand page could be stronger.
- **URL-shaped queries** (`billybeck.com/upw`, `billybeck/upw`, `billy beck upw`) deliver very high CTR (60–80%). These are people who saw the URL somewhere (presentation slide, handout, on-stage mention) and typed it into Google. That's **offline-to-organic** leakage.

### Non-brand opportunity queries (clicks ≥ 1, position ≤ 5, impressions ≥ 50)

| Query | Clicks | Impressions | CTR | Pos | Implied potential (100% CTR at pos 1) |
|---|---:|---:|---:|---:|---:|
| gregg avedon | 1 | 443 | 0.2% | 2.4 | ~150 clicks |
| eurotraining | 2 | 336 | 0.6% | 9.1 | move to pos 3 → ~50 clicks |
| rice experiment with words | 1 | 131 | 0.8% | 9.3 | retitle for better CTR |
| teste do arroz | 2 | 16 | 12.5% | 8.9 | PT-language rice experiment |
| 日本語 / スピードバッグ | 6 | 213 | 2.8% | 8.3 | JA speed bag topic |

The `gregg avedon` query is the most egregious waste: 443 impressions at position 2.4 but only 1 click. The page (`/living-it/expert-personal-trainer-interview-with-gregg-avedon`) has a title that does not match the query intent. Easy retitle wins ~20–30 clicks per month without any new content.

---

## 4. Top pages — the 51k-impression problem

### Top 10 pages by clicks (90d)

| Page | Clicks | Impressions | CTR | Pos |
|---|---:|---:|---:|---:|
| /upw | 388 | 2,572 | 15.1% | 6.8 |
| / | 313 | 4,265 | 7.3% | 5.0 |
| /tony | 128 | 836 | 15.3% | 6.7 |
| /effective-eating/5-highly-effective-nutrition-rules-that-every-smart-trainer-knows | 36 | **51,017** | **0.07%** | **3.2** |
| /mental-conditioning/the-rice-experiment-this-will-blow-your-mind | 36 | 9,486 | 0.4% | 8.9 |
| /wp-content/uploads/2022/01/Final-Life-Force-Beg-Plan.pdf | 21 | 286 | 7.3% | 8.0 |
| /de/ | 20 | 327 | 6.1% | 8.6 |
| /living-it/expert-personal-trainer-interview-with-gregg-avedon | 17 | 542 | 3.1% | 6.3 |
| /nl/mentale-conditionering/het-rijst-experiment-dit-zal-je-versteld-doen-staan | 17 | 852 | 2.0% | 6.4 |
| /uncategorized/upw-30-day-training-challenge-emails | 16 | 483 | 3.3% | 3.3 |

### The two "ranking but not earning" pages

#### `/effective-eating/5-highly-effective-nutrition-rules-that-every-smart-trainer-knows`

- **51,017 impressions** at position 3.2 over 90 days.
- **36 clicks → 0.07% CTR.** Position 3.2 should be converting at 15–20%.
- **Gap to expected performance:** at 15% CTR this page would earn ~7,650 clicks/quarter — roughly 5× the entire site's current organic click total.
- **Likely cause:** the page is appearing in a SERP feature (People Also Ask, video carousel, featured snippet fragment) where the click attribution goes elsewhere, OR the title/meta is grossly mismatched to what's actually ranking.
- **Action:** Manually inspect the SERP for the queries driving those impressions. Likely candidates based on GSC query data: nutrition-rules-adjacent informational queries. Confirm whether this is a People Also Ask position (which collects impressions but not clicks).

#### `/mental-conditioning/the-rice-experiment-this-will-blow-your-mind`

- 9,486 impressions at position 8.9, 0.4% CTR.
- English rice-experiment content. Non-English translations (`/nl/...`, `/de/...`, `/es/...`, `/ja/...`, `/pt/...`, `/it/...`) rank similarly but CTR ranges from 2–10% — the translations actually perform better than the English original. The English page has a title-tag problem.

### Structural findings

- **21 PDF clicks on `Final-Life-Force-Beg-Plan.pdf` and 11 on `Final-Life-Force-Advanced-Plan-Male.pdf`.** Direct-to-PDF organic traffic. PDFs should either be gated behind an email form (capture lead) or have a landing page with a download CTA so GA4 can count the funnel properly.
- **International pages are ~30% of top-50 pages.** The multilingual content is working as an SEO diversifier. 8 language trees (/de, /es, /fr, /it, /ja, /nl, /pt, /zh) are indexed. Worth doubling down on the translations that convert.

---

## 5. Device & geo

### Device (90d)

| Device | Clicks | Impressions | CTR | Pos |
|---|---:|---:|---:|---:|
| MOBILE | 900 (64.3%) | 72,774 (68.6%) | 1.24% | 5.0 |
| DESKTOP | 488 (34.9%) | 30,558 (28.8%) | 1.60% | 11.3 |
| TABLET | 12 (0.9%) | 2,692 (2.5%) | 0.45% | 5.6 |

**Mobile-first reality:** 64% of clicks, 69% of impressions, position 5.0 (vs desktop's 11.3). The site is fundamentally a mobile discovery surface. Desktop's worse ranking but better CTR is the classic "fewer but more intent-driven desktop searchers" pattern. Continue optimizing for mobile SERPs.

### Top countries (90d)

| Country | Clicks | Impressions | CTR | Pos |
|---|---:|---:|---:|---:|
| USA | 592 (42%) | 22,080 | 2.68% | 9.3 |
| CAN | 115 | 8,754 | 1.31% | 4.4 |
| **GBR** | **100** | **21,008** | **0.48%** | **3.9** |
| AUS | 78 | 6,204 | 1.26% | 3.8 |
| JPN | 77 | 2,384 | 3.23% | 9.5 |
| DEU | 63 | 4,545 | 1.39% | 10.0 |
| NLD | 40 | 2,022 | 1.98% | 12.3 |
| ITA | 32 | 2,136 | 1.50% | 15.1 |
| FRA | 28 | 1,321 | 2.12% | 12.8 |
| ESP | 20 | 1,780 | 1.12% | 19.8 |
| **IRL** | **14** | **14,843** | **0.09%** | **3.2** |

Two anomalies stand out:

- **IRL: 14,843 impressions at pos 3.2, 0.09% CTR.** This is most of the 51k-impression page leaking into Ireland. A single page is ranking well in Ireland for a high-volume query that nobody is clicking — same root cause as §4 finding.
- **GBR: 21k impressions, pos 3.9, 0.48% CTR.** Same pattern. UK users see the site in search but don't click through. Combine with the nutrition-rules finding and this is clearly one page dominating the story.

JPN and DEU convert impressions → clicks at 2–3× the rates of UK/IRL. The translation program is earning its keep.

---

## 6. Indexing & sitemaps

### Submitted sitemaps

| Path | Last downloaded | Status | Indexed URLs | Errors | Warnings |
|---|---|---|---:|---:|---:|
| `https://www.billybeck.com/sitemap_index.xml` | 2026-04-22 04:49 | Has warnings | 6,444 | 0 | **2** |
| `http://www.billybeck.com/sitemap.xml` | 2026-04-15 16:00 | Has warnings | 6,444 | 0 | **5** |

### Issues

1. **The HTTP sitemap should not be submitted.** The site serves HTTPS; an HTTP sitemap teaches Google the wrong canonical. Delete `http://www.billybeck.com/sitemap.xml` from GSC.
2. **Both sitemaps are `www.billybeck.com`** but the actual pages in the queries/pages reports return as `billybeck.com` (no `www`). Make sure the canonical host is decided and redirects are consistent.
3. **6,444 indexed URLs is a lot for a site with ~100 real pages** (blog posts, testimonials, coaching, UPW, Tony pages, multilingual trees). This suggests:
   - Heavy pagination (`/page/2`, `/page/3`, tags, categories, author archives)
   - Multilingual duplicates counted individually (8 languages × base content ≈ 9×)
   - Attachment pages, feed URLs, `?p=123` legacy URLs
   - The real question is: how many of these 6,444 are actually valuable? If only ~500 drive traffic (and the top 50 pages receive 90%+ of clicks), the rest are index bloat that dilutes crawl budget.
4. **Both sitemaps report the same 6,444 count.** They're duplicates — kill the HTTP one and consolidate.

### Recommended actions

- Delete the `http://www.billybeck.com/sitemap.xml` submission.
- Resolve the 2 warnings on the HTTPS sitemap — typically 301s or 404s inside the sitemap. GSC won't tell us which through this API; will need to open the GSC UI or do `inspect_url_enhanced` on a sampled set.
- Audit indexing:
  - Do a crawl (Screaming Frog or similar) limited to the submitted sitemap URLs.
  - Count how many return 200 with unique content.
  - Add `noindex` to low-value archives: `/tag/`, `/page/*`, `/author/`, `/feed/`, `/comments/`.
  - In `robots.txt` or via WordPress settings, block crawlers on attachment pages (`?attachment_id=*`).

---

## 7. Top issues (summary)

| # | Finding | Severity | Fix |
|---|---|---|---|
| 1 | `/effective-eating/5-highly-effective-nutrition-rules-*` — 51k imp, 36 clicks, pos 3.2 | **CRITICAL** | Inspect SERP manually; fix title/meta; confirm whether it's a People Also Ask placement. |
| 2 | 100% brand share in top 10 queries | HIGH | Non-brand content strategy (see §8). |
| 3 | "billy beck" name search ranks pos 9 | HIGH | SERP audit — what is ranking above his own site? Fix entity signals, schema, consistency. |
| 4 | 2 sitemaps submitted including HTTP variant | HIGH | Delete HTTP sitemap; resolve 2 warnings on HTTPS sitemap. |
| 5 | `/mental-conditioning/the-rice-experiment-*` — 9.5k imp, 36 clicks, pos 8.9 | HIGH | Retitle; English version underperforms its own translations. |
| 6 | "gregg avedon" — pos 2.4, 1 click on 443 imp | MED | Retitle `/living-it/expert-personal-trainer-interview-with-gregg-avedon`. |
| 7 | URL-shaped brand queries (`billybeck.com/upw`) | MED | Add a `/go` or trackable short link for stage/print references; at minimum add UTMs so "Direct" in GA4 isn't lying. |
| 8 | 6,444 indexed URLs on ~100 core pages | MED | Audit and `noindex` low-value archives. |
| 9 | Multilingual CTR on DE/JP/NL > English baseline | OPPORTUNITY | Expand the high-performing translation topics; use the translations as a CTR template for the English originals. |
| 10 | IRL country delivers 14,843 imp, 0.09% CTR | LOW | Same root cause as #1. |

---

## 8. Prioritized recommendations

### This week

1. **Delete the HTTP sitemap** and investigate the 2 warnings on the HTTPS one.
2. **Fix the nutrition-rules page title and meta.** Use `inspect_url_enhanced` to see what Google thinks the page is about, then align title/H1/description.
3. **SERP audit "billy beck" and "billy beck iii"** — understand why his own site ranks 9.1 and 3.9 for name queries. Fix knowledge-graph / schema / sitelinks signals.
4. **Retitle `/living-it/expert-personal-trainer-interview-with-gregg-avedon`** — specifically target "gregg avedon" and associated queries. 443 impressions at pos 2.4 is free clicks waiting.

### Next 30 days

5. **Non-brand content expansion.** Every query in the top 10 is branded. Identify 5 non-brand topics where existing pages already rank pos 5–20 (see rice experiment, nutrition rules, gauntlet workout, protein powder, unbreakable mindset) and rewrite titles + internal links to target them specifically.
6. **Translation content audit.** The JA, DE, NL translations CTR 2–10% better than English originals. Document what the translators are doing differently and back-port it to English titles and metas.
7. **Index hygiene.** Audit the 6,444 indexed URLs. Target state: 300–500 intentional, high-quality indexed URLs. Everything else: `noindex`.
8. **Add structured data** for Person (Billy Beck III), Organization, Coach/LocalBusiness, Course (UPW, BB3 programs). Improves brand SERP ownership directly.

### Structural (quarter)

9. **Build a keyword plan** around non-brand informational content. The site has latent authority (engaged audience, translations, lead magnets) but no keyword target discipline. Pick 10 target queries per quarter.
10. **Track rank and CTR weekly** per target page. The GSC MCP supports this as a recurring report (`get_search_by_page_query`) — could be wired into a dashboard.
11. **Combine GA4 + GSC** in a single Looker Studio dashboard: GSC clicks → GA4 landing page sessions → GA4 key events. End-to-end organic funnel visibility.

---

## 9. Raw data locations

- 90-day performance overview: `/tmp/audit/gsc_perf_28.json` (28d failed with 403 — see §10), trend data embedded in this report
- Top queries: `/tmp/audit/gsc_queries_90.json`
- Top pages: `/tmp/audit/gsc_pages_90.json`
- Device: `/tmp/audit/gsc_devices_90.json`
- Country: `/tmp/audit/gsc_countries_90.json`
- Sitemaps: `/tmp/audit/gsc_sitemaps.json`
- 28-day period compare: `/tmp/audit/gsc_compare_28.json`

Windows path root: `C:\Users\ASUS\AppData\Local\Temp\audit\`

## 10. Collection caveats

- The GSC API returned intermittent `403 User does not have sufficient permission` errors when queries ran in parallel. Retried sequentially; final reports use successful responses. The permission level on the property is `siteFullUser`, so 403s were quota-related, not a real permission gap.
- The domain property `sc-domain:billybeck.com` reports aggregate across `www.` / non-`www.` and `http://` / `https://` — figures here are the union.
- 90-day window runs 2026-01-23 → 2026-04-22 (yesterday relative to run time). Any reader refreshing after 2026-04-24 should re-run queries — dates slide daily.
