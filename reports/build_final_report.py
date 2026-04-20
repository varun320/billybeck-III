"""Build the final unified Billy Beck III audit PDF."""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate,
    PageTemplate,
    Frame,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    NextPageTemplate,
)
from reportlab.pdfgen import canvas

NAVY = colors.HexColor("#0E1726")
GOLD = colors.HexColor("#C9A23A")
RED = colors.HexColor("#B00020")
INK = colors.HexColor("#1A1A1A")
MUTE = colors.HexColor("#5F6B7A")
LIGHT = colors.HexColor("#F5F6F7")
ROW = colors.HexColor("#F9F9FA")
RULE = colors.HexColor("#E2E4E8")


def header_footer(canv: canvas.Canvas, doc):
    canv.saveState()
    w, h = A4
    canv.setFillColor(NAVY)
    canv.rect(0, h - 18 * mm, w, 18 * mm, stroke=0, fill=1)
    canv.setFillColor(GOLD)
    canv.rect(0, h - 20 * mm, w, 2 * mm, stroke=0, fill=1)
    canv.setFillColor(colors.white)
    canv.setFont("Helvetica-Bold", 10)
    canv.drawString(15 * mm, h - 12 * mm, "billybeck.com — Unified Audit")
    canv.setFont("Helvetica", 9)
    canv.drawRightString(w - 15 * mm, h - 12 * mm, "Prepared Apr 23, 2026")

    canv.setFillColor(MUTE)
    canv.setFont("Helvetica", 8)
    canv.drawString(15 * mm, 10 * mm, "Confidential — Site, Analytics & Search Audit")
    canv.drawRightString(w - 15 * mm, 10 * mm, f"Page {doc.page}")
    canv.restoreState()


def cover_page(canv: canvas.Canvas, doc):
    canv.saveState()
    w, h = A4
    canv.setFillColor(NAVY)
    canv.rect(0, 0, w, h, stroke=0, fill=1)

    canv.setFillColor(GOLD)
    canv.rect(0, h - 90 * mm, w, 2 * mm, stroke=0, fill=1)
    canv.rect(0, h - 92 * mm, 40 * mm, 0.5 * mm, stroke=0, fill=1)

    canv.setFillColor(colors.white)
    canv.setFont("Helvetica-Bold", 11)
    canv.drawString(20 * mm, h - 25 * mm, "BILLYBECK.COM")
    canv.setFont("Helvetica", 9)
    canv.setFillColor(GOLD)
    canv.drawString(20 * mm, h - 31 * mm, "UNIFIED SITE + ANALYTICS + SEARCH AUDIT")

    canv.setFillColor(colors.white)
    canv.setFont("Helvetica-Bold", 42)
    canv.drawString(20 * mm, h - 110 * mm, "Site Audit,")
    canv.drawString(20 * mm, h - 124 * mm, "Analytics &")
    canv.drawString(20 * mm, h - 138 * mm, "Growth Plan")

    canv.setFillColor(GOLD)
    canv.setFont("Helvetica", 12)
    canv.drawString(20 * mm, h - 152 * mm,
                    "billybeck.com — Personal Training, Nutrition & Mental Conditioning")

    canv.setFillColor(colors.white)
    canv.setFont("Helvetica", 10)
    canv.drawString(20 * mm, h - 175 * mm, "Prepared for:  Billy Beck III")
    canv.drawString(20 * mm, h - 182 * mm, "Data windows:  90 days (2026-01-23 → 2026-04-22)")
    canv.drawString(20 * mm, h - 189 * mm, "Sources:     Site crawl (Apr 22) · GA4 Data API · Search Console API")

    canv.setFillColor(GOLD)
    canv.rect(20 * mm, 22 * mm, w - 40 * mm, 0.5 * mm, stroke=0, fill=1)
    canv.setFillColor(colors.white)
    canv.setFont("Helvetica", 8)
    canv.drawString(20 * mm, 15 * mm, "Confidential — prepared by Prodigy AI · Apr 23, 2026")
    canv.restoreState()


def build_styles():
    ss = getSampleStyleSheet()
    styles = {}
    styles["Body"] = ParagraphStyle(
        "Body", parent=ss["Normal"], fontName="Helvetica",
        fontSize=9.5, leading=13, textColor=INK, spaceAfter=4,
        alignment=TA_JUSTIFY,
    )
    styles["BodyTight"] = ParagraphStyle(
        "BodyTight", parent=styles["Body"], spaceAfter=2, alignment=TA_LEFT,
    )
    styles["Bullet"] = ParagraphStyle(
        "Bullet", parent=styles["Body"], leftIndent=10, bulletIndent=0,
        spaceAfter=2, alignment=TA_LEFT,
    )
    styles["H1"] = ParagraphStyle(
        "H1", parent=ss["Heading1"], fontName="Helvetica-Bold",
        fontSize=22, leading=26, textColor=NAVY, spaceBefore=0, spaceAfter=6,
    )
    styles["H2"] = ParagraphStyle(
        "H2", parent=ss["Heading2"], fontName="Helvetica-Bold",
        fontSize=14, leading=18, textColor=NAVY, spaceBefore=10, spaceAfter=4,
    )
    styles["H3"] = ParagraphStyle(
        "H3", parent=ss["Heading3"], fontName="Helvetica-Bold",
        fontSize=11, leading=14, textColor=NAVY, spaceBefore=8, spaceAfter=2,
    )
    styles["Kicker"] = ParagraphStyle(
        "Kicker", parent=styles["Body"], fontName="Helvetica-Bold",
        fontSize=8.5, leading=11, textColor=GOLD, spaceAfter=2,
    )
    styles["Lead"] = ParagraphStyle(
        "Lead", parent=styles["Body"], fontSize=10.5, leading=15, spaceAfter=6,
    )
    styles["Muted"] = ParagraphStyle(
        "Muted", parent=styles["Body"], fontSize=8.5, leading=11,
        textColor=MUTE, alignment=TA_LEFT,
    )
    styles["TableCell"] = ParagraphStyle(
        "TableCell", parent=styles["Body"], fontSize=8.5, leading=11,
        spaceAfter=0, alignment=TA_LEFT,
    )
    styles["TableCellRight"] = ParagraphStyle(
        "TableCellRight", parent=styles["TableCell"], alignment=TA_LEFT,
    )
    styles["TableHeader"] = ParagraphStyle(
        "TableHeader", parent=styles["TableCell"], fontName="Helvetica-Bold",
        textColor=colors.white,
    )
    return styles


def section_banner(title: str, subtitle: str, number: str, styles):
    data = [[
        Paragraph(f'<font color="#C9A23A">PART {number}</font>', styles["Kicker"]),
        Paragraph(f'<font color="white"><b>{title}</b></font>',
                  ParagraphStyle("sb", parent=styles["H2"], textColor=colors.white, fontSize=16, leading=20)),
        Paragraph(f'<font color="#C9A23A">{subtitle}</font>',
                  ParagraphStyle("ss", parent=styles["Muted"], textColor=GOLD, fontSize=9, leading=12)),
    ]]
    t = Table([[data[0][0]], [data[0][1]], [data[0][2]]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, 0), 14),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
        ("TOPPADDING", (0, 1), (-1, 1), 2),
        ("LINEBELOW", (0, -1), (-1, -1), 2, GOLD),
    ]))
    return t


def kv_table(pairs, styles, col1=50 * mm, col2=120 * mm):
    rows = [[Paragraph(f"<b>{k}</b>", styles["TableCell"]),
             Paragraph(v, styles["TableCell"])] for k, v in pairs]
    t = Table(rows, colWidths=[col1, col2])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def data_table(header, rows, styles, col_widths, numeric_cols=None):
    numeric_cols = numeric_cols or []
    body = [[Paragraph(h, styles["TableHeader"]) for h in header]]
    for r in rows:
        body.append([Paragraph(str(c), styles["TableCell"]) for c in r])
    t = Table(body, colWidths=col_widths, repeatRows=1)
    tstyle = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, 0), 1, GOLD),
        ("LINEBELOW", (0, 1), (-1, -1), 0.25, RULE),
    ]
    for i in range(1, len(body)):
        if i % 2 == 0:
            tstyle.append(("BACKGROUND", (0, i), (-1, i), ROW))
    for c in numeric_cols:
        tstyle.append(("ALIGN", (c, 1), (c, -1), "RIGHT"))
    t.setStyle(TableStyle(tstyle))
    return t


