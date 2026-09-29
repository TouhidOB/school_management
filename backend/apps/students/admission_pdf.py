"""Auto-generated blank admission form PDF for offline applicants.

Used when a school hasn't uploaded its own form. Mirrors the fields the
online admission form collects, including parents' information and the
document checklist (birth certificate required, transfer certificate
optional).
"""
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

MARGIN = 18 * mm
LINE_GAP = 11 * mm
BRAND = colors.HexColor("#4f46e5")
LABEL = colors.HexColor("#374151")
RULE = colors.HexColor("#9ca3af")


def build_admission_form_pdf(school):
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - MARGIN

    # Header
    c.setFillColor(BRAND)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width / 2, y, school.name)
    y -= 7 * mm
    c.setFillColor(LABEL)
    c.setFont("Helvetica", 10)
    if school.address:
        c.drawCentredString(width / 2, y, school.address.replace("\n", ", "))
        y -= 6 * mm
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(width / 2, y, "STUDENT ADMISSION FORM")
    y -= 3 * mm
    c.setStrokeColor(BRAND)
    c.setLineWidth(1.2)
    c.line(MARGIN, y, width - MARGIN, y)
    y -= 4 * mm

    # Photo box
    c.setStrokeColor(RULE)
    c.setLineWidth(0.8)
    c.rect(width - MARGIN - 30 * mm, y - 38 * mm, 30 * mm, 38 * mm)
    c.setFont("Helvetica", 7)
    c.drawCentredString(width - MARGIN - 15 * mm, y - 20 * mm,
                        "Passport-size photo")

    def field(label, x, w, baseline):
        c.setFillColor(LABEL)
        c.setFont("Helvetica", 9)
        c.drawString(x, baseline, label)
        lw = c.stringWidth(label, "Helvetica", 9)
        c.setStrokeColor(RULE)
        c.setLineWidth(0.6)
        c.line(x + lw + 2 * mm, baseline - 1, x + w, baseline - 1)

    def section(title, baseline):
        c.setFillColor(BRAND)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(MARGIN, baseline, title)
        c.setStrokeColor(BRAND)
        c.setLineWidth(0.6)
        c.line(MARGIN, baseline - 2, width - MARGIN, baseline - 2)

    full_w = width - 2 * MARGIN
    body_right = width - MARGIN - 34 * mm  # keep clear of the photo box

    y -= 8 * mm
    section("1. Student Information", y)
    y -= LINE_GAP
    field("Full name:", MARGIN, body_right, y)
    y -= LINE_GAP
    field("Date of birth:", MARGIN, MARGIN + 80 * mm, y)
    field("Gender:", MARGIN + 88 * mm, body_right, y)
    y -= LINE_GAP
    field("Class applying for:", MARGIN, MARGIN + 80 * mm, y)
    field("Previous school:", MARGIN + 88 * mm, body_right, y)
    y -= LINE_GAP
    field("Address:", MARGIN, width - MARGIN, y)
    y -= LINE_GAP
    field("Phone:", MARGIN, MARGIN + 80 * mm, y)
    field("Email:", MARGIN + 88 * mm, width - MARGIN, y)

    y -= 9 * mm
    section("2. Father's Information", y)
    y -= LINE_GAP
    field("Name:", MARGIN, MARGIN + 100 * mm, y)
    field("Occupation:", MARGIN + 108 * mm, width - MARGIN, y)
    y -= LINE_GAP
    field("Phone:", MARGIN, MARGIN + 80 * mm, y)

    y -= 9 * mm
    section("3. Mother's Information", y)
    y -= LINE_GAP
    field("Name:", MARGIN, MARGIN + 100 * mm, y)
    field("Occupation:", MARGIN + 108 * mm, width - MARGIN, y)
    y -= LINE_GAP
    field("Phone:", MARGIN, MARGIN + 80 * mm, y)

    y -= 9 * mm
    section("4. Guardian (if different)", y)
    y -= LINE_GAP
    field("Name:", MARGIN, MARGIN + 100 * mm, y)
    field("Phone:", MARGIN + 108 * mm, width - MARGIN, y)

    y -= 9 * mm
    section("5. Documents to attach", y)
    y -= 8 * mm
    c.setFillColor(LABEL)
    c.setFont("Helvetica", 9.5)
    for text in ("Birth certificate (required)",
                 "Transfer certificate (only if coming from another school)",
                 "2 passport-size photographs"):
        c.setStrokeColor(RULE)
        c.rect(MARGIN, y - 1, 4 * mm, 4 * mm)
        c.drawString(MARGIN + 7 * mm, y, text)
        y -= 7.5 * mm

    y -= 10 * mm
    c.setStrokeColor(RULE)
    c.line(MARGIN, y, MARGIN + 60 * mm, y)
    c.line(width - MARGIN - 60 * mm, y, width - MARGIN, y)
    c.setFont("Helvetica", 8.5)
    c.drawString(MARGIN, y - 4 * mm, "Guardian's signature & date")
    c.drawRightString(width - MARGIN, y - 4 * mm,
                      "Authorised signature & seal")

    c.setFont("Helvetica-Oblique", 7.5)
    c.setFillColor(RULE)
    c.drawCentredString(width / 2, MARGIN / 2,
                        "Please submit this form to the school office along "
                        "with the listed documents.")
    c.showPage()
    c.save()
    return buf.getvalue()
