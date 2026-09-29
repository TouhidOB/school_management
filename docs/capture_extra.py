"""Capture the screens added after the original docs/capture.py run.

Appends them to manifest.json in the right section order, so the feature
documentation covers every page in the app.

    python manage.py runserver 127.0.0.1:8055
    python docs/capture_extra.py
"""
import json
import pathlib

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8055"
HERE = pathlib.Path(__file__).parent
OUT = HERE / "shots"
OUT.mkdir(exist_ok=True)
PK = json.loads((HERE / "pks.json").read_text())

CREDS = {
    "super": ("owner@edunest.app", "Owner12345"),
    "admin": ("admin@demo.local", "demo12345"),
    "teacher": ("teacher@demo.local", "demo12345"),
    "student": ("student@demo.local", "demo12345"),
    "parent": ("parent@demo.local", "demo12345"),
}

TOKEN = PK.get("app_token", "")
APP = PK.get("application", 1)
SECTION = PK.get("section", 1)
ASSIGNMENT = PK.get("assignment", 1)
LEAD = PK.get("lead", 1)

# (file, section, title, role, path, description)
CATALOG = [
    # ---- Public admissions ----
    ("pub_admissions", "Public Website", "Admissions Directory", None, "/admissions/",
     "Searchable directory of every school currently accepting online admissions."),
    ("pub_admission_apply", "Public Website", "Online Admission Form", None, "/admissions/demo/apply/",
     "A school's public application form; classes come from that school's own class list."),
    ("pub_admission_track", "Public Website", "Track Application", None, f"/admissions/track/{TOKEN}/",
     "Applicant status page reached with the unguessable tracking token."),
    ("pub_admit_card", "Public Website", "Admit Card", None, f"/admissions/track/{TOKEN}/admit-card/",
     "Printable admit card issued to the applicant on submission."),

    # ---- Super Admin ----
    ("sa_lead_detail", "Super Admin", "Contact Message Detail", "super", f"/app/leads/{LEAD}/",
     "One lead in full, with convert-to-school, handled toggle, edit and delete."),

    # ---- School Admin ----
    ("ad_applications", "School Admin", "Admission Applications", "admin", "/app/admissions/",
     "Inbox of online applications with status counters, search and filter."),
    ("ad_application_review", "School Admin", "Review Application", "admin", f"/app/admissions/{APP}/",
     "Approve (placing the applicant into a class/section as a Student) or reject with a reason."),
    ("ad_admission_settings", "School Admin", "Admission Form Settings", "admin", "/app/admissions/settings/",
     "Choose the online form or a downloadable PDF form, and set applicant instructions."),
    ("ad_routine", "School Admin", "Class Routine Builder", "admin", f"/app/routine/?section={SECTION}",
     "Weekly timetable grid per section: period, time, subject, teacher, room and break rows."),
    ("ad_staff_attendance", "School Admin", "Staff Attendance", "admin", "/app/staff-attendance/",
     "Daily staff register with per-teacher present flag, check-in and check-out."),
    ("ad_designations", "School Admin", "Designations", "admin", "/app/designations/",
     "Per-school staff designation ladder used for the teacher hierarchy."),
    ("ad_assignment_detail", "School Admin", "Assignment & Grading", "admin", f"/app/assignments/{ASSIGNMENT}/",
     "One assignment with its submissions, marks and feedback entry."),
    ("ad_student_credentials", "School Admin", "Student Portal Login", "admin", f"/app/students/{PK['student']}/credentials/",
     "Issue or reset a student's portal login; the login ID is permanent."),
    ("ad_myrooms", "School Admin", "Classroom Cards", "admin", "/app/my-rooms/",
     "Card view of classrooms for the signed-in user (all rooms for admins)."),

    # ---- Teacher / Student ----
    ("te_routine", "Teacher", "My Teaching Routine", "teacher", "/app/my-routine/",
     "The teacher's own weekly schedule, derived from the routine grid."),
    ("st_routine", "Student", "My Class Routine", "student", "/app/my-routine/",
     "The student's section timetable with subject, teacher and room."),
]


def login(context, role):
    page = context.new_page()
    page.goto(f"{BASE}/login/")
    user, pw = CREDS[role]
    page.fill("input[name=username]", user)
    page.fill("input[name=password]", pw)
    page.click("button[type=submit], form button")
    page.wait_for_load_state("networkidle")
    page.close()


def main():
    captured = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        contexts = {}
        for role in {r for _, _, _, r, _, _ in CATALOG}:
            ctx = browser.new_context(viewport={"width": 1280, "height": 900},
                                      device_scale_factor=2)
            if role:
                login(ctx, role)
            contexts[role] = ctx

        for f, section, title, role, path, desc in CATALOG:
            page = contexts[role].new_page()
            try:
                page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(700)
                page.screenshot(path=str(OUT / f"{f}.png"), full_page=True)
                captured.append({"file": f, "section": section, "title": title,
                                 "role": role or "Public", "path": path, "desc": desc})
                print(f"OK  {f:<24} {path}")
            except Exception as e:
                print(f"ERR {f:<24} {path} :: {e}")
            page.close()
        browser.close()

    manifest_path = HERE / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    known = {e["file"] for e in manifest}
    manifest.extend(e for e in captured if e["file"] not in known)
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(f"\nCaptured {len(captured)} pages; manifest now has {len(manifest)}.")


if __name__ == "__main__":
    main()
