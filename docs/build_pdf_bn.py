"""Render docs/FEATURES.bn.md to a Bangla PDF.

reportlab (docs/build_pdf.py) can't shape Bangla — Helvetica has no Bengali
glyphs and Bangla needs conjunct/vowel-sign reordering. So we convert the
markdown to HTML and let headless Chromium (via Playwright) print it: a real
browser shapes Bangla correctly, embeds the font and resolves the shots/ images.

    python docs/build_pdf_bn.py           # -> docs/EduNest-Documentation-BN.pdf
"""
import pathlib

import markdown
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
SRC = HERE / "FEATURES.bn.md"
HTML = HERE / "_features_bn.html"
OUT = HERE / "EduNest-Documentation-BN.pdf"

CSS = """
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body {
  font-family: "Kohinoor Bangla", "Noto Sans Bengali", "Bangla MN", sans-serif;
  color: #1f2937; line-height: 1.75; font-size: 12px; margin: 0;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
h1, h2, h3 { color: #1f2937; line-height: 1.4; page-break-after: avoid; }
h1 { font-size: 26px; border-bottom: 3px solid #4f46e5; padding-bottom: 8px; margin-top: 0; }
h2 { font-size: 19px; color: #4338ca; margin-top: 34px;
     border-top: 1px solid #e5e7eb; padding-top: 20px; }
h3 { font-size: 15px; color: #4f46e5; margin-top: 22px; }
a { color: #4f46e5; text-decoration: none; }
p { margin: 10px 0; }
code {
  font-family: "SFMono-Regular", Menlo, Consolas, monospace; font-size: 11px;
  background: #f1f5f9; color: #be185d; padding: 1px 5px; border-radius: 4px;
}
pre {
  background: #0f172a; color: #e2e8f0; padding: 14px 16px; border-radius: 8px;
  overflow-x: auto; page-break-inside: avoid; line-height: 1.5;
}
pre code { background: none; color: inherit; padding: 0; font-size: 10.5px; }
table {
  border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 11px;
  page-break-inside: avoid;
}
th { background: #4f46e5; color: #fff; text-align: left; padding: 7px 10px; }
td { border: 1px solid #e5e7eb; padding: 6px 10px; vertical-align: top; }
tr:nth-child(even) td { background: #f8fafc; }
blockquote {
  margin: 14px 0; padding: 8px 16px; background: #eef2ff;
  border-left: 4px solid #4f46e5; border-radius: 4px; color: #3730a3;
}
img {
  max-width: 100%; height: auto; display: block; margin: 10px auto 22px;
  border: 1px solid #e5e7eb; border-radius: 8px; page-break-inside: avoid;
}
hr { border: none; border-top: 1px solid #e5e7eb; margin: 26px 0; }
ul, ol { margin: 10px 0; padding-left: 24px; }
li { margin: 5px 0; }
"""

HEADER = (
    '<div style="font-size:8px;width:100%;padding:0 16mm;color:#9ca3af;">'
    'EduNest — ফিচার ডকুমেন্টেশন</div>'
)
FOOTER = (
    '<div style="font-size:8px;width:100%;padding:0 16mm;color:#9ca3af;'
    'text-align:right;">পৃষ্ঠা <span class="pageNumber"></span> / '
    '<span class="totalPages"></span></div>'
)


def build():
    body = markdown.markdown(
        SRC.read_text(encoding="utf-8"),
        extensions=["tables", "fenced_code", "toc"],
    )
    html = (
        f'<!doctype html><html lang="bn"><head><meta charset="utf-8">'
        f"<style>{CSS}</style></head><body>{body}</body></html>"
    )
    HTML.write_text(html, encoding="utf-8")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(HTML.resolve().as_uri(), wait_until="networkidle")
        page.pdf(
            path=str(OUT), format="A4", print_background=True,
            display_header_footer=True,
            header_template=HEADER, footer_template=FOOTER,
            margin={"top": "22mm", "bottom": "18mm",
                    "left": "0", "right": "0"},
        )
        browser.close()

    HTML.unlink(missing_ok=True)
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    build()
