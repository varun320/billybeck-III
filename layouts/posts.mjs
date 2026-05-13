#!/usr/bin/env node
// WP posts/categories deploy helper for billybeck — same MCP transport as deploy.mjs.
//
// Usage:
//   node posts.mjs cats                              — list categories
//   node posts.mjs add-cats                          — create the Legion category set (idempotent)
//   node posts.mjs list                              — list posts
//   node posts.mjs seed                              — create the 7 Legion posts (idempotent by slug)
//   node posts.mjs delete <postId>                   — delete a post (use only on leftover seeds)
//   node posts.mjs reseed                            — delete by known slugs then seed (rare; destructive on those slugs)
//   node posts.mjs style <postId>                    — bake the styled Elementor layout into one post
//   node posts.mjs style-all                         — apply styling to every published post in the seed set
//
// .env: same WP_MCP_URL + WP_MCP_JWT as deploy.mjs.

import { readFileSync, existsSync } from 'node:fs';
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
if (!mcpUrl || !jwt) { console.error('Missing WP_MCP_URL or WP_MCP_JWT'); process.exit(2); }

let nextId = 1, sessionId = null;
async function rpc(method, params, retry = 3) {
  const id = nextId++;
  const body = { jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) };
  const headers = { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  let res, text;
  for (let attempt = 1; attempt <= retry; attempt++) {
    try {
      res = await fetch(mcpUrl, { method: 'POST', headers, body: JSON.stringify(body) });
      const sid = res.headers.get('mcp-session-id'); if (sid && !sessionId) sessionId = sid;
      text = await res.text();
      if (res.ok) break;
      if ([500, 502, 503, 504, 520, 521, 522, 523, 524, 525].includes(res.status) && attempt < retry) { await new Promise(r => setTimeout(r, 2000 * attempt)); continue; }
      throw new Error(`HTTP ${res.status}\n${text.slice(0, 400)}`);
    } catch (e) { if (attempt < retry && /fetch failed|ECONNRESET|ETIMEDOUT/i.test(e.message)) { await new Promise(r => setTimeout(r, 2000 * attempt)); continue; } throw e; }
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  let data;
  if ((res.headers.get('content-type') || '').includes('text/event-stream')) {
    for (const block of text.split(/\r?\n\r?\n/)) {
      const dl = block.split(/\r?\n/).filter(l => l.startsWith('data:')).map(l => l.slice(5).trim());
      if (!dl.length) continue;
      try { const p = JSON.parse(dl.join('\n')); if (p.id === id) { data = p; break; } } catch {}
    }
    if (!data) throw new Error(`No SSE response matched id=${id}`);
  } else data = JSON.parse(text);
  if (data.error) throw new Error(`RPC ${data.error.code}: ${data.error.message}`);
  return data.result;
}
async function init() {
  await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'billybeck-posts', version: '1.0' } });
  await fetch(mcpUrl, { method: 'POST', headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }).catch(() => {});
}
async function callTool(name, args) {
  const out = await rpc('tools/call', { name, arguments: args });
  if (out.isError) throw new Error(`Tool ${name} failed: ${(out.content || []).map(c => c.text).join('\n')}`);
  const txt = (out.content || []).map(c => c.text || '').join('\n');
  try { return JSON.parse(txt); } catch { return txt; }
}

const CATEGORIES = [
  { slug: 'self-mastery', name: 'Self-Mastery', description: 'The source. Awareness, command, and the refusal of limitation.' },
  { slug: 'training',     name: 'Training',     description: 'Resistance, conditioning, structural balance — the stimulus for change.' },
  { slug: 'nutrition',    name: 'Nutrition',    description: 'Effective eating. Principles, not fear.' },
  { slug: 'mindset',      name: 'Mindset',      description: 'Thoughts, beliefs, and the identity that sustains the work.' },
  { slug: 'recovery',     name: 'Recovery',     description: 'Sleep, hydration, regeneration. Where adaptation happens.' },
  { slug: 'leadership',   name: 'Leadership',   description: 'Strength in service. Heart-driven leadership.' },
];

