"""Render a single markdown file into a polished PDF (navy/gold aesthetic)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate,
    PageTemplate,
    Frame,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)
from reportlab.pdfgen import canvas

NAVY = colors.HexColor("#0E1726")
GOLD = colors.HexColor("#C9A23A")
INK = colors.HexColor("#1A1A1A")
MUTE = colors.HexColor("#5F6B7A")
LIGHT = colors.HexColor("#F5F6F7")
ROW = colors.HexColor("#F9F9FA")
RULE = colors.HexColor("#E2E4E8")
CODEBG = colors.HexColor("#F1F3F5")


# -----------------------------------------------------------------------------
# page chrome
# -----------------------------------------------------------------------------

def make_header_footer(title: str):
    def draw(canv: canvas.Canvas, doc):
        canv.saveState()
        w, h = A4
        canv.setFillColor(NAVY)
        canv.rect(0, h - 18 * mm, w, 18 * mm, stroke=0, fill=1)
        canv.setFillColor(GOLD)
        canv.rect(0, h - 20 * mm, w, 2 * mm, stroke=0, fill=1)
        canv.setFillColor(colors.white)
        canv.setFont("Helvetica-Bold", 10)
        canv.drawString(15 * mm, h - 12 * mm, title)
        canv.setFont("Helvetica", 9)
        canv.drawRightString(w - 15 * mm, h - 12 * mm, "Prepared Apr 23, 2026")

        canv.setFillColor(MUTE)
        canv.setFont("Helvetica", 8)
        canv.drawString(15 * mm, 10 * mm, "Confidential — billybeck.com")
        canv.drawRightString(w - 15 * mm, 10 * mm, f"Page {doc.page}")
        canv.restoreState()
    return draw


# -----------------------------------------------------------------------------
# styles
# -----------------------------------------------------------------------------

def build_styles():
    ss = getSampleStyleSheet()
    s = {}
    s["Body"] = ParagraphStyle("Body", parent=ss["Normal"], fontName="Helvetica",
                               fontSize=9.5, leading=13, textColor=INK, spaceAfter=4,
                               alignment=TA_JUSTIFY)
    s["BodyLeft"] = ParagraphStyle("BL", parent=s["Body"], alignment=TA_LEFT)
    s["H1"] = ParagraphStyle("H1", parent=ss["Heading1"], fontName="Helvetica-Bold",
                             fontSize=22, leading=26, textColor=NAVY,
                             spaceBefore=0, spaceAfter=8)
    s["H2"] = ParagraphStyle("H2", parent=ss["Heading2"], fontName="Helvetica-Bold",
                             fontSize=15, leading=19, textColor=NAVY,
                             spaceBefore=12, spaceAfter=5)
    s["H3"] = ParagraphStyle("H3", parent=ss["Heading3"], fontName="Helvetica-Bold",
                             fontSize=11.5, leading=15, textColor=NAVY,
                             spaceBefore=10, spaceAfter=3)
    s["H4"] = ParagraphStyle("H4", parent=ss["Heading4"], fontName="Helvetica-Bold",
                             fontSize=10, leading=13, textColor=NAVY,
                             spaceBefore=6, spaceAfter=2)
    s["Bullet"] = ParagraphStyle("Bullet", parent=s["BodyLeft"], leftIndent=10,
                                 bulletIndent=0, spaceAfter=2)
    s["Muted"] = ParagraphStyle("Muted", parent=s["BodyLeft"], fontSize=8.5,
                                leading=11, textColor=MUTE)
    s["Meta"] = ParagraphStyle("Meta", parent=s["BodyLeft"], fontSize=9,
                               leading=12, textColor=MUTE, spaceAfter=2)
    s["Cell"] = ParagraphStyle("Cell", parent=s["BodyLeft"], fontSize=8.5,
                               leading=11, spaceAfter=0)
    s["CellHeader"] = ParagraphStyle("CellH", parent=s["Cell"],
                                     fontName="Helvetica-Bold", textColor=colors.white)
    s["Code"] = ParagraphStyle("Code", parent=s["BodyLeft"], fontName="Courier",
                               fontSize=8.5, leading=11,
                               backColor=CODEBG, borderPadding=6,
                               leftIndent=6, rightIndent=6, spaceAfter=6, spaceBefore=4)
    return s


# -----------------------------------------------------------------------------
# inline transforms
# -----------------------------------------------------------------------------

_RE_CODE = re.compile(r"`([^`]+)`")
_RE_BOLD = re.compile(r"\*\*([^*]+)\*\*")
_RE_ITAL = re.compile(r"(?<!\*)\*([^*]+)\*(?!\*)")
_RE_LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def inline_to_rl(text: str) -> str:
    """Convert markdown inline syntax to reportlab inline tags.

    Order:
      1. Pull out code spans into placeholders so their contents are immune
         to bold/italic/link processing (avoids `*` inside code being treated as italic).
      2. Escape &, <, >.
      3. Apply bold, italic, links.
      4. Re-insert code spans as <font name="Courier">...</font>.
    """
    # 1. extract code spans
    code_spans: list[str] = []

    def _stash(m: re.Match) -> str:
        code_spans.append(m.group(1))
        return f"\x00CODE{len(code_spans) - 1}\x00"

    text = _RE_CODE.sub(_stash, text)

    # 2. escape HTML
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    # 3. bold, italic, links
    text = _RE_BOLD.sub(r"<b>\1</b>", text)
    text = _RE_ITAL.sub(r"<i>\1</i>", text)
    text = _RE_LINK.sub(lambda m: f'<u>{m.group(1)}</u>', text)

    # 4. restore code spans (escape inside them too)
    def _restore(m: re.Match) -> str:
        idx = int(m.group(1))
        body = code_spans[idx]
        body = body.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        return f'<font name="Courier" color="#B00020">{body}</font>'

    text = re.sub(r"\x00CODE(\d+)\x00", _restore, text)
    return text


# -----------------------------------------------------------------------------
# markdown → flowables
# -----------------------------------------------------------------------------

def _strip_align_row(cols: list[str]) -> bool:
    return all(re.fullmatch(r":?-{3,}:?", c.strip()) for c in cols if c.strip())


def _split_row(line: str) -> list[str]:
    # strip leading/trailing pipe, split, trim
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [c.strip() for c in line.split("|")]


def _compute_col_widths(header_cells: list[str], rows: list[list[str]],
                        total_width: float) -> list[float]:
    n = len(header_cells)
    # naive: weight by max content length, floor 14mm
    maxlen = [max(len(header_cells[i]),
                  *(len(r[i]) if i < len(r) else 0 for r in rows)) for i in range(n)]
    total = sum(maxlen) or n
    widths = [max(14 * mm, total_width * (ml / total)) for ml in maxlen]
    # normalize so they sum to total_width
    scale = total_width / sum(widths)
    return [w * scale for w in widths]


def make_table(header: list[str], rows: list[list[str]], styles, total_width) -> Table:
    numeric_cols = set()
    for i in range(len(header)):
        col = [r[i] for r in rows if i < len(r)]
        def looks_num(s: str) -> bool:
            t = s.strip().replace(",", "").replace("%", "").replace("$", "")
            t = t.replace("−", "-").replace("+", "").replace(".", "", 1)
            return bool(t) and t.lstrip("-").isdigit()
        if col and sum(looks_num(c) for c in col) >= max(1, len(col) * 0.6):
            numeric_cols.add(i)

    body = [[Paragraph(inline_to_rl(h), styles["CellHeader"]) for h in header]]
    for r in rows:
        padded = list(r) + [""] * (len(header) - len(r))
        body.append([Paragraph(inline_to_rl(c), styles["Cell"]) for c in padded])

    widths = _compute_col_widths(header, rows, total_width)
    t = Table(body, colWidths=widths, repeatRows=1)
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


def parse_markdown(md: str, styles, total_width: float) -> list:
    story: list = []
    lines = md.splitlines()
    i = 0
    n = len(lines)

    def flush_paragraph(buf: list[str]):
        if not buf:
            return
        txt = " ".join(b.strip() for b in buf).strip()
        if txt:
            story.append(Paragraph(inline_to_rl(txt), styles["Body"]))

    while i < n:
        line = lines[i]
        stripped = line.strip()

        # blank
        if not stripped:
            i += 1
            continue

        # horizontal rule
        if re.fullmatch(r"-{3,}|\*{3,}|_{3,}", stripped):
            story.append(Spacer(1, 2 * mm))
            tbl = Table([[""]], colWidths=[total_width], rowHeights=[0.6])
            tbl.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), RULE),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]))
            story.append(tbl)
            story.append(Spacer(1, 2 * mm))
            i += 1
            continue

        # headings
        m = re.match(r"^(#{1,4})\s+(.*)$", stripped)
        if m:
            level = len(m.group(1))
            text = inline_to_rl(m.group(2).strip())
            style = styles[f"H{min(level, 4)}"]
            story.append(Paragraph(text, style))
            # subtle gold rule under H1
            if level == 1:
                tbl = Table([[""]], colWidths=[40 * mm], rowHeights=[1])
                tbl.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), GOLD),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]))
                story.append(tbl)
                story.append(Spacer(1, 3 * mm))
            i += 1
            continue

        # fenced code block
        if stripped.startswith("```"):
            code_lines = []
            i += 1
            while i < n and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i])
                i += 1
            if i < n:
                i += 1  # closing fence
            code_text = "<br/>".join(
                (l or " ").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                            .replace(" ", "&nbsp;")
                for l in code_lines
            )
            story.append(Paragraph(code_text, styles["Code"]))
            continue

        # table
        if "|" in stripped and i + 1 < n and _strip_align_row(_split_row(lines[i + 1])):
            header = _split_row(lines[i])
            i += 2  # skip header + divider
            rows: list[list[str]] = []
            while i < n and "|" in lines[i].strip():
                rows.append(_split_row(lines[i]))
                i += 1
            story.append(Spacer(1, 1 * mm))
            story.append(make_table(header, rows, styles, total_width))
            story.append(Spacer(1, 2 * mm))
            continue

        # bullet list
        if re.match(r"^[-*]\s+", stripped):
            while i < n and re.match(r"^[-*]\s+", lines[i].strip()):
                item = re.sub(r"^[-*]\s+", "", lines[i].strip())
                # continuation lines (indented)
                j = i + 1
                while j < n and lines[j].startswith(("  ", "\t")) and lines[j].strip():
                    item += " " + lines[j].strip()
                    j += 1
                story.append(Paragraph("• " + inline_to_rl(item), styles["Bullet"]))
                i = j
            story.append(Spacer(1, 1 * mm))
            continue

        # ordered list
        if re.match(r"^\d+\.\s+", stripped):
            while i < n and re.match(r"^\d+\.\s+", lines[i].strip()):
                num_match = re.match(r"^(\d+)\.\s+(.*)", lines[i].strip())
                assert num_match
                item = num_match.group(2)
                j = i + 1
                while j < n and lines[j].startswith(("  ", "\t")) and lines[j].strip():
                    item += " " + lines[j].strip()
                    j += 1
                story.append(Paragraph(f"{num_match.group(1)}.  {inline_to_rl(item)}",
                                       styles["Bullet"]))
                i = j
            story.append(Spacer(1, 1 * mm))
            continue

        # paragraph (accumulate until blank / structural line)
        buf = [line]
        i += 1
        while i < n:
            nxt = lines[i]
            nxts = nxt.strip()
            if not nxts:
                break
            if re.match(r"^(#{1,4})\s+", nxts):
                break
            if nxts.startswith("```"):
                break
            if re.match(r"^[-*]\s+", nxts):
                break
            if re.match(r"^\d+\.\s+", nxts):
                break
            if "|" in nxts and i + 1 < n and _strip_align_row(_split_row(lines[i + 1])):
                break
            if re.fullmatch(r"-{3,}|\*{3,}|_{3,}", nxts):
                break
            buf.append(nxt)
            i += 1
        flush_paragraph(buf)

    return story


# -----------------------------------------------------------------------------
# driver
# -----------------------------------------------------------------------------

def convert(md_path: Path, pdf_path: Path, title: str):
    md = md_path.read_text(encoding="utf-8")

    # strip the first H1 from the doc body (we'll use it as cover) if present
    body_md = md
    first_h1 = re.match(r"^#\s+(.+)\n", body_md)
    subtitle = first_h1.group(1) if first_h1 else title
    if first_h1:
        body_md = body_md[first_h1.end():]

    doc = BaseDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=24 * mm, bottomMargin=15 * mm,
        title=title,
        author="Prodigy AI",
    )
    total_width = A4[0] - 30 * mm

    frame = Frame(15 * mm, 15 * mm, A4[0] - 30 * mm, A4[1] - 40 * mm,
                  id="body", leftPadding=0, rightPadding=0,
                  topPadding=4 * mm, bottomPadding=0)
    doc.addPageTemplates([
        PageTemplate(id="Body", frames=frame, onPage=make_header_footer(title)),
    ])

    styles = build_styles()

    story = []
    # cover title at top of first body page
    story.append(Paragraph(subtitle, styles["H1"]))
    # gold underline
    tbl = Table([[""]], colWidths=[40 * mm], rowHeights=[1])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GOLD),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 4 * mm))

    story.extend(parse_markdown(body_md, styles, total_width))

    doc.build(story)
    print(f"wrote {pdf_path}  ({pdf_path.stat().st_size} bytes)")


if __name__ == "__main__":
    here = Path(__file__).resolve().parent
    jobs = [
        (here / "ga4-audit.md", here / "ga4-audit.pdf",
         "GA4 Audit — billybeck.com"),
        (here / "gsc-audit.md", here / "gsc-audit.pdf",
         "GSC Audit — billybeck.com"),
        (here / "mcp-setup-guide.md", here / "mcp-setup-guide.pdf",
         "MCP Setup Guide — WordPress · Elementor · GA4 · GSC"),
    ]
    for md, pdf, title in jobs:
        if not md.exists():
            print(f"skip (missing): {md}")
            continue
        convert(md, pdf, title)
