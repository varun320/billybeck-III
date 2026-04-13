# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
Answer In a very concise way compromise grammar for the shake of it.

## Project Purpose
This is a **WordPress UI-as-code workspace for the billybeck site**. The goal is to manage the site's UI (Elementor layouts, Global Kit, child theme CSS) as version-controlled files that are synced to a WordPress instance via MCP, without touching WordPress core, plugin internals, or wp-admin directly.

The authoritative spec for how this project is meant to operate is `wordpress-elementor-mcp-setup.md` in the repo root — read it before doing any setup, MCP configuration, or push/pull work. `billybeck_site_audit.pdf` is the SEO/technical audit that motivates the UI changes.

## Current State

The repo is in **pre-scaffolding phase**:

- Only the setup guide and audit PDF exist.
- No `.mcp.json`, `.env`, `layouts/`, `kit/`, or `child-theme/` directories have been created yet.
- No WordPress staging site has been spun up, and no Application Password has been generated.
- There is no `package.json`, no build system, no git repo initialized.

When the user asks to "start", "scaffold", "set up", or "bootstrap" — follow the phases in `wordpress-elementor-mcp-setup.md` (sections 2–7), in order. Don't skip to pushing layouts before an MCP connection has been verified with `/mcp`.

## Architecture (from the setup guide)

```
Local repo  ──►  Claude Code  ──►  MCP servers  ──►  WP REST API  ──►  WP DB
(UI as code)                       (WordPress)       (App Password auth)
```

Four editing paths, each with a different blast radius — match the change to the right path:

| Change | Path | File location |
|---|---|---|
| Per-page layout (hero, sections, widgets) | Elementor `_elementor_data` postmeta via MCP | `layouts/<page>.json` |
| Site-wide tokens (brand colors, typography, spacing) | Elementor Global Kit via MCP | `kit/global-kit.json` |
| Pixel-level CSS and template overrides | Child theme (deployed via SFTP/git) | `child-theme/` |
| Quick CSS tweaks | Customizer Additional CSS via MCP | `child-theme/additional.css` |

**Never edit**: WordPress core, plugin PHP, parent theme files, or anything through wp-admin UI when a code path exists.

## Core Workflow: Pull → Edit → Push

1. **Pull** current WP state into the repo (e.g. "save page 12's `_elementor_data` to `layouts/home.json`") and commit the snapshot *before* editing.
2. **Edit** the JSON/CSS locally (via conversation with Claude or direct file edit).
3. **Push** back to WP via MCP; regenerate Elementor CSS/data cache after.
4. **Diff** with `git diff HEAD~1 layouts/<page>.json` before promoting to production.

Always commit the snapshot before the edit so a bad push can be reverted from the last commit.

## Safety Rules (project-specific, non-negotiable)

These override any generic "just do it" instinct:

1. **Staging first.** Never point MCP at production until the full pull→edit→push loop works on LocalWP. Production MCP config lives in a separate `.mcp.prod.json` or env-var swap.
2. **Separate Application Passwords per environment.** Staging and prod must have different tokens. Revoke on leak.
3. **Never commit secrets.** `.env` and any `.mcp.json` containing inline credentials must be gitignored. Commit a `.mcp.json.example` template instead.
4. **JSON push succeeds but page goes blank** = malformed `_elementor_data`. Restore from the last git commit immediately, don't try to patch forward.
5. **Elementor caches aggressively.** After any push, either call the regenerate-CSS tool or instruct the user to clear cache / use incognito before declaring success.
6. **Don't bypass the REST API.** If an MCP exposes direct file/SSH access, that's the door to accidental WP-core edits — scope carefully or avoid.

## Commands

No build, test, or lint commands exist yet — nothing to run. Once scaffolding begins, the relevant entry points will be:

- `claude` from the project root (picks up `.mcp.json`) — starts a session with the WP MCP wired in.
- `/mcp` inside the session — verifies the `wordpress` server is connected.
- `curl <WP_SITE_URL>/wp-json/` — sanity-check that the WP REST API is reachable before debugging MCP auth.

## When Picking an MCP Package

Section 4 of the setup guide is deliberately vendor-agnostic because the MCP ecosystem changes fast. Before installing a WordPress or Elementor MCP package:

1. Search current options (`npm search wordpress-mcp`, GitHub topic `mcp-server` + `wordpress`).
2. Check README, last commit date, and issue activity — confirm it's maintained.
3. Confirm it exposes the tools needed: post/page CRUD, postmeta read/write (for `_elementor_data`), media upload, option read/write.
4. Only then wire it into `.mcp.json`.

Don't assume a package name from memory — the landscape shifts, and a stale recommendation will waste a setup cycle.