const POSTS = [
  {
    slug: 'call-forth-the-lion-within',
    title: 'Call Forth the Lion Within',
    categories: ['self-mastery'],
    excerpt: 'This is not a fitness brand. It is a self-mastery movement that uses the body as the proving ground for identity, discipline, service, and freedom.',
    content: `<p><strong>Legion of Lions is not another fitness program.</strong> It is a self-mastery movement that uses the body as the proving ground for identity, discipline, service, and freedom.</p>
<p>The body transformation is real. It just is not the source of the work. It is the evidence.</p>
<h2>The Messaging Spine</h2>
<p>The body is the proving ground. Self mastery is the source. Transformation is the proof.</p>
<p>We help people refuse limitation, master their thoughts, emotions, and actions, and transform their body as proof that a stronger, freer, more purpose-driven life is possible.</p>
<h2>What Most Fitness Marketing Misses</h2>
<p>Most programs sell people a smaller waist. We invite them into a higher identity.</p>
<p>You are not your body, but you have been blessed with a body. Taking care of it is a responsibility and an honor. Training and nutrition are not acts of self-rejection. They are acts of care.</p>
<h2>The Real Outcome</h2>
<p>The real outcome is a person who keeps their word, trusts the process, lives from a higher purpose, and knows how to create change.</p>
<p>Not the lamb. The lion.</p>`,
  },
  {
    slug: 'the-three-pillars-of-power',
    title: 'The Three Pillars of Power',
    categories: ['training'],
    excerpt: 'The body transformation formula is not complicated, but it must be complete. If one pillar is missing, results are limited at best.',
    content: `<p>The body responds to inputs. Cause and effect. When the inputs change, the outputs change.</p>
<p>But the inputs are three, not one. Most people pick one — usually training — and wonder why the body refuses to follow. The formula is simple. It just must be complete.</p>
<h2>1. Physical Training</h2>
<p>Resistance training, cardiovascular conditioning, mobility, and structural balance create the stimulus for the body to change. Without stimulus, there is nothing to adapt to.</p>
<h2>2. Effective Eating</h2>
<p>Nutrients, hydration, protein, fiber, healthy fats, calories, and food quality provide the raw materials for repair, regeneration, energy, and performance. The gym is where you ask the body to change. The kitchen is where you give it what it needs to do so.</p>
<h2>3. Mental Conditioning</h2>
<p>Awareness and command of thoughts, emotions, and identity allow a person to follow through long enough for transformation to become inevitable.</p>
<p>This is the pillar most lifters skip. Most people fail not because the plan is impossible, but because the mind has not been conditioned to love and sustain the process.</p>
<p>Train all three. Or stop being surprised when nothing changes.</p>`,
  },
  {
    slug: 'effective-eating-is-not-a-diet',
    title: 'Effective Eating Is Not a Diet',
    categories: ['nutrition'],
    excerpt: 'Sustainable nutrition is principles, not punishment. Enough protein. Real food. Hydration. Calories that match the work. Stop demonizing food.',
    content: `<p>Diets fail because they are designed to. Restriction creates rebellion, rebellion creates failure, failure creates shame, and shame sells the next diet.</p>
<p>Effective eating is different. It is principles, not punishment.</p>
<h2>The Principles</h2>
<ul>
<li><strong>Enough protein.</strong> Repair and satiety both depend on it.</li>
<li><strong>Nutrient-rich foods.</strong> Real food. Recognizable food. Most of the time.</li>
<li><strong>Hydration.</strong> Most people are running on a deficit and calling it normal.</li>
<li><strong>Fiber.</strong> Digestion, satiety, blood sugar.</li>
<li><strong>Healthy fats.</strong> Hormones depend on them.</li>
<li><strong>Adequate calories.</strong> Under-eating is not the path. It is the trap.</li>
</ul>
<h2>What We Do Not Do</h2>
<p>We do not demonize foods. We teach function.</p>
<p>We do not chase shortcuts. We install standards.</p>
<p>We do not rely on motivation or fear. We build a North Star strong enough to pull you forward.</p>
<p>The body is sacred stewardship. Feed it accordingly.</p>`,
  },
  {
    slug: 'refuse-limitation-lion-law-no-1',
    title: 'Refuse Limitation: Lion Law No. 1',
    categories: ['mindset'],
    excerpt: 'I absolutely and utterly refuse every story of limitation that I use to rationalize and justify being less than I am capable.',
    content: `<p>Read it again, slowly:</p>
<blockquote><p><strong>I absolutely and utterly refuse every story of limitation that I use to rationalize and justify being less than I am capable.</strong></p></blockquote>
<p>That is Lion Law No. 1. It is not a slogan. It is a daily decision.</p>
<h2>The Three Pillars of Creation</h2>
<p>You command exactly three things in your life. They explain how inner reality becomes outer reality.</p>
<ol>
<li><strong>Thoughts and beliefs:</strong> what you think about, focus on, assume, repeat, and accept as true.</li>
<li><strong>Emotional state:</strong> the feeling tone created by those thoughts and beliefs.</li>
<li><strong>Actions and inactions:</strong> what you do, avoid, repeat, and neglect from that emotional state.</li>
</ol>
<p>You stand where you are today because of the cumulative effect of your actions and inactions. Change begins when awareness interrupts the old pattern and a new pattern is installed.</p>
<h2>Stories That Must Go</h2>
<p>I am too old. I am too broken. I have tried before. It is not for me. I do not have the genetics. I do not have the time. I am too far gone.</p>
<p>None of those are facts. They are stories.</p>
<p>Discipline is not punishment. Discipline is structure that creates freedom. The unsexy daily actions — training, eating well, drinking water, sleeping, recovering, practicing awareness, keeping your promises — create massive results over time.</p>
<p>Refuse limitation. Today. And tomorrow. And the next day.</p>`,
  },
  {
    slug: 'the-body-is-sacred-stewardship',
    title: 'The Body Is Sacred Stewardship',
    categories: ['recovery'],
    excerpt: 'Adaptation happens between sessions, not during them. Sleep, hydration, regeneration — the framework I prescribe to clients in their forties, fifties, and sixties.',
    content: `<p>You are not your body, but you have been blessed with a body. Taking care of it is a responsibility and an honor.</p>
<p>Training is the question you ask the body. Recovery is the answer it gives you — but only if you let it speak.</p>
<h2>Adaptation Is Not Negotiable</h2>
<p>The session breaks the tissue down. The recovery is where it rebuilds stronger than before. Skip the second half and you are not training. You are just accumulating damage.</p>
<h2>The Recovery Stack</h2>
<ul>
<li><strong>Sleep.</strong> Seven to nine hours. Non-negotiable. The most underused performance enhancer on earth.</li>
<li><strong>Hydration.</strong> Water before caffeine. Throughout the day, not just at the gym.</li>
<li><strong>Mobility and structural balance.</strong> Five to fifteen minutes daily beats one big session per week.</li>
<li><strong>Nutrient timing.</strong> Protein and carbohydrate in the recovery window matter more after forty than they did at twenty-five.</li>
<li><strong>Stress management.</strong> Cortisol blunts adaptation. Awareness, breath, time outside, time off the phone.</li>
</ul>
<h2>The Question to Ask</h2>
<p>Are you treating your body the way someone who loves their body would treat it? Or are you treating it the way someone trying to punish it for not being something else would treat it?</p>
<p>One of those answers builds a life. The other one builds a wreck.</p>`,
  },
  {
    slug: 'the-lion-and-the-lamb',
    title: 'The Lion and the Lamb',
    categories: ['self-mastery'],
    excerpt: 'Every person has access to two ways of living. The lamb survives by hiding. The lion lives by standing forward.',
    content: `<p>Every person has access to two ways of living.</p>
<p><strong>The lamb</strong> represents fear-driven survival: hiding in the flock, avoiding risk, seeking safety, outsourcing identity, and letting limitation decide what is possible.</p>
<p><strong>The lion</strong> represents the higher self: truth, love, courage, presence, strength, service, command, and the refusal to be defined by fear.</p>
<h2>This Is Not About Aggression</h2>
<p>The lion is not a savage. The lion is a heart-driven leader. Strength without compassion becomes domination. Compassion without strength becomes fear and helplessness. The standard is both — strong enough to lead, compassionate enough to serve.</p>
<h2>The North Star</h2>
<p>The North Star is the higher purpose that pulls you forward. It is the antidote to "I have to."</p>
<p>A person who trains because they are not enough will eventually burn out or chase endless goals that never satisfy. A person who trains so they can be, feel, and give their best has a reason that can last a lifetime.</p>
<blockquote><p><em>I train and eat this way so I can have the energy to be, feel, and give my best to myself and others, and live greatly with no regrets.</em></p></blockquote>
<p>The lamb survives by hiding. The lion lives by standing forward. Choose, every morning.</p>`,
  },
  {
    slug: 'strong-enough-to-serve',
    title: 'Strong Enough to Serve',
    categories: ['leadership'],
    excerpt: 'Why I do not coach everyone. The standard is both — strong enough to lead, compassionate enough to serve.',
    content: `<p>I do not coach everyone. There is a waitlist. There is a filter. There is a standard.</p>
<p>This is not gatekeeping for its own sake. It is the only honest way to do this work.</p>
<h2>What Disqualifies a Candidate</h2>
<p>Not age. Not weight. Not where they are starting. Not what they have failed at before.</p>
<p>The disqualifier is unwillingness — the person who wants the result without becoming the kind of person who can carry it. The person looking for a hack instead of a path. The person who wants to outsource their worth and their work to a coach.</p>
<p>I do not want people dependent on me. I want to educate and empower them to become their own best trainer, their own best leader, their own best guardian of their body, mind, and life.</p>
<h2>Strength Exists for Service</h2>
<p>Strength without compassion becomes domination. Compassion without strength becomes fear and helplessness. The standard is both.</p>
<p>The lion is not a savage. The lion is a heart-driven leader who trains so they can give more, love better, serve longer, and live with no regrets.</p>
<h2>Before You Change the World</h2>
<p>Before you change the world, you first have to change yourself. Then you use who you have become to bless the people around you.</p>
<p>That is the work. That is the Legion. That is the standard.</p>`,
  },
];

