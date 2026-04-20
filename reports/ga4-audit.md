# GA4 Audit — billybeck.com

**Property:** `properties/394194095` (www.billybeck.com - GA4)
**Account:** `accounts/3768290` (www.billybeck.com)
**Timezone:** America/New_York
**Currency:** USD
**Generated:** 2026-04-23
**Primary window:** 90 days (2026-01-24 → 2026-04-22)
**Data source:** GA4 Data API via `analytics-mcp`

---

## 1. Executive summary

| Metric (last 90d) | Value |
|---|---|
| Sessions | 11,036 |
| Active users | 6,863 |
| New users | 6,806 (98.9% of active users) |
| Page views | 18,262 |
| Pages / session | 1.65 |
| Engagement rate | 51.8% |
| Bounce rate | 48.2% |
| Avg session duration | 4:02 (241.9s) |
| Total events | 67,951 |
| **Conversions (key events)** | **0** |

**Three things that matter most:**

1. **Traffic collapsed ~80% in the last 28 days.** Sessions went from 8,327 (Feb 27 – Mar 26) to 1,771 (Mar 27 – Apr 23). This is the headline finding — everything else is secondary.
2. **Zero configured conversions.** The property has rich engagement events (form_submit: 2,498; file_download: 10,833) but none are marked as **key events**, so every "conversions" cell is 0. Attribution, ROI, and channel comparison are all impossible today.
3. **A single referrer (`bb3nextlevel.com`) drives 25% of all sessions.** When that referral source quiets down, total traffic drops — which is exactly what happened in the 28-day cliff.

---

## 2. 28-day trend — sharp decline

| Metric | Previous 28d (Feb 27 – Mar 26) | Last 28d (Mar 27 – Apr 23) | Δ |
|---|---:|---:|---:|
| Sessions | 8,327 | 1,771 | **−78.7%** |
| Active users | 5,165 | 1,001 | **−80.6%** |
| New users | 5,137 | 752 | **−85.4%** |
| Page views | 13,450 | 2,870 | **−78.7%** |
| Engagement rate | 54.6% | 41.2% | −13.4 pp |
| Avg session duration | 3:53 | 4:51 | +25% |

**Interpretation.** The earlier window contained a 2026-03-15 spike that GSC also registered (455 clicks, 29% CTR day vs ~10/day baseline) and heavy `bb3nextlevel.com` referral volume. That promotion/launch event ended. What remains is the steady-state baseline — smaller but slightly more engaged (longer sessions, fewer drive-by hits).

**Action.** Confirm with the team what happened ~Mar 15. If it was a Tony Robbins UPW event or email blast, this is a seasonal pattern, not a crisis. If it was supposed to sustain, there is a drop to investigate.

---

## 3. Channel & source mix

### Default channel grouping (90d)

| Channel | Sessions | Users | Engagement | Share |
|---|---:|---:|---:|---:|
| Direct | 6,649 | 4,940 | 51.4% | 60.3% |
| Referral | 2,763 | 1,207 | 42.2% | 25.0% |
| Organic Search | 1,709 | 1,286 | 63.1% | 15.5% |
| Organic Social | 161 | 151 | 52.2% | 1.5% |
| Unassigned | 35 | 35 | 8.6% | 0.3% |
| Organic Video | 11 | 2 | 54.5% | 0.1% |

### Top sources (90d)

| Source / Medium | Sessions | Engagement |
|---|---:|---:|
| (direct) / (none) | 6,649 | 51.4% |
| **bb3nextlevel.com / referral** | **2,687** | **42.1%** |
| google / organic | 1,552 | 63.0% |
| bing / organic | 69 | 73.9% |
| m.facebook.com / referral | 48 | 50.0% |
| ig / social | 40 | 62.5% |
| facebook.com / referral | 32 | 31.3% |
| yahoo / organic | 32 | 62.5% |
| duckduckgo / organic | 31 | 54.8% |
| (not set) / (not set) | 30 | 0% |
| dropbox.com / referral | 19 | 47.4% |
| lm.facebook.com / referral | 18 | 50.0% |
| ya.ru / referral | 17 | 11.8% |
| youtube.com / referral | 11 | 54.5% |

