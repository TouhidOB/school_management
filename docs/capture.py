"""Capture full-page screenshots of every EduNest page, grouped by role."""
import json
import pathlib

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8055"
OUT = pathlib.Path(__file__).parent / "shots"
OUT.mkdir(exist_ok=True)
PK = json.loads((pathlib.Path(__file__).parent / "pks.json").read_text())

CREDS = {
    "super": ("owner@edunest.app", "Owner12345"),
    "admin": ("admin@demo.local", "demo12345"),
    "teacher": ("teacher@demo.local", "demo12345"),
    "student": ("student@demo.local", "demo12345"),
    "parent": ("parent@demo.local", "demo12345"),
}

# (file, section, title, role, path, description)
CATALOG = [
    # ---- Public ----
    ("home", "Public Website", "Home / Landing", None, "/", "Marketing landing page: value proposition, feature highlights, per-student pricing and a Contact call-to-action."),
    ("features", "Public Website", "Features", None, "/features/", "Grid of the twelve platform modules available to every school."),
    ("pricing", "Public Website", "Pricing", None, "/pricing/", "Flat pricing (৳10 per student, manual payment) with an inclusions list."),
    ("leaderboard", "Public Website", "Top Teachers Leaderboard", None, "/leaderboard/", "Platform-wide ranking of top-rated teachers (photo, name, school, rating). Needs 5+ ratings."),
    ("school_leaderboard", "Public Website", "Top Schools Leaderboard", None, "/schools-leaderboard/", "Schools ranked by the average of their teachers' ratings (logo, name, address, rating)."),
    ("contact", "Public Website", "Contact", None, "/contact/", "Enquiry form; submissions become leads on the Super Admin dashboard. Shows phone, email and topic."),
    ("login", "Public Website", "Sign In", None, "/login/", "Single sign-in for every role; routing to the right dashboard happens after login."),

    # ---- Super Admin ----
    ("sa_dashboard", "Super Admin", "Platform Dashboard", "super", "/app/", "Platform KPIs (schools, students, revenue), the Contact-messages inbox with clickable phone, and recent schools."),
    ("sa_schools", "Super Admin", "Schools", "super", "/app/schools/", "All tenant schools with search and status filter; entry point to create or manage a school."),
    ("sa_school_detail", "Super Admin", "School Detail", "super", f"/app/schools/{PK['school']}/", "A tenant's profile, stats and status controls, plus 'Manage this school' to enter its workspace."),
    ("sa_school_create", "Super Admin", "Create School", "super", "/app/schools/create/", "Manually provision a school + admin login, device brand and API key."),
    ("sa_leads", "Super Admin", "Contact Messages", "super", "/app/leads/", "Full CRUD over contact leads: search, filter, phone/email links, handle/convert/delete."),
    ("sa_plans", "Super Admin", "Subscription Plans", "super", "/app/plans/", "Manage subscription plan definitions."),

    # ---- School Admin ----
    ("ad_dashboard", "School Admin", "Dashboard", "admin", "/app/", "Overview: student/teacher/room counts, fees collected, recent students and quick actions."),
    ("ad_teachers", "School Admin", "Teachers", "admin", "/app/teachers/", "Teacher directory with search (name/email/ID) and filters (designation, status)."),
    ("ad_teacher_create", "School Admin", "Add Teacher", "admin", "/app/teachers/create/", "Create a teacher: account details, designation, subjects, sections and status."),
    ("ad_teacher_detail", "School Admin", "Teacher Detail", "admin", f"/app/teachers/{PK['teacher']}/", "Teacher profile, rating summary and assigned classrooms."),
    ("ad_students", "School Admin", "Students", "admin", "/app/students/", "Student directory with search and class/section/status filters."),
    ("ad_student_create", "School Admin", "Add Student", "admin", "/app/students/create/", "Full student admission form."),
    ("ad_student_detail", "School Admin", "Student Detail", "admin", f"/app/students/{PK['student']}/", "Profile, guardians, invoices, results, plus actions: ID card, admission slip, login, certificate."),
    ("ad_certificates", "School Admin", "Certificates", "admin", "/app/certificates/", "Issued certificates / testimonials / transfer certificates, searchable."),
    ("ad_cert_create", "School Admin", "Issue Certificate", "admin", "/app/certificates/create/", "Compose a certificate with per-type default text and {placeholders}."),
    ("ad_years", "School Admin", "Academic Years", "admin", "/app/years/", "Academic sessions; one marked current."),
    ("ad_classes", "School Admin", "Classes", "admin", "/app/classes/", "Grade levels."),
    ("ad_sections", "School Admin", "Sections", "admin", "/app/sections/", "Sections per class/year with an optional class teacher."),
    ("ad_subjects", "School Admin", "Subjects", "admin", "/app/subjects/", "Subject catalog, searchable."),
    ("ad_rooms", "School Admin", "Classrooms", "admin", "/app/rooms/", "Collaborative subject rooms with search and subject filter."),
    ("ad_room_detail", "School Admin", "Classroom Detail", "admin", f"/app/rooms/{PK['room']}/", "Room feed, notes, assignments and participants (tabbed)."),
    ("ad_exams", "School Admin", "Exams", "admin", "/app/exams/", "Exam sessions."),
    ("ad_exam_detail", "School Admin", "Exam Detail", "admin", f"/app/exams/{PK['exam']}/", "Exam subjects and the entry point to marks entry."),
    ("ad_attendance", "School Admin", "Attendance", "admin", "/app/attendance/", "Manual daily attendance by section and date."),
    ("ad_biometric", "School Admin", "Fingerprint IDs", "admin", "/app/biometric/", "Map device fingerprint ids to students/teachers for biometric attendance."),
    ("ad_devices", "School Admin", "Attendance Device", "admin", "/app/devices/", "Configure the biometric brand, API key, ingest URL/token and view recent punches."),
    ("ad_feetypes", "School Admin", "Fee Types", "admin", "/app/fee-types/", "Built-in and custom fee categories."),
    ("ad_feestructures", "School Admin", "Fee Structures", "admin", "/app/fee-structures/", "Per-class amounts for each fee type."),
    ("ad_invoices", "School Admin", "Invoices", "admin", "/app/invoices/", "Invoices with search, status filter and receipt links."),
    ("ad_invoice_detail", "School Admin", "Invoice Detail", "admin", f"/app/invoices/{PK['invoice']}/", "Line items, totals, payment recording and receipt."),
    ("ad_ratings", "School Admin", "Teacher Ratings", "admin", "/app/ratings/", "Ranked teacher ratings leaderboard for the school."),
    ("ad_periods", "School Admin", "Rating Periods", "admin", "/app/rating-periods/", "Rating windows during which students can rate teachers."),
    ("ad_notifications", "School Admin", "Notifications", "admin", "/app/notifications/", "In-app notification log."),
    ("ad_onboarding", "School Admin", "Setup Wizard", "admin", "/app/onboarding/", "Guided checklist to get the school configured."),
    ("ad_settings", "School Admin", "Settings", "admin", "/app/settings/", "School profile summary."),

    # ---- Printable reports (admin) ----
    ("rp_receipt", "Printable Reports", "Money Receipt", "admin", f"/app/invoices/{PK['invoice']}/receipt/", "Print-ready fee receipt with school branding, line items, paid/due stamp."),
    ("rp_idcard", "Printable Reports", "Student ID Card", "admin", f"/app/students/{PK['student']}/id-card/", "CR80 ID card with photo, class/roll, admission number and QR code."),
    ("rp_slip", "Printable Reports", "Admission Slip", "admin", f"/app/students/{PK['student']}/admission-slip/", "Admission slip: student info, portal login and fee schedule/balance."),
    ("rp_cert", "Printable Reports", "Certificate", "admin", f"/app/certificates/{PK['certificate']}/print/", "Ornamental printable certificate with substituted placeholders."),

    # ---- Teacher ----
    ("te_dashboard", "Teacher", "Dashboard", "teacher", "/app/", "Teacher home: classrooms, pending grading, subjects."),
    ("te_rooms", "Teacher", "My Classrooms", "teacher", "/app/my-rooms/", "The classrooms this teacher teaches."),
    ("te_marks", "Teacher", "Marks Entry", "teacher", "/app/marks-entry/", "Exams the teacher can open to enter marks."),
    ("te_ratings", "Teacher", "My Ratings", "teacher", "/app/my-ratings/", "The teacher's own rating summary (unlocks at 5 ratings)."),

    # ---- Student ----
    ("st_dashboard", "Student", "Dashboard", "student", "/app/", "Student home: upcoming assignments, fees due, classrooms."),
    ("st_assignments", "Student", "Assignments", "student", "/app/my-assignments/", "Assignments with submission status."),
    ("st_results", "Student", "Results", "student", "/app/my-results/", "Published exam results."),
    ("st_invoices", "Student", "Fees", "student", "/app/my-invoices/", "The student's invoices with receipt links."),
    ("st_rate", "Student", "Rate Teachers", "student", "/app/rate-teachers/", "Anonymous 6-dimension teacher rating form."),

    # ---- Parent ----
    ("pa_dashboard", "Parent", "Dashboard", "parent", "/app/", "Parent home: child cards linking to attendance, results and fees."),
    ("pa_attendance", "Parent", "Attendance", "parent", "/app/child/attendance/", "Child attendance calendar."),
    ("pa_results", "Parent", "Results", "parent", "/app/child/results/", "Child exam results."),
    ("pa_invoices", "Parent", "Fees", "parent", "/app/child/invoices/", "Child invoices with receipt links."),
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
    manifest = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        contexts = {}
        for role in [None, "super", "admin", "teacher", "student", "parent"]:
            ctx = browser.new_context(viewport={"width": 1280, "height": 900},
                                      device_scale_factor=2)
            if role:
                login(ctx, role)
            contexts[role] = ctx

        for f, section, title, role, path, desc in CATALOG:
            ctx = contexts[role]
            page = ctx.new_page()
            try:
                page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(700)  # let CDN CSS / QR settle
                out = OUT / f"{f}.png"
                page.screenshot(path=str(out), full_page=True)
                manifest.append({"file": f, "section": section, "title": title,
                                 "role": role or "Public", "path": path, "desc": desc})
                print(f"OK  {f:<20} {path}")
            except Exception as e:
                print(f"ERR {f:<20} {path} :: {e}")
            page.close()
        browser.close()

    (pathlib.Path(__file__).parent / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"\nCaptured {len(manifest)} pages.")


if __name__ == "__main__":
    main()
