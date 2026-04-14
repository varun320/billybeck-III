# MCP Setup Guide — WordPress, Elementor, GA4, GSC

**Context:** This guide is derived from the actual configuration used to audit `billybeck.com` (WordPress + Elementor site, GA4 property `394194095`, GSC domain property `sc-domain:billybeck.com`). Every step below was executed against a real site; the pitfalls are the ones we hit and recovered from.

**Audience:** Claude Code / Cursor / VSCode users on Windows who want the same four MCPs wired up in a new project.

**Host assumption:** Windows 11 with bash (Git Bash) + PowerShell available, Python 3.12+, Node.js 20+, `uv` installed. Adjustments for macOS/Linux noted inline.

---

## 0. Project layout you should end up with

```
<project-root>/
├── .mcp.json              ← committed, uses ${VARS}
├── .mcp.json.example      ← committed, template
├── .env                   ← gitignored, real secrets
├── .env.example           ← committed, template
└── .gitignore             ← must include .env and .vscode/
```

`.gitignore` essentials:

```
.env
.env.*
!.env.example
.vscode/mcp.json
!.vscode/mcp.json.example
```

**Never commit:** `.env`, service-account JSON keys, JWT tokens, Application Passwords, or any `.mcp.json` that has credentials inlined.

---

## 1. WordPress MCP (wpmcp plugin, HTTP + JWT)

Use this to read/write WordPress posts, pages, media, categories, users, and general settings over the REST API. Covers broad CMS operations but **does not** handle Elementor's `_elementor_data` reliably — see §2 for that.

### 1.1 Prerequisites on the WordPress side

1. A staging WordPress site (do not point this at production until the pull→edit→push loop is proven). In the billybeck case: **WP Farm managed hosting** at a subdomain like `https://1.josh.wpfarmpowered.com/<subsite>`.
2. Install and activate the **`wpmcp`** plugin on the site (it exposes `/wp-json/wp/v2/wpmcp/streamable`).
3. In `wp-admin → wpmcp plugin settings`, generate a JWT for a user with `edit_posts` capability. Tokens default to **~30-day expiry** — put a calendar reminder for rotation.
4. Confirm the REST API is reachable from your machine:
   ```bash
   curl -I https://<host>/<subsite>/wp-json/
   # expect 200 OK
   ```

### 1.2 `.env` entries

```env
# Full streamable endpoint — NOT the base site URL.
WP_MCP_URL=https://1.josh.wpfarmpowered.com/billybeck/wp-json/wp/v2/wpmcp/streamable
WP_MCP_JWT=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.<rest_of_token>
```

### 1.3 `.mcp.json` entry

```json
{
  "mcpServers": {
    "wordpress": {
      "type": "http",
      "url": "${WP_MCP_URL}",
      "headers": {
        "Authorization": "Bearer ${WP_MCP_JWT}"
      }
    }
  }
}
```

### 1.4 Verify

```text
claude                    # start a session in the project root
/mcp                      # should list "wordpress" as connected
```

Then try a read-only tool:

```text
Use mcp__wordpress__wp_get_general_settings to return the site URL and title.
```

If that returns JSON with your site's title, the MCP is wired up.

### 1.5 Pitfalls we hit

| Symptom | Root cause | Fix |
|---|---|---|
| `SDK auth failed: HTTP 404: Invalid OAuth error response` with HTML body | You gave the **base** URL, not the `/wp-json/wp/v2/wpmcp/streamable` path. Claude Code does **not** auto-append it. | Use the full streamable endpoint URL. Never the base URL. |
| Silent 401 on every tool call | JWT expired (check the `exp` claim). | Regenerate in wpmcp plugin settings, update `.env`, restart Claude Code. |
| Tool calls succeed in editor but frontend page stays blank | You wrote `_elementor_data` via REST meta — see §2.5 and §6. | Regenerate Elementor CSS & Data in wp-admin after every push. |

---

## 2. Elementor MCP (elementor-mcp via npx + Application Password)

Use this when you need to round-trip Elementor page layouts as JSON (pull current state → edit locally → push back). It speaks WP REST + a dedicated Elementor endpoint, and it authenticates with a **WordPress Application Password**, not a JWT.

### 2.1 Prerequisites

1. WordPress 5.6+ (Application Passwords ship in core).
2. Elementor plugin (free or Pro) active.
3. A WP user with `edit_posts` capability (typically admin).
4. Node.js 20+ on your machine (`node -v`).

### 2.2 Generate an Application Password

