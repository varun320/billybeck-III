"""Render the Billy Beck progress + optimization email as a branded PDF."""

from __future__ import annotations

from pathlib import Path

from md_to_pdf import convert


def main() -> None:
    here = Path(__file__).resolve().parent
    md = here / "billy-email-update.md"
    pdf = here / "billy-email-update.pdf"
    title = "billybeck.com — Progress & Optimization Plan"
    convert(md, pdf, title)


if __name__ == "__main__":
    main()