**Observations.**

- **Referral concentration risk:** `bb3nextlevel.com` alone = 25% of all sessions. Five Facebook sub-domains (m./lm./l./facebook.com + `ig`) are counted separately — consolidating them in channel grouping would give Facebook ~6% share instead of hiding it.
- **Organic search has the best engagement rate (63%)** — higher than Direct (51%) or Referral (42%). Yet organic is only 15% of traffic. This is the highest-quality, most under-developed channel.
- **`(not set)` and `Unassigned`** together are 65 sessions (0.6%) — low enough to ignore, but the 8.6% engagement rate on Unassigned suggests bot or broken-tagging traffic.
- **No Paid Search, no Email, no Display channel shows any traffic.** Either nothing is being spent, or UTM tagging is missing. If there are paid campaigns or email sends, they are being mis-attributed to Direct.

---

## 4. Top pages & landing pages

### Top pages by views (90d)

| Page | Views | Users | Engagement | Avg duration |
|---|---:|---:|---:|---:|
| /30-day-training-challenge-thank-you/ | 4,151 | 2,385 | 66.3% | 5:15 |
| /upw/ | 3,296 | 2,504 | 61.4% | 1:14 |
| / | 1,555 | 1,138 | 68.4% | 1:29 |
| **/UPW/ (duplicate)** | **1,536** | **1,109** | **50.7%** | **3:02** |
| /coaching/ | 705 | 528 | 86.3% | 2:00 |
| /billy-beck-iii/ | 593 | 500 | 94.0% | 0:44 |
| /lifeforcethankyou/ | 544 | 288 | 71.6% | 4:17 |
| /tony/ | 411 | 351 | 78.5% | 1:16 |
| /physical-training/the-gauntlet-burn-fat-fast-workout/ | 349 | 224 | 55.8% | 2:08 |
| /testimonials/ | 251 | 209 | 95.2% | 1:40 |
| /blog/ | 206 | 160 | 79.9% | 0:39 |
| /404.html | 184 | 106 | 62.2% | 1:12 |

### Top landing pages (90d)

| Landing | Sessions | Engagement | Bounce |
|---|---:|---:|---:|
| /upw | 2,916 | 62.9% | 37.1% |
| /30-day-training-challenge-thank-you | 1,989 | 49.9% | 50.1% |
| /UPW (duplicate) | 1,392 | 50.9% | 49.1% |
| **(not set)** | **1,066** | **12.8%** | **87.2%** |
| / | 944 | 60.2% | 39.8% |
| /tony | 357 | 77.3% | 22.7% |
| /physical-training/the-gauntlet-burn-fat-fast-workout | 284 | 51.8% | 48.2% |
| /lifeforcethankyou | 182 | 37.9% | 62.1% |
| /404.html | 121 | 57.0% | 43.0% |
| /coaching | 99 | 37.4% | 62.6% |

### Issues

1. **Case-variant duplication.** `/upw/` + `/UPW/` = 4,832 views; `/tony/` + `/Tony/` = 492 views. These are the same page being indexed and tracked twice because the server isn't normalizing case. Every case-mixed backlink creates a second GA4 row and splits engagement metrics.
2. **Thank-you page outranks everything.** `/30-day-training-challenge-thank-you` has more views (4,151) than the homepage (1,555) and nearly as many as the main UPW landing. People are bookmarking or sharing the thank-you URL directly. That is surprising — possibly because it's used as a gated content delivery page rather than a true post-conversion page. Worth investigating.
3. **Landing = `(not set)` with 87.2% bounce.** 1,066 sessions (~9.6% of total) have no landing page recorded. This is almost always a tagging or single-page-session tracking gap. Check whether the GA4 tag is missing on any entry point, and whether `engaged_session` is firing correctly.
4. **`/404.html` gets 184 views and 121 organic landings.** Someone is pointing at dead URLs. Pair this with GSC's coverage data to hunt the bad backlinks or internal links.