def severity_row(title, severity, styles):
    sev_color = {"CRITICAL": RED, "HIGH": RED, "MEDIUM": GOLD, "LOW": MUTE,
                 "OPPORTUNITY": colors.HexColor("#1F7A3A")}.get(severity, MUTE)
    t = Table([[
        Paragraph(f"<b>{title}</b>",
                  ParagraphStyle("srt", parent=styles["Body"], fontSize=10, textColor=NAVY, alignment=TA_LEFT)),
        Paragraph(f'<font color="white"><b>{severity}</b></font>',
                  ParagraphStyle("srsev", parent=styles["Body"], fontSize=8.5, alignment=TA_CENTER, textColor=colors.white)),
    ]], colWidths=[140 * mm, 30 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (1, 0), (1, 0), sev_color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("BACKGROUND", (0, 0), (0, 0), LIGHT),
    ]))
    return t


def scorecard_bar(label, score, ceiling, note, styles):
    pct = score / ceiling
    fill_color = RED if pct <= 0.4 else GOLD if pct <= 0.6 else colors.HexColor("#1F7A3A")

    bar = Table([[Paragraph("", styles["Body"])]],
                colWidths=[max(1, 90 * mm * pct)], rowHeights=[4 * mm])
    bar.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), fill_color)]))
    bg = Table([[bar]], colWidths=[90 * mm], rowHeights=[4 * mm])
    bg.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    row = Table([[
        Paragraph(f"<b>{label}</b>", styles["TableCell"]),
        bg,
        Paragraph(f"<b>{score}/{ceiling}</b>", styles["TableCellRight"]),
        Paragraph(f'<font color="#5F6B7A">{note}</font>', styles["TableCell"]),
    ]], colWidths=[45 * mm, 50 * mm, 15 * mm, 60 * mm])
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, RULE),
    ]))
    return row


def para_list(items, styles, bullet="•"):
    return [Paragraph(f"{bullet}  {it}", styles["Bullet"]) for it in items]