1. Log in to `wp-admin` on the staging site.
2. Go to **Users → Profile** for the target user.
3. Scroll to **Application Passwords**, enter a name like `billybeck-elementor-mcp`, click **Add New Application Password**.
4. Copy the password **immediately** — it's shown once. Keep the spaces as given (`xxxx xxxx xxxx`) or strip them; the MCP accepts both.

### 2.3 `.env` entries

```env
# Base site URL — no trailing slash, no /wp-json path.
WP_ELEMENTOR_URL=https://1.josh.wpfarmpowered.com/billybeck
WP_ELEMENTOR_USER=mohammed@firstmovers.ai
WP_ELEMENTOR_APP_PASSWORD=21qZ 2ELw L664 r*iu ny5K Z1Yw
```

### 2.4 `.mcp.json` entry (Windows)

```json
"billybeck-elementor": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "elementor-mcp"],
  "env": {
    "WP_URL": "${WP_ELEMENTOR_URL}",
    "WP_APP_USER": "${WP_ELEMENTOR_USER}",
    "WP_APP_PASSWORD": "${WP_ELEMENTOR_APP_PASSWORD}"
  }
}
```

**macOS/Linux:** drop `cmd /c` — use `"command": "npx", "args": ["-y", "elementor-mcp"]`.

### 2.5 Verify

After a Claude Code restart, `/mcp` should list `billybeck-elementor` as connected. Exercise it with:

```text
Use mcp__billybeck-elementor__get_page_id_by_slug with slug "home".
Then mcp__billybeck-elementor__download_page_to_file to save it locally.
```

### 2.6 Pitfalls we hit