---

## 5. Device & geography

### Device breakdown (90d)

| Device | Sessions | Users | Engagement | Bounce | Avg duration |
|---|---:|---:|---:|---:|---:|
| desktop | 5,947 | 3,240 | 45.2% | 54.8% | 4:14 |
| mobile | 5,161 | 3,544 | 56.6% | 43.4% | 3:05 |
| tablet | 179 | 85 | 50.3% | 49.7% | 18:59 |

Mobile has **more users** (3,544) than desktop (3,240) but fewer sessions — mobile users come once; desktop users come back. Mobile engagement rate is meaningfully better (56.6% vs 45.2%) with a lower bounce (43.4% vs 54.8%), which means the mobile UX is not the problem despite the lower session count. Tablet's 19-min average is an outlier — likely a handful of long idle sessions skewing the mean over a tiny base of 179 sessions.

### Top countries (90d)

| Country | Sessions | Users |
|---|---:|---:|
| United States | 5,154 | 3,070 |
| Canada | 1,116 | 597 |
| United Kingdom | 755 | 446 |
| Australia | 655 | 348 |
| Germany | 415 | 243 |
| China | 395 | 395 |
| Netherlands | 206 | 125 |
| Japan | 201 | 152 |
| New Zealand | 170 | 94 |
| Singapore | 162 | 157 |
| France | 145 | 74 |
| Spain | 130 | 83 |
| Mexico | 119 | 61 |

**China anomaly:** 395 sessions with 395 users — exactly one session per user. That's a bot signature. Suspect scrapers or headless crawlers; consider a GA4 filter or a country-based internal-traffic exclusion to keep the core dashboards clean.

The site clearly gets global traffic despite being an English-first property. The `/de/`, `/es/`, `/fr/`, `/it/`, `/ja/`, `/nl/`, `/pt/`, `/zh/` translations in the sitemap correspond to real demand (Germany, Netherlands, Japan all in the top 10). Worth instrumenting language-specific conversion tracking.

---

## 6. Events — what is firing

| Event | Count (90d) |
|---|---:|
| page_view | 18,262 |
| session_start | 11,359 |
| file_download | **10,833** |
| user_engagement | 9,456 |
| first_visit | 6,806 |
| scroll | 6,035 |
| form_submit | **2,498** |
| form_start | 2,436 |
| click | 234 |
| view_search_results | 32 |

**Insights.**

- **File downloads are the most meaningful business signal on the site** — 10,833 of them in 90 days, roughly one per session. That matches the prominence of `Final-Life-Force-Beg-Plan.pdf` and `Final-Life-Force-Advanced-Plan-Male.pdf` in the GSC page data. Lead magnets are the primary conversion mechanic.
- **Form funnel: 2,436 form_starts → 2,498 form_submits.** The submit count exceeds the start count, which means `form_submit` is firing on forms that never fired `form_start` (probably GA4's automatic form tracking combined with a custom trigger, or a form embed that doesn't emit focus events). Worth reconciling.
- **click event at 234 is suspiciously low.** GA4 Enhanced Measurement's outbound click tracking may be disabled. Given the PDF-heavy, external-link-heavy nature of this site, enabling that should add a lot of signal.
- **No key events marked.** This is the single biggest instrumentation gap. `form_submit` and `file_download` should both be promoted to **key events** in GA4 Admin so they populate the Conversions column.

---

## 7. Data-quality & tracking issues