def make_story(styles):
    S = []

    # ---- TOC / Intro page ----
    S.append(Paragraph("Contents", styles["H1"]))
    S.append(Spacer(1, 4 * mm))
    toc_rows = [
        ["Part A.",  "Site Audit & Growth Plan (crawl-based)"],
        ["",         "A1  Overall Scorecard"],
        ["",         "A2  Executive Summary"],
        ["",         "A3  Technical SEO Audit"],
        ["",         "A4  On-Page SEO & Metadata"],
        ["",         "A5  Content & Information Architecture"],
        ["",         "A6  Design & User Experience"],
        ["",         "A7  Performance & Core Web Vitals"],
        ["",         "A8  Local SEO · Accessibility · International"],
        ["Part B.",  "GA4 Analytics Audit (last 90 days)"],
        ["",         "B1  Executive summary & 28-day cliff"],
        ["",         "B2  Channels, sources, devices & geography"],
        ["",         "B3  Pages, landings, events"],
        ["",         "B4  Data-quality & tracking issues"],
        ["Part C.",  "Search Console Audit (last 90 days)"],
        ["",         "C1  Executive summary & performance trend"],
        ["",         "C2  Top queries & pages"],
        ["",         "C3  Devices, geography & sitemaps"],
        ["",         "C4  Top issues"],
        ["Part D.",  "Unified 90-Day Action Plan"],
    ]
    t = Table(toc_rows, colWidths=[22 * mm, 148 * mm])
    t.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 10),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    for i, row in enumerate(toc_rows):
        if row[0]:
            t.setStyle(TableStyle([
                ("FONT", (0, i), (-1, i), "Helvetica-Bold", 11),
                ("TEXTCOLOR", (0, i), (-1, i), NAVY),
                ("TOPPADDING", (0, i), (-1, i), 6),
            ]))
    S.append(t)

    S.append(Spacer(1, 10 * mm))
    S.append(Paragraph("How to read this document", styles["H3"]))
    S.append(Paragraph(
        "Part A is the qualitative audit of the live site as crawled on Apr 22, 2026 — technical hygiene, "
        "on-page metadata, design and UX. Parts B and C replace estimated numbers with real data from "
        "Google Analytics 4 and Google Search Console (90-day window ending Apr 22, 2026). Part D consolidates "
        "everything into a single prioritized 90-day action plan.",
        styles["Lead"]))
    S.append(Paragraph(
        "Severity rating: <b>HIGH</b> = fix first, <b>MEDIUM</b> = fix soon, <b>LOW</b> = polish.",
        styles["Muted"]))

    S.append(PageBreak())

    # ============================================================
    #  PART A — SITE AUDIT
    # ============================================================
    S.append(section_banner("Site Audit & Growth Plan",
                            "Based on HTML crawl of homepage and key inner pages", "A", styles))
    S.append(Spacer(1, 6 * mm))

    # A1 Scorecard
    S.append(Paragraph("A1  Overall Scorecard", styles["H2"]))
    S.append(Paragraph(
        "Composite score is <b>36 / 80 (≈ 45%)</b> — <i>working but leaking growth</i>. "
        "The technical and conversion foundation lags behind the brand authority.", styles["Body"]))
    S.append(Spacer(1, 3 * mm))

    scorecard = [
        ("Technical SEO", 4, 10, "crawlability OK but many fixable issues"),
        ("On-Page SEO", 5, 10, "decent titles, weak headings & schema"),
        ("Content Depth", 6, 10, "great proof, thin service pages"),
        ("Design & UX", 6, 10, "looks dated, CTA unclear"),
        ("Performance", 4, 10, "heavy theme, unoptimized media"),
        ("Local SEO", 3, 10, "no address, no LocalBusiness schema"),
        ("Accessibility", 4, 10, "alt-text, contrast, forms need work"),
        ("Reach / Growth Systems", 4, 10, "no lead magnet, weak funnel"),
    ]
    for label, score, ceiling, note in scorecard:
        S.append(scorecard_bar(label, score, ceiling, note, styles))

    S.append(Spacer(1, 5 * mm))
    composite = Table([[
        Paragraph('<font color="white"><b>Composite Score</b></font>',
                  ParagraphStyle("c1", parent=styles["Body"], textColor=colors.white)),
        Paragraph('<font color="white"><b>36 / 80 — roughly 45% — "working but leaking growth"</b></font>',
                  ParagraphStyle("c2", parent=styles["Body"], textColor=colors.white)),
    ]], colWidths=[45 * mm, 125 * mm])
    composite.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    S.append(composite)

    S.append(Spacer(1, 5 * mm))
    S.append(Paragraph("Top 5 highest-impact fixes (do these first)", styles["H3"]))
    S.extend(para_list([
        "Fix the <b>double-slash image URLs</b> (//wp-content/) and the <b>www vs non-www</b> mismatch — "
        "these cause unnecessary redirects and broken images on some devices.",
        "Add a proper <b>LocalBusiness + Person schema</b> (Billy Beck, Pembroke Pines FL, phone, hours). "
        "Today the site is invisible for \"personal trainer Pembroke Pines\" / \"South Florida celebrity trainer.\"",
        "Replace the generic H1 \"LIVE LIKE A LION\" with a keyword-rich headline like "
        "\"Elite Personal Training, Nutrition & Mental Conditioning — by 2× World's Best Trainer Billy Beck III.\"",
        "Add a primary CTA (<b>Apply / Book Consultation</b>) that sticks in the header on mobile. "
        "The phone number alone is not enough.",
        "Ship a <b>lead magnet</b> (the existing \"7 Essential Factors\" PDF already shown on the hero) "
        "with a real email capture + follow-up sequence. Today it links but has no funnel.",
    ], styles))

    S.append(PageBreak())

    # A2 Executive Summary
    S.append(Paragraph("A2  Executive Summary", styles["H2"]))
    S.append(Paragraph(
        "<b>Billy Beck III</b> is a powerhouse personal brand — 2× World's Best Personal Trainer, Fitness "
        "Hall of Fame inductee, trainer to Tony Robbins. The authority and social proof are world-class. "
        "The website, however, is not keeping up. It is built on a dated WordPress theme (theme files carry "
        "2017 dates), ships a lot of unused assets, and misses most of the modern on-page and schema signals "
        "that Google now uses to rank expertise-led personal brands.",
        styles["Lead"]))
    S.append(Paragraph(
        "The opportunity is large and easy to capture: the E-E-A-T signals (Experience, Expertise, Authority, "
        "Trust) that most competitors spend years trying to fake are already in place. A clean-up of the "
        "technical foundation, a sharper CTA/funnel, and a modest content cadence would likely <b>2–4× "
        "qualified enquiries within two quarters</b>.",
        styles["Body"]))

    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph("What the site already does well", styles["H3"]))
    S.extend(para_list([
        "Unmatched <b>social proof</b>: Tony Robbins, NFL (Kim Herring), Sylvia Ferrero, 18+ before/after pairs, "
        "press logos (Men's Health, GQ, NBC, ABC, Fox, CBS).",
        "Clear <b>brand voice</b> — \"Live Like A Lion\" is memorable and consistent across pages.",
        "A working blog, video hub, and book (<i>Lean & Mean</i>) provide content infrastructure.",
        "Facebook Pixel installed → paid retargeting is possible.",
        "Secondary landing pages (<i>/tony</i>, <i>/upw</i>) exist — good instinct.",
    ], styles))

    S.append(Paragraph("Where the site is leaking growth", styles["H3"]))
    S.extend(para_list([
        "No clear primary call-to-action above the fold beyond a phone number.",
        "Local SEO signals are effectively absent (no NAP block, no LocalBusiness schema, no map, no location pages).",
        "Structured data (Person, Book, Review, Article, VideoObject) missing — rich-result real estate handed to competitors.",
        "Image delivery is doubled (SVG placeholder + raw JPG) and contains broken // paths. LCP is hurting.",
        "Translated pages (8 languages) risk duplicate content without proper hreflang + canonical pairs.",
        "No visible email capture funnel — hot leads have nowhere to go except a phone call or an Amazon book purchase.",
    ], styles))

    S.append(PageBreak())

    # A3 Technical SEO
    S.append(Paragraph("A3  Technical SEO Audit", styles["H2"]))
    S.append(Paragraph(
        "Crawlability is fine — the site is indexed and search engines can read it. But a number of "
        "technical foot-guns are quietly eroding rankings and trust. None of these are hard fixes.",
        styles["Body"]))
    S.append(Spacer(1, 2 * mm))

    tech_issues = [
        ("Mixed domain: billybeck.com vs www.billybeck.com", "HIGH",
         "Canonical is <b>billybeck.com</b> (no www), but most asset URLs are hard-coded to <b>www.billybeck.com</b>. "
         "Every asset hits an extra redirect, wasting crawl budget and slowing first paint. Search engines may split link equity.",
         "Set one canonical host in WordPress General > Site Address, add a 301, and run a WP-CLI search-replace to normalize asset URLs."),
        ("Double-slash in asset paths (//wp-content/)", "HIGH",
         "Many image URLs render as <i>https://www.billybeck.com//wp-content/themes/...</i> — duplicate cache entries and worse LCP.",
         "Remove the trailing slash from Site URL; run WP-CLI search-replace across wp_posts, wp_options, wp_postmeta."),
        ("No structured data (schema.org) detected", "HIGH",
         "Homepage and inner pages serve no JSON-LD. A personal-trainer site of this authority should publish "
         "Person, LocalBusiness, Book, Article, VideoObject and Review schemas.",
         "Add JSON-LD via Rank Math or a custom snippet. Minimum viable set: Person, LocalBusiness, Book (with reviews), VideoObject, BreadcrumbList."),
        ("Duplicated image markup (SVG placeholder + real image)", "MEDIUM",
         "Every homepage image renders twice (SVG placeholder + real JPEG/PNG) because of a lazy-load plugin. "
         "Result: 2× DOM nodes, CLS, and worse a11y.",
         "Switch to native loading=\"lazy\" and remove the placeholder plugin."),
        ("robots.txt & sitemap.xml not referenced", "MEDIUM",
         "No &lt;link rel=\"sitemap\"&gt; in the head; footer doesn't advertise the sitemap. Crawlers discover updates more slowly.",
         "Install/activate Rank Math or Yoast, auto-generate XML sitemap, add Sitemap: directive to robots.txt, submit in GSC + Bing."),
        ("No hreflang for 8 translated versions", "MEDIUM",
         "TranslatePress serves /zh/, /nl/, /fr/, /de/, /it/, /ja/, /pt/, /es/ but hreflang tags aren't confirmed. "
         "Google may serve wrong language or treat as duplicates.",
         "Enable hreflang in TranslatePress (SEO Pack). Each page should self-reference + list all siblings + x-default for English."),
        ("Missing modern image formats (WebP / AVIF)", "MEDIUM",
         "Homepage images served as JPEG/PNG at full dimensions. WebP is 25–35% smaller, AVIF is 40–50% smaller. "
         "Directly affects LCP.",
         "Install ShortPixel / Imagify / Cloudflare Polish. Serve WebP with responsive srcset. Keep originals ≤ 200 KB."),
        ("Header uses text \"Select Page\" as menu trigger", "LOW",
         "Theme default placeholder text. Unprofessional and confuses assistive tech.",
         "Customize the mobile nav label to \"Menu\" or use a proper hamburger icon."),
    ]

    for title, sev, found, fix in tech_issues:
        block = [
            severity_row(title, sev, styles),
            Table([
                [Paragraph("<b>What we found</b>", styles["TableCell"]),
                 Paragraph(found, styles["TableCell"])],
                [Paragraph("<b>How to fix</b>", styles["TableCell"]),
                 Paragraph(fix, styles["TableCell"])],
            ], colWidths=[35 * mm, 135 * mm]),
            Spacer(1, 3 * mm),
        ]
        block[1].setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), LIGHT),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -1), 0.25, RULE),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        S.append(KeepTogether(block))

    S.append(PageBreak())

    # A4 On-page
    S.append(Paragraph("A4  On-Page SEO & Metadata", styles["H2"]))
    onpage_rows = [
        ["Home (/)", "Billy Beck III — Personal Training, Nutrition, Supplements and Mental Conditioning",
         "Not visible / generic", "LIVE LIKE A LION", "H1 is brand-slogan only, not keyword-aligned."],
        ["/billy-beck-iii", "Billy Beck III - 2x World's Best Personal Trainer",
         "2x World's Best Personal Trainer. Fat burning strategies … Live Like A Lion.",
         "Meet Billy Beck III", "Good title, description slightly keyword-stuffed."],
        ["/coaching", "Personal Training and Coaching Programs",
         "Generic testimonial excerpt used as description.",
         "Unknown", "Description should describe the offer, not quote a client."],
        ["/testimonials", "Testimonials Archive - Billy Beck",
         "Not set / template default", "Testimonials", "Archive-style title; no Review schema attached."],
        ["/blog", "Blog - Billy Beck", "Not set / excerpt-based", "Blog", "Blog index has no curated intro copy."],
    ]
    S.append(data_table(
        ["Page", "Title Tag", "Meta Description", "H1", "Issue"], onpage_rows, styles,
        [25 * mm, 40 * mm, 42 * mm, 25 * mm, 38 * mm],
    ))

    S.append(Spacer(1, 4 * mm))
    S.append(Paragraph("Recommendations", styles["H3"]))
    S.extend(para_list([
        "<b>Homepage title:</b> <i>Elite Personal Trainer &amp; Nutrition Coach | Billy Beck III — South Florida</i> (≤ 60 chars).",
        "<b>Homepage meta description:</b> 150–160 chars, include \"2× World's Best Trainer,\" \"Pembroke Pines / South Florida,\" and a direct CTA (\"Apply to train\").",
        "<b>H1 per page:</b> keyword-aligned. The home H1 should contain \"personal trainer\" or \"coach.\" \"Live Like A Lion\" becomes an H2/tagline.",
        "<b>H2/H3 hierarchy:</b> sections on the home are all H2 — nest testimonials, videos, articles, results with proper H3.",
        "<b>Open Graph &amp; Twitter Cards:</b> set og:title, og:description, og:image, twitter:card=summary_large_image.",
        "<b>Canonical tags:</b> one self-referential rel=\"canonical\" per page. Translated pages canonical to themselves, not English.",
        "<b>Internal linking:</b> add contextual links so authority flows /billy-beck-iii → /coaching → /contact.",
    ], styles))

    S.append(PageBreak())

    # A5 Content & IA
    S.append(Paragraph("A5  Content & Information Architecture", styles["H2"]))
    ia_rows = [
        ["Home", "Active", "Strong social proof, weak CTA, no service explanation."],
        ["About (/billy-beck-iii)", "Active", "Well-written bio. Missing credentials schema + photo alt text."],
        ["Coaching", "Active", "Offer page exists but unclear pricing / tiers / outcomes."],
        ["Testimonials", "Active", "Deep archive. No Review schema, no video testimonials embedded."],
        ["Blog", "Intermittent", "Older posts 2017–2021, a few recent; no content calendar visible."],
        ["Videos", "Thin", "Useful BB3 TV hub, but each page is a YouTube embed + 1 paragraph."],
        ["Supplements", "Thin", "Only one article surfaced. Missed affiliate revenue opportunity."],
        ["/tony, /upw", "Active", "Campaign landing pages — reuse pattern for other launches."],
        ["Contact", "Active", "Likely a standard form; spam protection, schema, address unconfirmed."],
    ]
    S.append(data_table(["Section", "State", "Observation"], ia_rows, styles,
                        [45 * mm, 25 * mm, 100 * mm]))
    S.append(Spacer(1, 3 * mm))

    S.append(Paragraph("Content gaps (and the SEO traffic they'd unlock)", styles["H3"]))
    S.extend(para_list([
        "<b>Service pages with pricing/tiers</b> (1-on-1 Elite, Online Coaching, Corporate / Executive).",
        "<b>City / location page</b> (\"Personal Trainer in Pembroke Pines\") — currently missing from local SERPs.",
        "<b>Pillar articles</b>: fat loss over 40, body recomposition for executives, training around chronic pain, nutrition protocols (2,000+ words).",
        "<b>FAQ page</b> with FAQ schema to earn SERP accordions.",
        "<b>Case-study pages</b> — one per client with before/after, timeline, protocol summary.",
        "<b>\"Featured In\" page</b> with working links to Men's Health / GQ / Men's Journal articles.",
        "<b>Supplements hub</b> → proper /supplements landing with stack + affiliate links.",
        "<b>Podcast / interview archive</b> — indexable pages with rich content and backlinks.",
    ], styles))

    S.append(PageBreak())

    # A6 Design & UX
    S.append(Paragraph("A6  Design & User Experience", styles["H2"]))
    S.append(Paragraph("Design observations", styles["H3"]))
    S.extend(para_list([
        "<b>Visual era:</b> theme assets last touched ~2017. Typography and spacing feel pre-Core-Web-Vitals.",
        "<b>Hero:</b> background video, \"LIVE LIKE A LION,\" iPad mock-up, and PDF cover all compete. No single \"do this next\" button.",
        "<b>Press logo bar:</b> strong — keep it, just lazy-load.",
        "<b>Testimonial cards:</b> readable but old-style portrait cutouts look dated. Modern: monochrome/duotone + bold pull-quote.",
        "<b>Before/After grid:</b> 18 pairs = 36 images loaded individually. Cluster into a lightbox gallery.",
        "<b>Footer:</b> sparse. Missing sitemap links, address/phone, social icons, legal pages, email capture.",
        "<b>Language switcher modal:</b> opens automatically and covers hero on first visit — disable the auto-popup.",
    ], styles))

    S.append(Spacer(1, 2 * mm))
    ux_issues = [
        ("No primary CTA above the fold", "HIGH",
         "Only CTA on first load is a phone number in the top bar. No \"Apply to Train,\" \"Book Consultation,\" or \"Start Here.\"",
         "Add a persistent header CTA, a hero CTA, and a sticky mobile bar (Call + Book). Point them at a single application form."),
        ("Mobile menu uses theme default \"Select Page\"", "MEDIUM",
         "On narrow viewports the nav collapses into placeholder text \"Select Page.\"",
         "Customize the mobile nav label; swap for a hamburger icon; consider bottom nav bar on mobile."),
        ("Form friction & trust signals unverified", "MEDIUM",
         "Contact page is the single funnel; spam protection, response-time, and privacy note not confirmed.",
         "3-field application (Name, Email, Goal) + reCAPTCHA v3 + response-time guarantee + auto welcome email with a calendar link."),
    ]
    for title, sev, found, fix in ux_issues:
        S.append(severity_row(title, sev, styles))
        t = Table([
            [Paragraph("<b>What we found</b>", styles["TableCell"]),
             Paragraph(found, styles["TableCell"])],
            [Paragraph("<b>How to fix</b>", styles["TableCell"]),
             Paragraph(fix, styles["TableCell"])],
        ], colWidths=[35 * mm, 135 * mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), LIGHT),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -1), 0.25, RULE),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        S.append(t)
        S.append(Spacer(1, 2 * mm))

    S.append(PageBreak())

    # A7 Performance & CWV
    S.append(Paragraph("A7  Performance & Core Web Vitals", styles["H2"]))
    S.append(Paragraph(
        "Synthetic PageSpeed Insights wasn't available here, but the markup reveals clear performance debt. "
        "Estimates below are derived from observed HTML.", styles["Body"]))
    S.append(Spacer(1, 2 * mm))

    cwv_rows = [
        ["LCP", "3.5–5.0s", "≤ 2.5s", "Hero video + unoptimized JPEGs + duplicate image markup."],
        ["INP", "200–400ms", "≤ 200ms", "WordPress + plugins (TranslatePress, FB Pixel, theme JS)."],
        ["CLS", "0.15–0.30", "≤ 0.10", "SVG placeholders swapping to real images shifts layout."],
        ["TTFB", "500–900ms", "≤ 600ms", "Shared hosting + no confirmed full-page cache."],
    ]
    S.append(data_table(["Metric", "Estimated", "Target", "Root cause"], cwv_rows, styles,
                        [20 * mm, 30 * mm, 25 * mm, 95 * mm]))

    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph("Concrete performance wins", styles["H3"]))
    S.extend(para_list([
        "<b>Replace hero background video</b> with a 10-sec looped MP4 < 1 MB (or static hero with click-to-play).",
        "<b>Compress &amp; convert images</b> to WebP/AVIF. 100–200 KB per hero, 40–80 KB per thumbnail.",
        "<b>Enable page caching</b> + Redis object cache (WP Rocket or LiteSpeed Cache).",
        "<b>Put Cloudflare in front</b> (free tier) for CDN, HTTP/3, WebP, Brotli.",
        "<b>Defer non-critical JS</b>: Facebook Pixel, TranslatePress auto-detect, chat widgets.",
        "<b>Prune unused plugins</b> — target 8–12 active plugins.",
        "<b>Upgrade PHP to 8.2+</b> — typical 15–25% server-side boost.",
        "<b>Set explicit width/height</b> on every &lt;img&gt; so CLS drops.",
    ], styles))

    S.append(PageBreak())

    # A8 Local / A11y / i18n
    S.append(Paragraph("A8  Local SEO · Accessibility · International", styles["H2"]))

    S.append(Paragraph("Local SEO (South Florida)", styles["H3"]))
    S.append(Paragraph(
        "Phone number <b>954-424-8584</b> is a Broward County area code, suggesting the practice is near "
        "Pembroke Pines. Yet the site exposes <b>none</b> of the local signals Google needs. Competitors "
        "(FitnessTrainer, Thumbtack, Crunch, Freakin Fitness, Planet Fitness, Exercise Coach) dominate the SERP today.",
        styles["Body"]))
    S.extend(para_list([
        "Missing: NAP block, LocalBusiness JSON-LD, embedded Google Map, location landing pages, GBP link.",
        "<b>Action plan:</b> Claim / optimise Google Business Profile (Personal Trainer). Add NAP to footer on every page. "
        "Publish one city landing page per metro. Build citations (Yelp, YellowPages, Thumbtack, BBB, LinkedIn). "
        "Earn local backlinks (South Florida Chamber, local podcasts, Miami/Fort Lauderdale business journals).",
    ], styles))

    S.append(Paragraph("Accessibility (WCAG 2.2)", styles["H3"]))
    S.extend(para_list([
        "<b>Alt text:</b> many images use subject's name; decorative/logo images should have alt=\"\"; before/after should describe transformation.",
        "<b>Headings:</b> duplicate H2s without H1 context on some pages — screen reader navigation breaks.",
        "<b>Color contrast:</b> gold-on-cream copy fails 4.5:1 in places.",
        "<b>Keyboard navigation:</b> mobile nav and language modal need visible focus + ESC-to-close.",
        "<b>Forms:</b> programmatic &lt;label for=...&gt; instead of placeholder-only labels.",
        "<b>Video:</b> hero background video needs aria-hidden=\"true\"; BB3 TV videos need captions.",
        "<b>Language attribute:</b> each translated page must set &lt;html lang=\"xx\"&gt; correctly.",
        "<b>Quick wins:</b> axe DevTools + WAVE scan + fix top 20 findings; \"Skip to main content\" link; 44×44 px minimum tap targets.",
    ], styles))

    S.append(Paragraph("International / Multi-language", styles["H3"]))
    S.extend(para_list([
        "8 languages served (en, zh, nl, fr, de, it, ja, pt-BR, es). Either a major asset or a duplicate-content liability.",
        "<b>Audit translation quality:</b> TranslatePress defaults to machine translation — have a human review or disable.",
        "<b>Confirm hreflang</b> on every page pair; translate titles/meta too, not just body.",
        "<b>Consider pruning</b> to 2–3 languages where Billy actually gets clients (likely EN, ES, PT given South Florida).",
    ], styles))

    S.append(PageBreak())

    # ============================================================
    #  PART B — GA4 AUDIT
    # ============================================================
    S.append(section_banner("GA4 Analytics Audit",
                            "Last 90 days · 2026-01-24 → 2026-04-22 · Property 394194095", "B", styles))
    S.append(Spacer(1, 6 * mm))

    S.append(Paragraph("B1  Executive summary", styles["H2"]))
    ga4_kv = [
        ("Sessions", "<b>11,036</b>"),
        ("Active users", "6,863"),
        ("New users", "6,806 (98.9% of active users)"),
        ("Page views", "18,262"),
        ("Pages / session", "1.65"),
        ("Engagement rate", "51.8%"),
        ("Bounce rate", "48.2%"),
        ("Avg session duration", "4:02 (241.9s)"),
        ("Total events", "67,951"),
        ("<b>Conversions (key events)</b>", '<font color="#B00020"><b>0</b></font>'),
    ]
    S.append(kv_table(ga4_kv, styles))

    S.append(Spacer(1, 4 * mm))
    S.append(Paragraph("Three things that matter most", styles["H3"]))
    S.extend(para_list([
        "<b>Traffic collapsed ~80% in the last 28 days.</b> Sessions fell from <b>8,327</b> (Feb 27 – Mar 26) to "
        "<b>1,771</b> (Mar 27 – Apr 23). This is the headline finding — everything else is secondary.",
        "<b>Zero configured conversions.</b> Rich engagement events exist (form_submit: 2,498; file_download: 10,833) "
        "but none are marked as <b>key events</b>, so every conversions cell is 0. Attribution and ROI are impossible today.",
        "<b>One referrer (bb3nextlevel.com) drives 25% of all sessions.</b> When it quiets, total traffic drops — which is "
        "exactly what happened in the 28-day cliff.",
    ], styles))

    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph("28-day cliff (previous vs last)", styles["H3"]))
    trend = [
        ["Sessions", "8,327", "1,771", "−78.7%"],
        ["Active users", "5,165", "1,001", "−80.6%"],
        ["New users", "5,137", "752", "−85.4%"],
        ["Page views", "13,450", "2,870", "−78.7%"],
        ["Engagement rate", "54.6%", "41.2%", "−13.4 pp"],
        ["Avg session duration", "3:53", "4:51", "+25%"],
    ]
    S.append(data_table(
        ["Metric", "Prev 28d (Feb 27–Mar 26)", "Last 28d (Mar 27–Apr 23)", "Δ"],
        trend, styles,
        [45 * mm, 45 * mm, 45 * mm, 35 * mm], numeric_cols=[1, 2, 3]))
    S.append(Spacer(1, 2 * mm))
    S.append(Paragraph(
        "<b>Interpretation.</b> The earlier window contained a 2026-03-15 spike that GSC also registered "
        "(455 clicks, 29% CTR that day vs ~10/day baseline) plus heavy bb3nextlevel.com referral volume. That "
        "promotion/event ended; what remains is the steady-state baseline — smaller but slightly more engaged "
        "(longer sessions, fewer drive-by hits).",
        styles["Body"]))

    S.append(PageBreak())

    # B2 Channels / sources / devices / geo
    S.append(Paragraph("B2  Channels, sources, devices & geography", styles["H2"]))
    S.append(Paragraph("Default channel grouping (90d)", styles["H3"]))
    ch_rows = [
        ["Direct", "6,649", "4,940", "51.4%", "60.3%"],
        ["Referral", "2,763", "1,207", "42.2%", "25.0%"],
        ["Organic Search", "1,709", "1,286", "63.1%", "15.5%"],
        ["Organic Social", "161", "151", "52.2%", "1.5%"],
        ["Unassigned", "35", "35", "8.6%", "0.3%"],
        ["Organic Video", "11", "2", "54.5%", "0.1%"],
    ]
    S.append(data_table(
        ["Channel", "Sessions", "Users", "Engagement", "Share"], ch_rows, styles,
        [40 * mm, 28 * mm, 25 * mm, 35 * mm, 30 * mm], numeric_cols=[1, 2, 3, 4]))

    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph("Top sources (90d)", styles["H3"]))
    src_rows = [
        ["(direct) / (none)", "6,649", "51.4%"],
        ["bb3nextlevel.com / referral", "2,687", "42.1%"],
        ["google / organic", "1,552", "63.0%"],
        ["bing / organic", "69", "73.9%"],
        ["m.facebook.com / referral", "48", "50.0%"],
        ["ig / social", "40", "62.5%"],
        ["facebook.com / referral", "32", "31.3%"],
        ["yahoo / organic", "32", "62.5%"],
        ["duckduckgo / organic", "31", "54.8%"],
        ["dropbox.com / referral", "19", "47.4%"],
    ]
    S.append(data_table(
        ["Source / Medium", "Sessions", "Engagement"], src_rows, styles,
        [90 * mm, 35 * mm, 35 * mm], numeric_cols=[1, 2]))

    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph("Observations", styles["H3"]))
    S.extend(para_list([
        "<b>Referral concentration risk:</b> bb3nextlevel.com alone = 25% of all sessions. Five Facebook sub-domains "
        "(m./lm./l./facebook.com + <i>ig</i>) counted separately — consolidating would give Meta ~6%, not 1–2%.",
        "<b>Organic search has the highest engagement</b> (63%) — higher than Direct (51%) or Referral (42%). Yet only 15% of traffic. Under-developed channel.",
        "<b>Direct at 60% is implausibly high.</b> Most \"Direct\" is probably untagged email, SMS, or dark social. Start UTM-tagging every outbound link.",
        "<b>No Paid Search, no Email, no Display</b> shows any traffic. Either nothing is spent or UTM tagging is missing.",
    ], styles))

    S.append(PageBreak())
    S.append(Paragraph("Device & geography (90d)", styles["H3"]))
    dev_rows = [
        ["desktop", "5,947", "3,240", "45.2%", "54.8%", "4:14"],
        ["mobile", "5,161", "3,544", "56.6%", "43.4%", "3:05"],
        ["tablet", "179", "85", "50.3%", "49.7%", "18:59"],
    ]
    S.append(data_table(
        ["Device", "Sessions", "Users", "Engagement", "Bounce", "Avg duration"],
        dev_rows, styles,
        [25 * mm, 28 * mm, 25 * mm, 32 * mm, 25 * mm, 35 * mm],
        numeric_cols=[1, 2, 3, 4, 5]))

    S.append(Spacer(1, 3 * mm))
    ctry_rows = [
        ["United States", "5,154", "3,070"],
        ["Canada", "1,116", "597"],
        ["United Kingdom", "755", "446"],
        ["Australia", "655", "348"],
        ["Germany", "415", "243"],
        ["China (likely bots)", "395", "395"],
        ["Netherlands", "206", "125"],
        ["Japan", "201", "152"],
        ["New Zealand", "170", "94"],
        ["Singapore", "162", "157"],
    ]
    S.append(data_table(
        ["Country", "Sessions", "Users"], ctry_rows, styles,
        [70 * mm, 45 * mm, 45 * mm], numeric_cols=[1, 2]))
    S.append(Spacer(1, 2 * mm))
    S.append(Paragraph(
        "<b>China anomaly:</b> 395 sessions with exactly 395 users — 1 session per user is a bot signature. "
        "Add a country-based filter or exclude from dashboards.", styles["Body"]))

    S.append(PageBreak())

    # B3 Pages / events
    S.append(Paragraph("B3  Pages, landings, events", styles["H2"]))
    S.append(Paragraph("Top pages by views (90d)", styles["H3"]))
    pg_rows = [
        ["/30-day-training-challenge-thank-you/", "4,151", "2,385", "66.3%", "5:15"],
        ["/upw/", "3,296", "2,504", "61.4%", "1:14"],
        ["/", "1,555", "1,138", "68.4%", "1:29"],
        ["/UPW/ (case-variant duplicate)", "1,536", "1,109", "50.7%", "3:02"],
        ["/coaching/", "705", "528", "86.3%", "2:00"],
        ["/billy-beck-iii/", "593", "500", "94.0%", "0:44"],
        ["/lifeforcethankyou/", "544", "288", "71.6%", "4:17"],
        ["/tony/", "411", "351", "78.5%", "1:16"],
        ["/physical-training/the-gauntlet-burn-fat-fast-workout/", "349", "224", "55.8%", "2:08"],
        ["/testimonials/", "251", "209", "95.2%", "1:40"],
    ]
    S.append(data_table(
        ["Page", "Views", "Users", "Engagement", "Avg duration"], pg_rows, styles,
        [80 * mm, 20 * mm, 20 * mm, 25 * mm, 25 * mm], numeric_cols=[1, 2, 3, 4]))

    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph("Landing page issues", styles["H3"]))
    S.extend(para_list([
        "<b>Case-variant duplication:</b> /upw/ + /UPW/ = 4,832 views; /tony/ + /Tony/ = 492 views. "
        "Same page, split metrics. Server-side 301 to lowercase OR GA4 Modify Event rule.",
        "<b>Thank-you page outranks the homepage.</b> /30-day-training-challenge-thank-you (4,151 views) > / (1,555 views). "
        "Probably used as a gated content delivery URL — verify.",
        "<b>1,066 sessions have (not set) landing page</b> with 87.2% bounce. Tagging gap — audit the GA4 tag on every entry point.",
        "<b>/404.html gets 184 views and 121 organic landings.</b> Dead URLs are being linked to — find and redirect.",
    ], styles))

    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph("Events (90d)", styles["H3"]))
    ev_rows = [
        ["page_view", "18,262"],
        ["session_start", "11,359"],
        ["file_download", "10,833"],
        ["user_engagement", "9,456"],
        ["first_visit", "6,806"],
        ["scroll", "6,035"],
        ["form_submit", "2,498"],
        ["form_start", "2,436"],
        ["click (outbound)", "234"],
        ["view_search_results", "32"],
    ]
    S.append(data_table(["Event", "Count"], ev_rows, styles,
                        [70 * mm, 40 * mm], numeric_cols=[1]))
    S.append(Spacer(1, 2 * mm))
    S.append(Paragraph(
        "<b>File downloads are the most meaningful business signal</b> — 10,833 in 90d, roughly one per session. "
        "Lead magnets (<i>Final-Life-Force-Beg-Plan.pdf</i>, <i>Final-Life-Force-Advanced-Plan-Male.pdf</i>) are the primary conversion mechanic. "
        "<b>form_submit (2,498) &gt; form_start (2,436)</b> — reconcile trigger setup. "
        "<b>click event at 234 is suspiciously low</b> — Enhanced Measurement outbound click tracking is likely off.",
        styles["Body"]))

    S.append(PageBreak())

    # B4 Data-quality
    S.append(Paragraph("B4  Data-quality & tracking issues", styles["H2"]))
    dq_rows = [
        ["1", "0 key events configured", "HIGH", "Mark form_submit and file_download as key events in GA4 Admin."],
        ["2", "/upw/ and /UPW/ tracked as separate pages", "HIGH",
         "Modify Event rule lowercasing page_location, or server 301 upper→lower."],
        ["3", "(not set) landing page = 1,066 sessions", "HIGH", "Audit pages missing the GA4 tag; fix thank-you redirects and iframes."],
        ["4", "bb3nextlevel.com counted as referral", "MEDIUM", "Add to Unwanted referrals in data stream settings."],
        ["5", "Facebook split across 5 sub-domains", "MEDIUM", "Custom channel group: *.facebook.com + ig + instagram.com → \"Social - Meta\"."],
        ["6", "Direct at 60% is implausibly high", "MEDIUM", "UTM-tag every email/SMS/social-bio link."],
        ["7", "China: 395 sessions = 395 users (bots)", "LOW", "Country-based filter or exclude from reports."],
        ["8", "form_submit > form_start", "LOW", "Reconcile form trigger setup (one embed not firing form_start)."],
        ["9", "click event = 234 in 90d", "LOW", "Enable Enhanced Measurement → Outbound clicks on the web stream."],
        ["10", "25% of sessions from one referrer", "STRATEGIC", "Diversify acquisition — see Part D."],
    ]
    S.append(data_table(
        ["#", "Finding", "Severity", "Fix"], dq_rows, styles,
        [8 * mm, 60 * mm, 22 * mm, 80 * mm]))

    S.append(PageBreak())

    # ============================================================
    #  PART C — GSC AUDIT
    # ============================================================
    S.append(section_banner("Google Search Console Audit",
                            "Last 90 days · 2026-01-23 → 2026-04-22 · sc-domain:billybeck.com", "C", styles))
    S.append(Spacer(1, 6 * mm))

    S.append(Paragraph("C1  Executive summary", styles["H2"]))
    gsc_kv = [
        ("Total clicks", "<b>1,400</b>"),
        ("Total impressions", "106,024"),
        ("Average CTR", "1.32%"),
        ("Average position", "6.8"),
        ("Indexed URLs (per sitemap)", "6,444"),
    ]
    S.append(kv_table(gsc_kv, styles))
    S.append(Spacer(1, 3 * mm))

    S.append(Paragraph("Three things that matter most", styles["H3"]))
    S.extend(para_list([
        "<b>The site over-indexes heavily on brand queries.</b> Top 10 queries by clicks are all brand/brand-adjacent "
        "(\"billy beck trainer,\" \"billybeck.com/upw,\" \"billy beck iii,\" \"billy beck tony robbins\"). "
        "Almost no non-brand organic acquisition.",
        "<b>Massive ranking, terrible CTR on informational content.</b> "
        "/effective-eating/5-highly-effective-nutrition-rules-* ranks position <b>3.2</b> with <b>51,017 impressions</b> "
        "yet only <b>36 clicks</b> (0.07% CTR). Roughly 3% of potential capture. SERP-feature problem or catastrophic title/meta mismatch.",
        "<b>Two sitemaps submitted, including an HTTP variant that shouldn't exist.</b> Both report warnings (2 and 5). "
        "The HTTP duplicate should be removed.",
    ], styles))

    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph("Performance trend", styles["H3"]))
    S.extend(para_list([
        "<b>Jan 23 – Feb 13:</b> impression spikes (3k–11k/day) with 0.2–0.3% CTR — a page ranked briefly for a high-volume non-brand query.",
        "<b>Feb 14 – Mar 14:</b> quiet baseline, ~8 clicks/day, CTR ~1.5%, avg pos ~10.",
        "<b>Mar 15 – Apr 22:</b> 2026-03-15 single-day burst (455 clicks, 29% CTR), then ~10 clicks/day at ~8 avg pos.",
        "<b>Last 4 weeks look normal</b> — 8–17 clicks/day, no ranking collapse.",
    ], styles))

    S.append(PageBreak())

    # C2 Queries / pages
    S.append(Paragraph("C2  Top queries & pages", styles["H2"]))
    S.append(Paragraph("Top 10 queries (90d) — 100% brand", styles["H3"]))
    q_rows = [
        ["billy beck trainer", "90", "183", "49.2%", "1.6"],
        ["billybeck.com/upw", "80", "107", "74.8%", "1.0"],
        ["billy beck", "74", "3,199", "2.3%", "9.1"],
        ["billy beck iii", "56", "184", "30.4%", "3.9"],
        ["billybeck/upw", "44", "53", "83.0%", "1.0"],
        ["billy beck upw", "39", "48", "81.3%", "1.0"],
        ["billy beck/tony", "37", "64", "57.8%", "1.0"],
        ["billy beck tony robbins", "28", "81", "34.6%", "7.9"],
        ["billybeck", "27", "48", "56.3%", "1.0"],
        ["billybeck.com", "21", "37", "56.8%", "1.0"],
    ]
    S.append(data_table(
        ["Query", "Clicks", "Impressions", "CTR", "Pos"], q_rows, styles,
        [60 * mm, 22 * mm, 28 * mm, 22 * mm, 18 * mm], numeric_cols=[1, 2, 3, 4]))

    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph("Observations", styles["H3"]))
    S.extend(para_list([
        "<b>\"billy beck\" is not owning its own SERP</b> — 3,199 impressions at position 9.1, 2.3% CTR. A name search should rank pos 1–2 with 40%+ CTR.",
        "<b>\"billy beck iii\"</b> ranks 3.9 with 30% CTR — better but still not #1 for a full-name query.",
        "<b>URL-shaped queries</b> (billybeck.com/upw, billybeck/upw) deliver 60–80% CTR — offline-to-organic leakage from stage/handout mentions.",
    ], styles))

    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph("Top pages by clicks (90d)", styles["H3"]))
    p_rows = [
        ["/upw", "388", "2,572", "15.1%", "6.8"],
        ["/", "313", "4,265", "7.3%", "5.0"],
        ["/tony", "128", "836", "15.3%", "6.7"],
        ["/effective-eating/5-highly-effective-nutrition-rules-*", "36", "51,017", "0.07%", "3.2"],
        ["/mental-conditioning/the-rice-experiment-*", "36", "9,486", "0.4%", "8.9"],
        ["Final-Life-Force-Beg-Plan.pdf", "21", "286", "7.3%", "8.0"],
        ["/de/", "20", "327", "6.1%", "8.6"],
        ["/living-it/expert-personal-trainer-interview-with-gregg-avedon", "17", "542", "3.1%", "6.3"],
        ["/nl/.../het-rijst-experiment-*", "17", "852", "2.0%", "6.4"],
        ["/uncategorized/upw-30-day-training-challenge-emails", "16", "483", "3.3%", "3.3"],
    ]
    S.append(data_table(
        ["Page", "Clicks", "Impressions", "CTR", "Pos"], p_rows, styles,
        [85 * mm, 18 * mm, 25 * mm, 20 * mm, 15 * mm], numeric_cols=[1, 2, 3, 4]))

    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph(
        "<b>The 51k-impression problem.</b> /effective-eating/5-highly-effective-nutrition-rules-* earns 51,017 impressions "
        "at position 3.2 but only 36 clicks (0.07% CTR). At 15% CTR this page would earn ~7,650 clicks/quarter — "
        "roughly <b>5× the entire site's current organic click total</b>. Likely cause: SERP feature placement (People "
        "Also Ask, video carousel) where the click goes elsewhere, OR a catastrophic title/meta mismatch. Manually "
        "inspect the SERP for the driving query.",
        styles["Body"]))

    S.append(PageBreak())

    # C3 Devices / countries / sitemaps
    S.append(Paragraph("C3  Devices, geography & sitemaps", styles["H2"]))
    S.append(Paragraph("Device (90d)", styles["H3"]))
    gdev = [
        ["MOBILE", "900 (64.3%)", "72,774 (68.6%)", "1.24%", "5.0"],
        ["DESKTOP", "488 (34.9%)", "30,558 (28.8%)", "1.60%", "11.3"],
        ["TABLET", "12 (0.9%)", "2,692 (2.5%)", "0.45%", "5.6"],
    ]
    S.append(data_table(
        ["Device", "Clicks", "Impressions", "CTR", "Pos"], gdev, styles,
        [30 * mm, 35 * mm, 45 * mm, 25 * mm, 20 * mm], numeric_cols=[1, 2, 3, 4]))
    S.append(Spacer(1, 2 * mm))
    S.append(Paragraph(
        "Mobile = 64% of clicks, 69% of impressions, <b>position 5.0</b> vs desktop's 11.3. The site is a mobile "
        "discovery surface. Continue optimizing for mobile SERPs.", styles["Body"]))

    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph("Top countries (90d)", styles["H3"]))
    gctry = [
        ["USA", "592 (42%)", "22,080", "2.68%", "9.3"],
        ["CAN", "115", "8,754", "1.31%", "4.4"],
        ["GBR", "100", "21,008", "0.48%", "3.9"],
        ["AUS", "78", "6,204", "1.26%", "3.8"],
        ["JPN", "77", "2,384", "3.23%", "9.5"],
        ["DEU", "63", "4,545", "1.39%", "10.0"],
        ["NLD", "40", "2,022", "1.98%", "12.3"],
        ["ITA", "32", "2,136", "1.50%", "15.1"],
        ["FRA", "28", "1,321", "2.12%", "12.8"],
        ["ESP", "20", "1,780", "1.12%", "19.8"],
        ["IRL", "14", "14,843", "0.09%", "3.2"],
    ]
    S.append(data_table(
        ["Country", "Clicks", "Impressions", "CTR", "Pos"], gctry, styles,
        [30 * mm, 28 * mm, 28 * mm, 22 * mm, 22 * mm], numeric_cols=[1, 2, 3, 4]))
    S.append(Spacer(1, 2 * mm))
    S.append(Paragraph(
        "<b>IRL</b> delivers 14,843 impressions at pos 3.2 with 0.09% CTR — same root cause as the nutrition-rules "
        "page leaking into Ireland. <b>JPN</b> and <b>DEU</b> convert at 2–3× the UK/IRL rates — translation program earning its keep.",
        styles["Body"]))

    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph("Submitted sitemaps", styles["H3"]))
    sm = [
        ["https://www.billybeck.com/sitemap_index.xml", "2026-04-22", "Has warnings", "6,444", "0", "2"],
        ["http://www.billybeck.com/sitemap.xml", "2026-04-15", "Has warnings", "6,444", "0", "5"],
    ]
    S.append(data_table(
        ["Path", "Last downloaded", "Status", "Indexed", "Errors", "Warnings"], sm, styles,
        [65 * mm, 25 * mm, 25 * mm, 18 * mm, 15 * mm, 22 * mm], numeric_cols=[3, 4, 5]))
    S.append(Spacer(1, 2 * mm))
    S.extend(para_list([
        "<b>HTTP sitemap shouldn't be submitted</b> — the site serves HTTPS. Delete the http:// one from GSC.",
        "Both sitemaps use <b>www.billybeck.com</b> but the pages return as <b>billybeck.com</b> (no www). Consolidate canonical host.",
        "<b>6,444 indexed URLs is a lot</b> for ~100 real pages. Suspect heavy pagination, tag/category/author archives, feed URLs, attachment pages, and 8× multilingual duplicates.",
        "<b>Target state:</b> 300–500 intentional indexed URLs. Everything else: <code>noindex</code>.",
    ], styles))

    S.append(PageBreak())

    # C4 Top issues
    S.append(Paragraph("C4  Top issues", styles["H2"]))
    top_rows = [
        ["1", "/effective-eating/5-highly-effective-nutrition-rules-* — 51k imp, 36 clicks, pos 3.2",
         "CRITICAL", "Manual SERP inspection; fix title/meta; confirm whether it's a People Also Ask placement."],
        ["2", "100% brand share in top 10 queries", "HIGH", "Non-brand content strategy (see Part D)."],
        ["3", "\"billy beck\" name search ranks pos 9", "HIGH", "SERP audit; fix entity signals, schema, consistency."],
        ["4", "2 sitemaps submitted including HTTP variant", "HIGH", "Delete HTTP sitemap; resolve 2 warnings on HTTPS."],
        ["5", "/mental-conditioning/the-rice-experiment-* — 9.5k imp, 0.4% CTR at pos 8.9", "HIGH", "Retitle; English underperforms its own translations."],
        ["6", "\"gregg avedon\" — pos 2.4, 1 click on 443 imp", "MEDIUM", "Retitle /living-it/expert-personal-trainer-interview-with-gregg-avedon."],
        ["7", "URL-shaped brand queries leaking offline-to-organic", "MEDIUM", "Add /go short link with UTMs."],
        ["8", "6,444 indexed URLs on ~100 core pages", "MEDIUM", "noindex low-value archives (tag, page, author, feed, attachment)."],
        ["9", "Multilingual CTR on DE/JP/NL > English baseline", "OPPORTUNITY", "Back-port translation titles to English; expand high-performing translations."],
        ["10", "IRL country: 14,843 imp, 0.09% CTR", "LOW", "Same root cause as #1."],
    ]
    S.append(data_table(
        ["#", "Finding", "Severity", "Fix"], top_rows, styles,
        [8 * mm, 70 * mm, 25 * mm, 67 * mm]))

    S.append(PageBreak())

    # ============================================================
    #  PART D — Unified Action Plan
    # ============================================================
    S.append(section_banner("Unified 90-Day Action Plan",
                            "Combines site, GA4 and GSC findings · impact × effort × evidence", "D", styles))
    S.append(Spacer(1, 6 * mm))

    S.append(Paragraph("D1  Week 1–2 · Foundation (tracking truth + quick wins)", styles["H3"]))
    wk12 = [
        ["Mark form_submit + file_download as GA4 key events",
         "HIGH", "Low", "GA4: 0 conversions today"],
        ["Add bb3nextlevel.com to GA4 Unwanted referrals",
         "HIGH", "Low", "25% of sessions falsely restart on cross-domain"],
        ["Enable Enhanced Measurement → Outbound clicks + Site search",
         "HIGH", "Low", "click event = 234/90d, PDF-heavy site"],
        ["Fix www vs apex domain; one canonical host via 301",
         "HIGH", "Low", "Audit: mixed domain, split link equity"],
        ["Run WP-CLI search-replace to remove //wp-content// double-slash URLs",
         "HIGH", "Low", "Audit: double-slash asset paths"],
        ["Delete the http:// sitemap from GSC; resolve HTTPS sitemap warnings",
         "HIGH", "Low", "GSC: 2 sitemaps submitted, one obsolete"],
        ["Fix /upw vs /UPW case duplication (server 301 or GA4 Modify Event)",
         "HIGH", "Low", "GA4: 4,832 views split across two paths"],
        ["Write real meta titles + descriptions for 8 top pages",
         "HIGH", "Low", "Audit: generic or missing metas"],
        ["Generate & submit XML sitemap; link from robots.txt",
         "HIGH", "Low", "Audit: no sitemap directive"],
        ["Add a real primary CTA in the header (\"Apply to Train\")",
         "HIGH", "Low", "Audit: phone-only CTA, no funnel"],
        ["Claim / optimize Google Business Profile; request 10 reviews",
         "HIGH", "Low", "Audit: zero local signals"],
        ["Disable auto-popup language switcher",
         "MEDIUM", "Low", "Audit: modal covers hero on first paint"],
    ]
    S.append(data_table(
        ["Action", "Impact", "Effort", "Evidence / source"], wk12, styles,
        [80 * mm, 18 * mm, 18 * mm, 54 * mm]))

    S.append(Spacer(1, 4 * mm))
    S.append(Paragraph("D2  Week 3–6 · Rebuild (medium effort, big payoff)", styles["H3"]))
    wk36 = [
        ["Add JSON-LD: Person, LocalBusiness, Book, VideoObject, Review, BreadcrumbList",
         "HIGH", "Medium", "Audit: zero schema detected"],
        ["Fix the 51k-impression nutrition-rules page (title, meta, H1 alignment)",
         "HIGH", "Medium", "GSC: 51,017 imp, 0.07% CTR at pos 3.2"],
        ["Retitle the Gregg Avedon interview and the rice-experiment page",
         "HIGH", "Medium", "GSC: high rank, terrible CTR"],
        ["Compress & convert all images to WebP; set width/height",
         "HIGH", "Medium", "Audit: LCP 3.5–5s, unoptimized JPEGs"],
        ["Install caching + Cloudflare CDN in front of the site",
         "HIGH", "Medium", "Audit: TTFB 500–900ms"],
        ["Rebuild homepage H1 + hero CTA; sticky mobile CTA bar",
         "HIGH", "Medium", "Audit: generic H1, no primary CTA"],
        ["Launch lead magnet funnel (7 Essential Factors) + 5–7 email welcome sequence",
         "HIGH", "Medium", "GA4: file_download already top event"],
        ["Create /coaching page with clear tiers + pricing logic",
         "HIGH", "Medium", "Audit: offer unclear"],
        ["Audit the 1,066 (not set) landing-page sessions — find the tagging gap",
         "HIGH", "Medium", "GA4: 9.6% of sessions untracked"],
        ["Publish 1 pillar article (\"Training Over 40\" or similar)",
         "HIGH", "Medium", "Audit: no non-brand content targeting"],
        ["Add hreflang + translate metadata across all 8 languages (or prune to 3)",
         "MEDIUM", "Medium", "Audit: 8 languages, no hreflang confirmed"],
        ["Start UTM discipline on every email / bb3nextlevel outbound / social bio link",
         "MEDIUM", "Low", "GA4: Direct 60% is implausibly high"],
    ]
    S.append(data_table(
        ["Action", "Impact", "Effort", "Evidence / source"], wk36, styles,
        [80 * mm, 18 * mm, 18 * mm, 54 * mm]))

    S.append(PageBreak())

    S.append(Paragraph("D3  Week 7–12 · Scale (longer horizon)", styles["H3"]))
    wk712 = [
        ["Launch 3 city landing pages (Pembroke Pines, Fort Lauderdale, Miami)",
         "HIGH", "High", "Audit: zero local SEO surface"],
        ["Convert top 6 testimonials into full case-study pages",
         "HIGH", "High", "Audit: deep archive, no case depth"],
        ["Build press / \"Featured In\" page with real outbound links",
         "MEDIUM", "Medium", "Audit: press logos un-clickable"],
        ["Start weekly newsletter (\"Monday Lion Mail\")",
         "HIGH", "Medium", "GA4: file_download conversions already strong"],
        ["Repurpose BB3 TV into 2 YouTube Shorts + 2 Reels per week",
         "HIGH", "High", "Audit: video hub thin; GA4: Organic Social only 1.5%"],
        ["Brand-defense Google Ads + $5/day Meta retargeting to lead magnet",
         "MEDIUM", "Low", "GSC: brand share 100%; need to protect SERP"],
        ["Pitch 3 podcasts per month; track backlinks won",
         "HIGH", "Medium", "Audit: authority piggyback cluster un-tapped"],
        ["Full accessibility sweep (axe + WAVE); fix top 20 issues",
         "MEDIUM", "Medium", "Audit: contrast, form labels, focus rings"],
        ["Audit the 6,444 indexed URLs; noindex low-value archives",
         "MEDIUM", "Medium", "GSC: index bloat"],
        ["Looker Studio dashboard combining GA4 + GSC",
         "HIGH", "Low", "No single source of truth today"],
        ["Quarterly review: rankings, CWV, conversion rate, list growth",
         "HIGH", "Low", "Cadence"],
    ]
    S.append(data_table(
        ["Action", "Impact", "Effort", "Evidence / source"], wk712, styles,
        [80 * mm, 18 * mm, 18 * mm, 54 * mm]))

    S.append(Spacer(1, 6 * mm))
    S.append(Paragraph("D4  Final word", styles["H3"]))
    S.append(Paragraph(
        "billybeck.com is a premium brand on a tired foundation. The authority and social proof are already in "
        "place — most of the growth unlock is technical housekeeping, measurement truth, and one well-designed "
        "funnel. <b>Ship the Week 1–2 list first</b>; the difference in traffic and form fills will show up within "
        "30–45 days. Weeks 3–6 compound it. Weeks 7–12 make the traffic non-brand, diversified, and local.",
        styles["Lead"]))
    S.append(Spacer(1, 5 * mm))
    S.append(Paragraph(
        "<b>Methodology.</b> Part A: HTML crawl of home, about, coaching, testimonials, blog, videos (Apr 22, 2026). "
        "Parts B and C: live API pulls from GA4 Data API (property 394194095) and Search Console API "
        "(sc-domain:billybeck.com) on Apr 23, 2026, window 2026-01-23 → 2026-04-22. "
        "Raw JSON responses preserved locally under C:\\Users\\ASUS\\AppData\\Local\\Temp\\audit\\.",
        styles["Muted"]))

    return S


def build(out_path):
    doc = BaseDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=24 * mm, bottomMargin=15 * mm,
        title="Billy Beck III — Unified Audit",
        author="Prodigy AI",
    )

    frame_cover = Frame(0, 0, A4[0], A4[1], id="cover",
                        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    frame_body = Frame(15 * mm, 15 * mm, A4[0] - 30 * mm, A4[1] - 40 * mm,
                       id="body", leftPadding=0, rightPadding=0,
                       topPadding=4 * mm, bottomPadding=0)

    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=frame_cover, onPage=cover_page),
        PageTemplate(id="Body", frames=frame_body, onPage=header_footer),
    ])

    styles = build_styles()
    story = []
    story.append(Spacer(1, 1))
    story.append(NextPageTemplate("Body"))
    story.append(PageBreak())
    story.extend(make_story(styles))

    doc.build(story)
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    import os
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "billybeck_final_audit.pdf")
    build(out)
