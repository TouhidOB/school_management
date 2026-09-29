"""Assemble the screenshots + explanations into a documentation PDF."""
import json
import pathlib

from PIL import Image as PILImage
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (Image, PageBreak, Paragraph, SimpleDocTemplate,
                                Spacer, Table, TableStyle)

HERE = pathlib.Path(__file__).parent
SHOTS = HERE / "shots"
MANIFEST = json.loads((HERE / "manifest.json").read_text())
OUT = HERE / "EduNest-Documentation.pdf"

BRAND = colors.HexColor("#4f46e5")
INK = colors.HexColor("#1f2937")
MUTED = colors.HexColor("#6b7280")

PAGE_W, PAGE_H = A4
L = R = 18 * mm
CONTENT_W = PAGE_W - L - R

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], textColor=INK, fontSize=20, spaceAfter=4)
SEC = ParagraphStyle("SEC", parent=styles["Heading2"], textColor=BRAND, fontSize=11,
                     spaceBefore=0, spaceAfter=2, leading=13)
TITLE = ParagraphStyle("TITLE", parent=styles["Heading2"], textColor=INK, fontSize=16, spaceAfter=2)
DESC = ParagraphStyle("DESC", parent=styles["BodyText"], textColor=MUTED, fontSize=10, leading=14)
BODY = ParagraphStyle("BODY", parent=styles["BodyText"], textColor=INK, fontSize=10.5, leading=15)
COVER_T = ParagraphStyle("CT", parent=styles["Title"], fontSize=34, textColor=INK, leading=38)
COVER_S = ParagraphStyle("CS", parent=styles["Normal"], fontSize=13, textColor=MUTED,
                         alignment=TA_CENTER, leading=18)
CENTER = ParagraphStyle("C", parent=styles["Normal"], alignment=TA_CENTER, textColor=MUTED, fontSize=10)
TOC = ParagraphStyle("TOC", parent=styles["BodyText"], fontSize=10, leading=15, textColor=INK)


def scaled_image(path, max_w, max_h):
    w, h = PILImage.open(path).size
    ratio = min(max_w / w, max_h / h)
    return Image(str(path), width=w * ratio, height=h * ratio)


def role_badge(role):
    return Table([[role]], style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eef2ff")),
        ("TEXTCOLOR", (0, 0), (-1, -1), BRAND),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#c7d2fe")),
    ]), hAlign="LEFT")


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    if doc.page > 1:
        canvas.drawString(L, PAGE_H - 12 * mm, "EduNest — Platform Documentation")
        canvas.drawRightString(PAGE_W - R, 10 * mm, f"Page {doc.page}")
        canvas.setStrokeColor(colors.HexColor("#e5e7eb"))
        canvas.line(L, PAGE_H - 14 * mm, PAGE_W - R, PAGE_H - 14 * mm)
    canvas.restoreState()


def build():
    story = []

    # ---- Cover ----
    story.append(Spacer(1, 55 * mm))
    logo = Table([["E"]], colWidths=[26 * mm], rowHeights=[26 * mm], style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 40), ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]), hAlign="CENTER")
    story.append(logo)
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph("EduNest", COVER_T))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("Multi-Vendor School Management SaaS<br/>Platform Documentation", COVER_S))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("A complete visual guide to every page, by role.", CENTER))
    story.append(PageBreak())

    # ---- Intro ----
    story.append(Paragraph("About this platform", H1))
    story.append(Spacer(1, 3 * mm))
    intro = (
        "EduNest is a multi-tenant “Shopify for Schools” platform: any school signs up as "
        "an isolated tenant with its own subdomain and data. This document walks through every "
        "screen in the product, grouped by the role that uses it — the public marketing site, the "
        "Super Admin (platform owner) console, and the in-school roles: School Admin, Teacher, "
        "Student and Parent."
    )
    story.append(Paragraph(intro, BODY))
    story.append(Spacer(1, 4 * mm))
    roles = [
        ["Public", "Marketing site, pricing, leaderboards, contact enquiries, sign-in."],
        ["Super Admin", "Platform owner: manage every school, contact leads, plans; enter any school to support it."],
        ["School Admin", "Runs one school: teachers, students, classrooms, fees, exams, attendance, certificates, devices."],
        ["Teacher", "Own classrooms, assignments, marks entry, ratings received."],
        ["Student", "Classrooms, assignments, results, fees, rate teachers."],
        ["Parent", "A child's attendance, results and fees."],
    ]
    t = Table([["Role", "What they do"]] + roles, colWidths=[35 * mm, CONTENT_W - 35 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (0, -1), BRAND),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e7eb")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(t)
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("Security note", SEC))
    story.append(Paragraph(
        "Every tenant's data is strictly isolated: a scoped ORM manager, list filters and form "
        "validation, plus middleware that pins each employee to their own school, ensure a user "
        "from one school can never read or modify another school's data.", BODY))

    # ---- Contents ----
    story.append(PageBreak())
    story.append(Paragraph("Contents", H1))
    story.append(Spacer(1, 3 * mm))
    last = None
    for m in MANIFEST:
        if m["section"] != last:
            last = m["section"]
            story.append(Spacer(1, 2 * mm))
            story.append(Paragraph(f"<b>{m['section']}</b>", TOC))
        story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;{m['title']}", TOC))

    # ---- One page per screen ----
    last = None
    for m in MANIFEST:
        story.append(PageBreak())
        if m["section"] != last:
            last = m["section"]
        story.append(Paragraph(m["section"].upper(), SEC))
        story.append(Paragraph(m["title"], TITLE))
        story.append(role_badge(m["role"]))
        story.append(Spacer(1, 2 * mm))
        story.append(Paragraph(m["desc"], DESC))
        story.append(Paragraph(f'<font color="#9ca3af" size="8">URL: {m["path"]}</font>', DESC))
        story.append(Spacer(1, 3 * mm))
        img = SHOTS / f"{m['file']}.png"
        if img.exists():
            frame = Table([[scaled_image(img, CONTENT_W - 6, PAGE_H - 78 * mm)]],
                          style=TableStyle([
                              ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#e5e7eb")),
                              ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                              ("TOPPADDING", (0, 0), (-1, -1), 3),
                              ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                              ("LEFTPADDING", (0, 0), (-1, -1), 3),
                              ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                          ]), hAlign="CENTER")
            story.append(frame)

    doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=L, rightMargin=R,
                            topMargin=18 * mm, bottomMargin=15 * mm,
                            title="EduNest Platform Documentation")
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB, {len(MANIFEST)} screens)")


if __name__ == "__main__":
    build()
