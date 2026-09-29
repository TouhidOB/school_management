"""Default certificate bodies + {placeholder} substitution."""
from datetime import date

# Sensible starting text per type; admins edit before issuing.
DEFAULTS = {
    "custom": {
        "title": "Certificate",
        "body": ("This is to certify that {student_name}, bearing admission no. "
                 "{admission_no} of class {class}, {section_clause} is a bona fide "
                 "student of {school}.\n\nIssued on {date}."),
    },
    "testimonial": {
        "title": "Testimonial",
        "body": ("This is to certify that {student_name}, bearing admission no. "
                 "{admission_no}, was a student of class {class} at {school}.\n\n"
                 "During {his_her} time with us, {he_she} maintained good conduct "
                 "and bore a good moral character. {he_she_cap} was sincere and "
                 "well-behaved.\n\nWe wish {him_her} every success in the future."),
    },
    "transfer": {
        "title": "Transfer Certificate",
        "body": ("This is to certify that {student_name}, bearing admission no. "
                 "{admission_no}, was a bona fide student of {school} in class "
                 "{class} {section_clause}.\n\nDate of birth as per our records is "
                 "{dob}. {he_she_cap} has cleared all dues. {his_her_cap} conduct "
                 "during the period of study was good.\n\nThis Transfer Certificate "
                 "is issued on {date} at {his_her} guardian's request."),
    },
}


def _pronouns(gender):
    if gender == "female":
        return dict(he_she="she", him_her="her", his_her="her")
    if gender == "male":
        return dict(he_she="he", him_her="him", his_her="his")
    return dict(he_she="they", him_her="them", his_her="their")


def build_context(student, school, issue_date=None, reference_no=""):
    p = _pronouns(getattr(student, "gender", ""))
    section = student.current_section
    ctx = {
        "student_name": student.full_name,
        "first_name": student.full_name.split(" ")[0] if student.full_name else "",
        "admission_no": student.admission_number,
        "roll": student.roll_number or "—",
        "class": student.current_class.name if student.current_class_id else "—",
        "section": section.name if section else "",
        "section_clause": f"section {section.name}" if section else "",
        "dob": student.dob.strftime("%d %B %Y") if student.dob else "—",
        "gender": student.get_gender_display() if student.gender else "",
        "school": school.name if school else "",
        "school_address": (school.address if school else "") or "",
        "date": (issue_date or date.today()).strftime("%d %B %Y"),
        "ref_no": reference_no or "",
        **p,
    }
    ctx["he_she_cap"] = ctx["he_she"].capitalize()
    ctx["his_her_cap"] = ctx["his_her"].capitalize()
    return ctx


def render_text(text, ctx):
    """Substitute {key} tokens, leaving unknown ones untouched."""
    if not text:
        return ""
    out = text
    for key, val in ctx.items():
        out = out.replace("{" + key + "}", str(val))
    return out