| Symptom | Root cause | Fix |
|---|---|---|
| `mcpServers.billybeck-elementor: Windows requires 'cmd /c' wrapper to execute npx` — server never boots | Claude Code's MCP loader on Windows can't resolve `npx.cmd` (it's a shell wrapper, not a PE binary). | Wrap with `cmd /c` in `args`. `uvx` entries don't need this — uv installs native `.exe` shims. |
| Editor shows updated layout, frontend preview serves old HTML | Writing `_elementor_data` via REST meta **bypasses Elementor's save hooks** — `_elementor_css` stays stale. | After every push: open `wp-admin/post.php?post={id}&action=elementor` and click Update, OR null out `_elementor_css` postmeta to force regen, OR go to Elementor → Tools → Regenerate CSS & Data. |
| Frontend renders only the first 1–2 widgets, then truncates | You used Elementor's `html` widget with `<script>`, `<style>`, or SVG data URLs. REST meta writes bypass the KSES sanitizer. | **Never** use `html` widgets in layouts pushed via REST. Use stock widgets (heading, icon-list, button, image). Put custom CSS in child-theme `additional.css` or Page Settings → Custom CSS (Pro). |
| 401 on every call | Application Password is for a different user than `WP_APP_USER`, or was revoked. | Regenerate under the same WP user's profile; confirm user has `edit_posts`. |

### 2.7 Safety workflow for Elementor pushes

Always:

1. **Pull first:** `download_page_to_file` → commit the snapshot locally before editing. This is your rollback point.
2. **Edit the JSON file.**
3. **Push:** `update_page_from_file`.
4. **Regenerate:** trigger one of the three cache-clear paths in §2.6 before declaring the push done.
5. **Verify:** hard-refresh the public URL in an incognito window.

---

## 3. GA4 MCP (analytics-mcp via uvx + service account)

Run GA4 Data API queries (`run_report`, `run_realtime_report`, `get_account_summaries`, etc.) through the official `google-analytics-mcp` server. We use a **service account** because Workspace OAuth on `firstmovers.ai` blocked the sensitive analytics scopes.

### 3.1 Prerequisites

1. A Google Cloud project. In billybeck's case: `billybeck-analytics` under the `firstmovers.ai` org.
2. Enable these APIs on the project:
   - `analyticsdata.googleapis.com`
   - `analyticsadmin.googleapis.com`
3. `uv` installed (Windows: `winget install astral-sh.uv`; macOS: `brew install uv`; Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`).
4. Access to the GA4 property you want to query.

### 3.2 Create the service account

```bash
gcloud config set project billybeck-analytics
gcloud iam service-accounts create billybeck-mcp \
  --display-name="Billy Beck MCP Service Account"

# Create a JSON key and save it outside the repo.
mkdir -p ~/.gcp-keys
gcloud iam service-accounts keys create ~/.gcp-keys/billybeck-analytics-sa.json \
  --iam-account=billybeck-mcp@billybeck-analytics.iam.gserviceaccount.com
```

On Windows (PowerShell), `~/.gcp-keys` resolves to `C:\Users\<you>\.gcp-keys`.

### 3.3 Grant the SA access in GA4

The GCP project only holds the credential — access to GA4 data is granted in GA4 itself.

1. Go to https://analytics.google.com → Admin → **Property access management** (for the property, not the account).
2. Add user: `billybeck-mcp@billybeck-analytics.iam.gserviceaccount.com`
3. Role: **Viewer** (sufficient for all read queries).
4. Uncheck "Notify new users by email" (SAs don't have inboxes).

### 3.4 `.env` entries

```env
# Absolute path to the SA key JSON. Forward slashes on Windows are fine.
GOOGLE_APPLICATION_CREDENTIALS=C:/Users/ASUS/.gcp-keys/billybeck-analytics-sa.json
GOOGLE_PROJECT_ID=billybeck-analytics
```

### 3.5 `.mcp.json` entry

```json
"ga4": {
  "command": "uvx",
  "args": ["analytics-mcp"],
  "env": {
    "GOOGLE_APPLICATION_CREDENTIALS": "${GOOGLE_APPLICATION_CREDENTIALS}",
    "GOOGLE_PROJECT_ID": "${GOOGLE_PROJECT_ID}"
  }
}
```

`uvx analytics-mcp` auto-installs the package on first run — no manual `uv pip install` step needed. `uvx` works on Windows without `cmd /c` because uv ships a native `.exe`.

### 3.6 Verify

After restarting Claude Code, probe the server directly from bash to confirm tools and credentials:

```bash
# List available tools
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"probe","version":"0.1"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | uvx analytics-mcp 2>/dev/null
```

Expect a JSON response listing tools: `get_account_summaries`, `run_report`, `run_realtime_report`, `get_property_details`, `get_custom_dimensions_and_metrics`, etc. Then from Claude Code:

```text
Use mcp__ga4__get_account_summaries to list accessible GA4 properties.
```

You should see your property ID (e.g. `properties/394194095`). Save this — you'll pass it to every other GA4 tool call.

### 3.7 Pitfalls we hit

| Symptom | Root cause | Fix |
|---|---|---|
| `403 User does not have sufficient permissions for this property` | SA not added to GA4 Property access management (adding it to the GCP project alone is not enough). | Add the SA email to GA4 → Property access management with Viewer role. |
| Intermittent 403s when running many queries in parallel | GA4 Data API quota hits concurrent-request limits. | Run queries sequentially with a 2–3s pause, or use async batching. |
| `CREDENTIALS_MISSING` when testing with `gcloud auth print-access-token` + ADC impersonation | ADC token lacks GA4 scopes — you need the sensitive `analytics.readonly` scope, which Workspace admins often block. | Skip ADC. Use a service account JSON key directly (`GOOGLE_APPLICATION_CREDENTIALS`). |
| Workspace org says "This app is blocked" during OAuth | Google's built-in gcloud OAuth client is blocked by Workspace admin for sensitive scopes. | Service-account path bypasses OAuth entirely — use it. |

---

## 4. GSC MCP (mcp-search-console via uvx + same service account)

Run Search Console API queries (top queries, pages, devices, countries, sitemaps, URL inspection) through `mcp-search-console`. The **same** service account used for GA4 works here — just grant it GSC access separately.

### 4.1 Prerequisites

1. Same GCP project as GA4, with this API also enabled:
   - `searchconsole.googleapis.com`
2. A verified GSC property (URL-prefix or domain property). Domain property (`sc-domain:example.com`) is strongly preferred because it covers `http://`, `https://`, `www.` and non-`www.` in one shot.
3. Same SA key file as GA4 (`~/.gcp-keys/billybeck-analytics-sa.json`).

### 4.2 Grant the SA access in GSC

GSC access lives inside GSC, not GCP.

1. https://search.google.com/search-console → select the property.
2. **Settings → Users and permissions → Add user**.
3. Email: `billybeck-mcp@billybeck-analytics.iam.gserviceaccount.com`
4. Permission: **Full** (SA needs `siteFullUser` to use the search-analytics endpoint).

### 4.3 `.env` entries

```env
# Same SA key file — point to it again (the GSC MCP reads a different env var).
GSC_CREDENTIALS_PATH=C:/Users/ASUS/.gcp-keys/billybeck-analytics-sa.json
```

### 4.4 `.mcp.json` entry

```json
"gsc": {
  "command": "uvx",
  "args": ["mcp-search-console"],
  "env": {
    "GSC_CREDENTIALS_PATH": "${GSC_CREDENTIALS_PATH}",
    "GSC_SKIP_OAUTH": "true"
  }
}
```

`GSC_SKIP_OAUTH=true` tells the server to load a service-account key file instead of going through the browser OAuth flow.

### 4.5 Verify

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"probe","version":"0.1"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | uvx mcp-search-console 2>/dev/null
```

You should see tools like `list_properties`, `get_performance_overview`, `get_search_analytics`, `get_advanced_search_analytics`, `get_sitemaps`, `inspect_url_enhanced`, `compare_search_periods`.

Then from Claude Code:

```text
Use mcp__gsc__list_properties to confirm the SA can see sc-domain:billybeck.com.
```

### 4.6 Pitfalls we hit

| Symptom | Root cause | Fix |
|---|---|---|
| `HttpError 403: User does not have sufficient permission for site 'sc-domain:...'` | SA not added as user in GSC Settings → Users and permissions. | Add the SA email with **Full** permission (not Restricted). |
| Intermittent 403s on some calls when run in parallel | Search Console API concurrency quota. | Run queries sequentially with a 2–3s pause, or use `compare_search_periods`/`get_advanced_search_analytics` which batch internally. |
| Browser OAuth flow opens when you don't want it to | `GSC_SKIP_OAUTH` is unset or false. | Set `GSC_SKIP_OAUTH=true` in the MCP env. |
| SA can see the domain property but not a URL-prefix property | Domain properties in GSC cover all hosts/protocols; URL-prefix properties are narrower and require separate user grants. | Prefer domain property. If URL-prefix is all you have, add the SA as user on each URL-prefix property you need. |

---

## 5. End-to-end checklist (once all four are wired)

```text
claude                              # in project root (picks up .mcp.json + .env)
/mcp                                # all four should show Connected
```

Smoke-test each:

```text
# WordPress
mcp__wordpress__wp_get_general_settings

# Elementor
mcp__billybeck-elementor__get_page_id_by_slug  (slug: "home")

# GA4
mcp__ga4__get_account_summaries

# GSC
mcp__gsc__list_properties
```

If any single one fails, fix that one before touching the others. Failures cascade in confusing ways (e.g. a stale JWT on wordpress will make you doubt the GA4 credentials if you debug everything at once).

---

## 6. Cross-cutting gotchas

### 6.1 Windows path handling

- In `.env`, **forward slashes** are fine in paths (`C:/Users/ASUS/.gcp-keys/...`). MCP servers normalize them.
- In bash, paths like `/tmp/...` resolve via Git Bash's Msys mount to `C:\Users\<you>\AppData\Local\Temp\...`. Python running in a Windows `python.exe` sees the Windows path; when you redirect bash output to `/tmp/...` and then read it from Python, use `cygpath -w /tmp/...` to convert, or just use an absolute Windows path from the start.

### 6.2 Windows npx wrapper

Every stdio MCP whose `command` is `npx` needs `cmd /c` on Windows. `uvx` entries don't. Mixing these correctly matters — Claude Code will refuse to boot the server otherwise. See §2.4.

### 6.3 Elementor cache after REST push

Every time you write `_elementor_data` through either the `wordpress` MCP (`wp_update_page` meta) or the `elementor` MCP's `update_page_from_file`, the frontend render cache does not auto-invalidate. The editor reads the JSON live and looks correct, but the public URL serves stale HTML.

**Always** regenerate afterward via one of:

1. `wp-admin/post.php?post={id}&action=elementor` → click Update
2. Null out the `_elementor_css` postmeta via a follow-up `wp_update_page` call
3. Elementor → Tools → Regenerate CSS & Data (nuclear option, site-wide)

### 6.4 Never use Elementor HTML widgets in REST-pushed layouts

The HTML widget's `<script>`, `<style>`, or SVG data URLs pass through unsanitized when you push via REST meta, and Elementor's PHP renderer silently truncates the whole page the first time it can't parse one. Use stock widgets for everything; put real custom CSS in the child theme.

### 6.5 Stage before prod

`CLAUDE.md` safety rule #1 for billybeck: never point `wordpress` or `billybeck-elementor` at production until the full pull→edit→push loop works on staging. Keep a separate `.mcp.prod.json` (or swap `.env` on the fly) and require an explicit action to switch — don't leave prod creds in ambient env.

### 6.6 Secrets rotation cadence

| Credential | Lifetime | Rotation trigger |
|---|---|---|
| wpmcp JWT | ~30 days (per `exp` claim) | Monthly calendar reminder; rotate before the day it expires. |
| WordPress Application Password | Until manually revoked | After every team-member offboarding; any suspected leak. |
| GCP SA key | Until manually deleted | Quarterly, or immediately on suspicion of leak. Delete old keys after creating the new one. |

To rotate an SA key:

```bash
# Create new
gcloud iam service-accounts keys create ~/.gcp-keys/billybeck-analytics-sa-new.json \
  --iam-account=billybeck-mcp@billybeck-analytics.iam.gserviceaccount.com

# Update .env to point to the new file, restart Claude Code, verify.

# Then delete the old one (find KEY_ID first):
gcloud iam service-accounts keys list \
  --iam-account=billybeck-mcp@billybeck-analytics.iam.gserviceaccount.com
gcloud iam service-accounts keys delete <OLD_KEY_ID> \
  --iam-account=billybeck-mcp@billybeck-analytics.iam.gserviceaccount.com
```

---

## 7. Reference `.mcp.json.example` (all four together)

```json
{
  "mcpServers": {
    "ga4": {
      "command": "uvx",
      "args": ["analytics-mcp"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "${GOOGLE_APPLICATION_CREDENTIALS}",
        "GOOGLE_PROJECT_ID": "${GOOGLE_PROJECT_ID}"
      }
    },
    "gsc": {
      "command": "uvx",
      "args": ["mcp-search-console"],
      "env": {
        "GSC_CREDENTIALS_PATH": "${GSC_CREDENTIALS_PATH}",
        "GSC_SKIP_OAUTH": "true"
      }
    },
    "wordpress": {
      "type": "http",
      "url": "${WP_MCP_URL}",
      "headers": {
        "Authorization": "Bearer ${WP_MCP_JWT}"
      }
    },
    "billybeck-elementor": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "elementor-mcp"],
      "env": {
        "WP_URL": "${WP_ELEMENTOR_URL}",
        "WP_APP_USER": "${WP_ELEMENTOR_USER}",
        "WP_APP_PASSWORD": "${WP_ELEMENTOR_APP_PASSWORD}"
      }
    }
  }
}
```

## 8. Reference `.env.example`

```env
# ---- GA4 MCP ----
GOOGLE_APPLICATION_CREDENTIALS=C:/Users/you/.gcp-keys/analytics-sa.json
GOOGLE_PROJECT_ID=my-gcp-project