// ----- Per-post styled layout builder (used by `style` / `style-all`) -----
// Bakes the post's title, eyebrow (categories + date), and HTML content directly
// into static Elementor widgets — no dynamic theme-post-* widgets, so renders
// safely without the loop-recursion that breaks theme-post-content on its own
// host post. Pair with the navbar + footer JSON for a full page.

function heroSection({ eyebrow, title }) {
  const safeTitle = String(title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return {
    id: 'sec_singleH_' + shortId(),
    elType: 'section',
    settings: {
      layout: 'full_width',
      stretch_section: 'section-stretched',
      background_background: 'classic',
      background_color: '#0a0a0a',
      background_overlay_background: 'gradient',
      background_overlay_color: '#14b8a6',
      background_overlay_color_stop: { unit: '%', size: 0 },
      background_overlay_color_b: '#0a0a0a',
      background_overlay_color_b_stop: { unit: '%', size: 60 },
      background_overlay_gradient_type: 'radial',
      background_overlay_gradient_position: 'center top',
      background_overlay_opacity: { unit: 'px', size: 0.18 },
      padding: { unit: 'px', top: '140', right: '24', bottom: '80', left: '24', isLinked: false },
      padding_mobile: { unit: 'px', top: '80', right: '16', bottom: '56', left: '16', isLinked: false },
      content_width: { unit: 'px', size: 1240 },
    },
    elements: [
      {
        id: 'col_singleH_' + shortId(),
        elType: 'column',
        settings: { _column_size: 100, content_position: 'center' },
        elements: [
          {
            id: 'w_singleH_back_' + shortId(),
            elType: 'widget',
            widgetType: 'text-editor',
            settings: {
              editor: '<p style="margin:0 0 32px 0;"><a href="/billybeck/blog/" style="color:#14b8a6;text-decoration:none;letter-spacing:3px;text-transform:uppercase;font-weight:700;border-bottom:1px solid #14b8a6;padding-bottom:2px;font-size:11px;">&larr; BACK TO FIELD NOTES</a></p>',
              typography_typography: 'custom',
              typography_font_family: 'Space Mono',
            },
            elements: [],
          },
          {
            id: 'w_singleH_eb_' + shortId(),
            elType: 'widget',
            widgetType: 'heading',
            settings: {
              title: eyebrow || '— FIELD NOTES',
              header_size: 'div',
              align: 'left',
              title_color: '#14b8a6',
              typography_typography: 'custom',
              typography_font_family: 'Space Mono',
              typography_font_weight: '700',
              typography_font_size: { unit: 'px', size: 11 },
              typography_letter_spacing: { unit: 'px', size: 4 },
              typography_text_transform: 'uppercase',
              _margin: { unit: 'px', top: '0', right: '0', bottom: '28', left: '0', isLinked: false },
            },
            elements: [],
          },
          {
            id: 'w_singleH_t_' + shortId(),
            elType: 'widget',
            widgetType: 'heading',
            settings: {
              title: safeTitle,
              header_size: 'h1',
              align: 'left',
              title_color: '#ffffff',
              typography_typography: 'custom',
              typography_font_family: 'Anton',
              typography_font_weight: '400',
              typography_font_size: { unit: 'px', size: 96 },
              typography_font_size_tablet: { unit: 'px', size: 64 },
              typography_font_size_mobile: { unit: 'px', size: 40 },
              typography_line_height: { unit: 'em', size: 0.95 },
              typography_letter_spacing: { unit: 'px', size: -2 },
              typography_text_transform: 'uppercase',
              _margin: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', isLinked: false },
            },
            elements: [],
          },
        ],
      },
    ],
  };
}

function contentSection({ html }) {
  // Wrap raw post HTML with a `prose` div carrying inline CSS so Elementor's
  // text-editor widget renders it consistently (text-editor strips most
  // top-level styles otherwise). Inline styles target h2/h3/blockquote/links/lists.
  const styled = `<div class="bb-prose" style="color:#cfcfcf;font-family:'Inter',sans-serif;font-size:17px;line-height:1.75;">
<style>
.bb-prose p{font-family:'Inter',sans-serif !important;font-size:17px !important;line-height:1.75 !important;color:#cfcfcf !important;margin:0 0 24px 0;}
.bb-prose h2{font-family:'Anton',sans-serif !important;font-weight:400 !important;font-size:40px !important;line-height:1.05 !important;letter-spacing:-0.5px !important;text-transform:uppercase !important;color:#ffffff !important;margin:48px 0 20px 0;padding-top:8px;border-top:1px solid #242220;}
.bb-prose h2:first-child{margin-top:0;padding-top:0;border-top:0;}
.bb-prose h3{font-family:'Anton',sans-serif !important;font-weight:400 !important;font-size:28px !important;line-height:1.1 !important;text-transform:uppercase !important;color:#ffffff !important;margin:32px 0 16px 0;}
.bb-prose h4{font-family:'Space Mono','Courier New',monospace !important;font-weight:700 !important;font-size:13px !important;letter-spacing:3px !important;text-transform:uppercase !important;color:#14b8a6 !important;margin:28px 0 12px 0;}
.bb-prose a{color:#14b8a6 !important;text-decoration:none !important;border-bottom:1px solid #14b8a6;transition:color .2s,border-color .2s;}
.bb-prose a:hover{color:#ffffff !important;border-bottom-color:#ffffff;}
.bb-prose blockquote{margin:32px 0;padding:24px 32px;border-left:3px solid #c8102e;background-color:rgba(200,16,46,0.06);color:#ffffff !important;font-style:italic;}
.bb-prose blockquote p{color:#ffffff !important;font-size:22px !important;line-height:1.5 !important;font-weight:500 !important;margin:0;}
.bb-prose ul,.bb-prose ol{margin:0 0 24px 0;padding-left:24px;color:#cfcfcf !important;}
.bb-prose li{font-family:'Inter',sans-serif !important;font-size:17px !important;line-height:1.7 !important;color:#cfcfcf !important;margin-bottom:12px;}
.bb-prose li strong{color:#ffffff !important;}
.bb-prose strong{color:#ffffff !important;font-weight:700 !important;}
.bb-prose em{color:#ffffff !important;}
.bb-prose hr{border:0;border-top:1px solid #242220;margin:48px 0;}
@media(max-width:768px){.bb-prose h2{font-size:30px !important;}.bb-prose blockquote p{font-size:18px !important;}}
</style>
${html}
</div>`;
  return {
    id: 'sec_singleC_' + shortId(),
    elType: 'section',
    settings: {
      layout: 'boxed',
      structure: '20',
      background_background: 'classic',
      background_color: '#0a0a0a',
      padding: { unit: 'px', top: '0', right: '24', bottom: '60', left: '24', isLinked: false },
      padding_mobile: { unit: 'px', top: '0', right: '16', bottom: '40', left: '16', isLinked: false },
      content_width: { unit: 'px', size: 880 },
    },
    elements: [
      {
        id: 'col_singleC_' + shortId(),
        elType: 'column',
        settings: {
          _column_size: 100,
          background_background: 'classic',
          background_color: '#141311',
          border_border: 'solid',
          border_width: { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', isLinked: true },
          border_color: '#242220',
          padding: { unit: 'px', top: '64', right: '72', bottom: '64', left: '72', isLinked: false },
          padding_tablet: { unit: 'px', top: '48', right: '40', bottom: '48', left: '40', isLinked: false },
          padding_mobile: { unit: 'px', top: '32', right: '24', bottom: '32', left: '24', isLinked: false },
        },
        elements: [
          {
            id: 'w_singleC_' + shortId(),
            elType: 'widget',
            widgetType: 'text-editor',
            settings: { editor: styled },
            elements: [],
          },
        ],
      },
    ],
  };
}

function backLinkSection() {
  return {
    id: 'sec_singleBack_' + shortId(),
    elType: 'section',
    settings: {
      layout: 'boxed',
      structure: '20',
      background_background: 'classic',
      background_color: '#0a0a0a',
      padding: { unit: 'px', top: '0', right: '24', bottom: '40', left: '24', isLinked: false },
      content_width: { unit: 'px', size: 880 },
    },
    elements: [
      {
        id: 'col_singleBack_' + shortId(),
        elType: 'column',
        settings: { _column_size: 100, align: 'center' },
        elements: [
          {
            id: 'w_singleBack_' + shortId(),
            elType: 'widget',
            widgetType: 'text-editor',
            settings: {
              editor: '<p style="text-align:center;margin:32px 0 0 0;"><a href="/billybeck/blog/" style="color:#14b8a6;text-decoration:none;letter-spacing:3px;text-transform:uppercase;font-weight:700;border-bottom:1px solid #14b8a6;padding-bottom:2px;font-size:11px;">&larr; ALL FIELD NOTES</a></p>',
              align: 'center',
              typography_typography: 'custom',
              typography_font_family: 'Space Mono',
            },
            elements: [],
          },
        ],
      },
    ],
  };
}

function ctaSection() {
  return {
    id: 'sec_singleCTA_' + shortId(),
    elType: 'section',
    settings: {
      layout: 'full_width',
      stretch_section: 'section-stretched',
      background_background: 'classic',
      background_color: '#0a0a0a',
      background_overlay_background: 'gradient',
      background_overlay_color: '#c8102e',
      background_overlay_color_stop: { unit: '%', size: 0 },
      background_overlay_color_b: '#0a0a0a',
      background_overlay_color_b_stop: { unit: '%', size: 60 },
      background_overlay_gradient_type: 'radial',
      background_overlay_gradient_position: 'center center',
      background_overlay_opacity: { unit: 'px', size: 0.18 },
      border_border: 'solid',
      border_width: { unit: 'px', top: '1', right: '0', bottom: '1', left: '0', isLinked: false },
      border_color: '#1a1a1a',
      padding: { unit: 'px', top: '100', right: '24', bottom: '120', left: '24', isLinked: false },
      padding_mobile: { unit: 'px', top: '64', right: '16', bottom: '80', left: '16', isLinked: false },
      content_width: { unit: 'px', size: 1240 },
    },
    elements: [
      {
        id: 'col_singleCTA_' + shortId(),
        elType: 'column',
        settings: { _column_size: 100, content_position: 'center', align: 'center' },
        elements: [
          {
            id: 'w_singleCTA_eb_' + shortId(),
            elType: 'widget',
            widgetType: 'heading',
            settings: {
              title: '— KEEP UP  ·  ONE EMAIL, ONE LESSON, ONE LIFT',
              header_size: 'div',
              align: 'center',
              title_color: '#14b8a6',
              typography_typography: 'custom',
              typography_font_family: 'Space Mono',
              typography_font_weight: '700',
              typography_font_size: { unit: 'px', size: 11 },
              typography_letter_spacing: { unit: 'px', size: 4 },
              typography_text_transform: 'uppercase',
              _margin: { unit: 'px', top: '0', right: '0', bottom: '24', left: '0', isLinked: false },
            },
            elements: [],
          },
          {
            id: 'w_singleCTA_t_' + shortId(),
            elType: 'widget',
            widgetType: 'heading',
            settings: {
              title: 'Field Notes hit Mondays.',
              header_size: 'h2',
              align: 'center',
              title_color: '#ffffff',
              typography_typography: 'custom',
              typography_font_family: 'Anton',
              typography_font_weight: '400',
              typography_font_size: { unit: 'px', size: 80 },
              typography_font_size_tablet: { unit: 'px', size: 56 },
              typography_font_size_mobile: { unit: 'px', size: 36 },
              typography_line_height: { unit: 'em', size: 0.95 },
              typography_letter_spacing: { unit: 'px', size: -2 },
              typography_text_transform: 'uppercase',
              _margin: { unit: 'px', top: '0', right: '0', bottom: '24', left: '0', isLinked: false },
            },
            elements: [],
          },
          {
            id: 'w_singleCTA_btn_' + shortId(),
            elType: 'widget',
            widgetType: 'button',
            settings: {
              text: 'Get the Field Notes',
              link: { url: '/billybeck/contact' },
              align: 'center',
              size: 'md',
              button_text_color: '#0a0a0a',
              background_color: '#14b8a6',
              hover_color: '#ffffff',
              button_background_hover_color: '#0a0a0a',
              border_border: 'solid',
              border_width: { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', isLinked: true },
              border_color: '#14b8a6',
              border_radius: { unit: 'px', top: '999', right: '999', bottom: '999', left: '999', isLinked: true },
              typography_typography: 'custom',
              typography_font_family: 'Space Mono',
              typography_font_weight: '700',
              typography_font_size: { unit: 'px', size: 12 },
              typography_letter_spacing: { unit: 'px', size: 2 },
              typography_text_transform: 'uppercase',
              text_padding: { unit: 'px', top: '16', right: '32', bottom: '16', left: '32', isLinked: false },
              hover_animation: 'pulse',
            },
            elements: [],
          },
        ],
      },
    ],
  };
}

function shortId() {
  return Math.random().toString(36).slice(2, 9);
}

// Mark "Blog" nav link active by mutating the navbar HTML in place.
function activateBlogNav(node) {
  const tagRe = /<a data-page="blog"([^>]*)>/g;
  function walk(n) {
    if (Array.isArray(n)) { for (const x of n) walk(x); return; }
    if (!n || typeof n !== 'object') return;
    for (const k of Object.keys(n)) {
      const v = n[k];
      if (typeof v === 'string' && (k === 'editor' || k === 'tab_content')) {
        n[k] = v.replace(tagRe, (_, attrs) => {
          let a = attrs
            .replace('color:#9a9a9a', 'color:#c8102e')
            .replace('color:#ffffff', 'color:#c8102e')
            .replace('border-bottom:1px solid transparent', 'border-bottom:1px solid #c8102e')
            .replace('border-left:3px solid transparent', 'border-left:3px solid #c8102e');
          return `<a data-page="blog" data-active="true"${a.replace('text-decoration:none;', 'text-decoration:none;font-weight:700;')}>`;
        });
      } else if (v && typeof v === 'object') {
        walk(v);
      }
    }
  }
  walk(node);
}

async function main() {
  const cmd = process.argv[2];

  if (cmd === 'cats') {
    await init();
    const cats = await callTool('wp_list_categories', { per_page: 100 });
    const arr = Array.isArray(cats) ? cats : [cats].filter(Boolean);
    arr.forEach(c => console.log(`${String(c.id).padStart(3)}  /${c.slug}  — ${c.name}  (${c.count || 0})`));
    return;
  }

  if (cmd === 'add-cats') {
    await init();
    const existing = await callTool('wp_list_categories', { per_page: 100 });
    const existingArr = Array.isArray(existing) ? existing : [existing].filter(Boolean);
    const bySlug = new Map(existingArr.map(c => [c.slug, c]));
    for (const c of CATEGORIES) {
      if (bySlug.has(c.slug)) { console.log(`= /${c.slug} (id ${bySlug.get(c.slug).id}) already exists`); continue; }
      const created = await callTool('wp_add_category', { name: c.name, slug: c.slug, description: c.description });
      console.log(`+ /${created.slug} (id ${created.id}) — ${created.name}`);
    }
    return;
  }

  if (cmd === 'list') {
    await init();
    const posts = await callTool('wp_posts_search', { per_page: 50, status: ['publish', 'draft', 'pending', 'private'] });
    const arr = Array.isArray(posts) ? posts : [posts].filter(Boolean);
    arr.forEach(p => console.log(`${String(p.id).padStart(4)}  ${(p.status || '?').padEnd(7)}  /${p.slug || '(none)'} — ${p.title?.rendered || ''}`));
    return;
  }

  if (cmd === 'seed') {
    await init();
    // map category slugs -> IDs
    const cats = await callTool('wp_list_categories', { per_page: 100 });
    const catArr = Array.isArray(cats) ? cats : [cats].filter(Boolean);
    const catBySlug = new Map(catArr.map(c => [c.slug, c.id]));
    // existing posts by slug
    const existing = await callTool('wp_posts_search', { per_page: 100, status: ['publish', 'draft', 'pending', 'private'] });
    const existingArr = Array.isArray(existing) ? existing : [existing].filter(Boolean);
    const postBySlug = new Map(existingArr.map(p => [p.slug, p]));
    for (const post of POSTS) {
      const catIds = post.categories.map(s => catBySlug.get(s)).filter(Boolean);
      if (catIds.length !== post.categories.length) { console.log(`! /${post.slug}: missing category mapping; run add-cats first`); continue; }
      if (postBySlug.has(post.slug)) {
        const existing = postBySlug.get(post.slug);
        console.log(`= /${post.slug} (id ${existing.id}) — updating content`);
        const updated = await callTool('wp_update_post', {
          id: existing.id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          status: 'publish',
          categories: catIds,
        });
        console.log(`  ✓ updated id ${updated.id}`);
      } else {
        const created = await callTool('wp_add_post', {
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          status: 'publish',
          slug: post.slug,
          categories: catIds,
        });
        console.log(`+ /${created.slug} (id ${created.id}) — ${created.title?.rendered || post.title}`);
      }
    }
    return;
  }

  if (cmd === 'style' || cmd === 'style-all') {
    await init();
    const navJson = JSON.parse(readFileSync(resolve(__dirname, '_navbar.v6.json'), 'utf8'));
    const footerJson = JSON.parse(readFileSync(resolve(__dirname, '_footer.v6.json'), 'utf8'));
    const cats = await callTool('wp_list_categories', { per_page: 100 });
    const catArr = Array.isArray(cats) ? cats : [cats].filter(Boolean);
    const catById = new Map(catArr.map(c => [c.id, c]));

    let targetIds = [];
    if (cmd === 'style') {
      const id = parseInt(process.argv[3], 10);
      if (!id) throw new Error('style <postId>');
      targetIds = [id];
    } else {
      const all = await callTool('wp_posts_search', { per_page: 100, status: ['publish'] });
      const arr = Array.isArray(all) ? all : [all].filter(Boolean);
      targetIds = arr.map(p => p.id);
    }

    for (const postId of targetIds) {
      const post = await callTool('wp_get_post', { id: postId, context: 'edit' });
      const title = (post.title?.raw || post.title?.rendered || '').replace(/<[^>]+>/g, '');
      const content = post.content?.raw || '';
      const dateRaw = (post.date || post.date_gmt || '').slice(0, 10);
      const dateStr = dateRaw ? new Date(dateRaw + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).toUpperCase() : '';
      const catNames = (post.categories || []).map(cid => (catById.get(cid)?.name || '').toUpperCase()).filter(Boolean);
      const eyebrow = ['— FIELD NOTES', ...catNames, dateStr].filter(Boolean).join('  ·  ');

      const navBaked = JSON.parse(JSON.stringify(navJson));
      const footerBaked = JSON.parse(JSON.stringify(footerJson));
      activateBlogNav([...navBaked, ...footerBaked]);

      const body = [
        heroSection({ eyebrow, title }),
        contentSection({ html: content }),
        backLinkSection(),
        ctaSection(),
      ];

      const layout = [...navBaked, ...body, ...footerBaked];
      const result = await callTool('wp_update_post', {
        id: postId,
        template: 'elementor_canvas',
        meta: {
          _elementor_data: JSON.stringify(layout),
          _elementor_edit_mode: 'builder',
          _elementor_version: '4.0.7',
          _wp_page_template: 'elementor_canvas',
        },
      });
      console.log(`✓ styled post ${postId} — ${title} (${result.modified})`);
      // Clear elementor css cache for this post
      await callTool('wp_update_post', { id: postId, meta: { _elementor_css: '' } });
    }
    return;
  }

  if (cmd === 'unstyle') {
    const id = parseInt(process.argv[3], 10);
    if (!id) throw new Error('unstyle <postId>');
    await init();
    await callTool('wp_update_post', { id, template: 'default', meta: { _elementor_data: '', _elementor_edit_mode: '', _wp_page_template: 'default' } });
    console.log(`Unstyled post ${id} (back to theme default)`);
    return;
  }

  if (cmd === 'delete') {
    const id = parseInt(process.argv[3], 10);
    if (!id) throw new Error('delete <postId>');
    await init();
    const out = await callTool('wp_update_post', { id, status: 'trash' });
    console.log(`Trashed post ${id}: ${out.title?.rendered || ''}`);
    return;
  }

  console.error('Commands: cats | add-cats | list | seed | delete');
  process.exit(1);
}

main().catch(e => { console.error(e.message); process.exit(1); });