| # | Finding | Severity | Fix |
|---|---|---|---|
| 1 | 0 key events configured | HIGH | Mark `form_submit` and `file_download` as key events in GA4 Admin → Events → Mark as key event. |
| 2 | `/upw/` and `/UPW/` tracked as separate pages | HIGH | Apply a **Modify event** rule in GA4 Admin that lowercases `page_location`, or fix at the server with a 301 from uppercase → lowercase. |
| 3 | `(not set)` landing page = 1,066 sessions | HIGH | Audit pages missing the GA4 tag, especially thank-you redirects, embedded iframes, and any pages served from a CDN or sub-site. |
| 4 | bb3nextlevel.com counted as referral (likely same business) | MED | Add `bb3nextlevel.com` to **Unwanted referrals** in the data stream settings so cross-domain sessions don't reset. |
| 5 | Facebook split across 5 sub-domains | MED | Create a custom channel group that unions `*.facebook.com` + `ig` + `instagram.com` under "Social - Meta". |
| 6 | Direct at 60% is implausibly high | MED | Most "Direct" is probably untagged email, SMS, or dark social. Start tagging every outbound link (email CTAs, bb3nextlevel.com outbound, social bio links) with UTMs. |
| 7 | China traffic: 395 sessions = 395 users | LOW | Add a country-based filter or just exclude from reporting views. |
| 8 | `form_submit` > `form_start` | LOW | Reconcile form trigger setup — probably one embed not firing `form_start`. |
| 9 | `click` event = 234 in 90d | LOW | Verify Enhanced Measurement → Outbound clicks is ON for the web stream. |
| 10 | Traffic concentrated on one referrer | STRATEGIC | Diversify acquisition (see §8). |

---

## 8. Prioritized recommendations

### This week (tracking hygiene — blocks everything else)

1. Mark **form_submit** and **file_download** as key events. Every report downstream depends on this.
2. Add **bb3nextlevel.com** to unwanted referrals so it stops starting new sessions.
3. Turn on Enhanced Measurement → **Outbound clicks** and **Site search**.
4. Fix the case-variant URL duplication with either a server 301 or a GA4 Modify Event rule lowercasing `page_location`.
5. Find what is causing **1,066 `(not set)` landing pages** — run a URL crawl and verify the GA4 tag fires on every entry point.

### Next 30 days

6. Stand up **UTM discipline** — every email link, every `bb3nextlevel.com` CTA, every social bio link gets tagged. Expect the "Direct" share to drop from 60% → 30-40% as the real channels surface.
7. Define a **conversion funnel** in GA4 Explorations: homepage / landing → form_start → form_submit → thank-you. You'll see where drop-off is.
8. Investigate why `/30-day-training-challenge-thank-you/` gets 4,151 views. If it's a gated resource, good — measure it. If it's broken (people landing there without converting), fix the redirect.
9. Build a **Looker Studio dashboard** tied to this GA4 property for weekly monitoring — key events, top channels, top landings, 7-day trend. Eliminates ad-hoc querying.

### Structural (quarter)

10. **Reduce dependence on bb3nextlevel.com.** Even if it's a friendly cross-property, a 25%-share single referrer is fragile. Organic search has the best engagement rate (63%) and is the most logical place to invest — see `reports/gsc-audit.md` for the playbook.
11. **Language-specific conversion tracking.** The site has 8 translations and real traffic from DE, JP, NL, ES, FR. Set up a custom dimension on `language` so the team can see whether non-English traffic converts differently.
12. **Paid search and email are invisible** in the channel report. Either they don't exist or they're being misattributed — decide which and fix the gap.

---

## 9. Raw data locations

- 90-day overview: `/tmp/audit/ga4_overview_90.json`
- Top pages: `/tmp/audit/ga4_pages_90.json`
- Channel groups: `/tmp/audit/ga4_channels_90.json`
- Source / medium: `/tmp/audit/ga4_sources_90.json`
- Device: `/tmp/audit/ga4_devices_90.json`
- Country: `/tmp/audit/ga4_countries_90.json`
- Event counts: `/tmp/audit/ga4_events_90.json`
- Landing pages: `/tmp/audit/ga4_landing_90.json`
- 28-day compare: `/tmp/audit/ga4_compare_28.json`

Windows path root: `C:\Users\ASUS\AppData\Local\Temp\audit\`