# ---- GSC MCP ----
GSC_CREDENTIALS_PATH=C:/Users/you/.gcp-keys/analytics-sa.json

# ---- WordPress (wpmcp plugin) ----
WP_MCP_URL=https://<host>/<subsite>/wp-json/wp/v2/wpmcp/streamable
WP_MCP_JWT=<jwt_from_wpmcp_plugin_settings>

# ---- Elementor (elementor-mcp via npx) ----
WP_ELEMENTOR_URL=https://<host>/<subsite>
WP_ELEMENTOR_USER=<wp_user_email_or_login>
WP_ELEMENTOR_APP_PASSWORD=<Application Password from wp-admin>
```

---

## 9. Where things live (billybeck reference values)

| Thing | Value |
|---|---|
| WP staging host | `https://1.josh.wpfarmpowered.com/billybeck` |
| WP MCP endpoint | `https://1.josh.wpfarmpowered.com/billybeck/wp-json/wp/v2/wpmcp/streamable` |
| WP MCP plugin | `wpmcp` (installed on the staging site) |
| Elementor WP user | `mohammed@firstmovers.ai` |
| GCP project | `billybeck-analytics` (under `firstmovers.ai` org, id `964766204627`) |
| Service account | `billybeck-mcp@billybeck-analytics.iam.gserviceaccount.com` |
| SA key (local) | `C:\Users\ASUS\.gcp-keys\billybeck-analytics-sa.json` |
| GA4 account | `accounts/3768290` (`www.billybeck.com`) |
| GA4 property | `properties/394194095` (tz `America/New_York`) |
| GSC property | `sc-domain:billybeck.com` (SA granted `siteFullUser`) |
| Enabled GCP APIs | `analyticsdata`, `analyticsadmin`, `searchconsole` |

These are the live values this guide was validated against. Swap them for your own when you reuse the pattern.
