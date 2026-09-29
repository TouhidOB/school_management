"""Dashboards, portals and the non-CRUD interactive pages."""
from datetime import date
from decimal import Decimal

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Count, Q, Sum
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone

from apps.attendance.models import StudentAttendance
from apps.exams.models import ExamResult, ExamSession, ExamSubject
from apps.fees.models import FeeStructure, Invoice, Payment
from apps.notifications.models import Notification
from apps.ratings.models import RatingPeriod, TeacherRating, TeacherRatingAggregate
from apps.rooms.models import (Assignment, AssignmentSubmission, ClassRoom, Note,
                               RoomPost)
from apps.students.models import Guardian, Student
from apps.teachers.models import TeacherProfile
from apps.tenants.models import ContactMessage, School, SubscriptionPlan
from apps.web import forms
from apps.web.mixins import ADMIN_ROLES
from apps.web.pagination import paginate


# ---------------------------------------------------------------- dashboards
@login_required
def dashboard(request):
    # Super Admin who has "entered" a school sees that school's admin dashboard;
    # with no school selected they see the platform dashboard.
    if request.user.role == "super_admin":
        return _admin_dashboard(request) if request.school else _super_dashboard(request)
    # School admins of a not-yet-approved school wait for Super Admin approval.
    school = request.school
    if school is not None and school.status == School.STATUS_PENDING:
        return render(request, "dashboards/pending_approval.html",
                      {"school": school})
    return _admin_dashboard(request)


def _admin_dashboard(request):
    ctx = {
        "students": Student.objects.count(),
        "teachers": TeacherProfile.objects.count(),
        "rooms": ClassRoom.objects.count(),
        "collected": Payment.objects.aggregate(t=Sum("amount_paid"))["t"] or 0,
        "pending_invoices": Invoice.objects.exclude(status="paid").count(),
        "recent_students": Student.objects.order_by("-created_at")[:5],
        "school": request.school,
    }
    return render(request, "dashboards/admin.html", ctx)


def _super_dashboard(request):
    schools = School.all_objects.all()
    total_students = Student.all_objects.count()
    ctx = {
        "total_schools": schools.count(),
        "active": schools.filter(status="active").count(),
        "trial": schools.filter(status="trial").count(),
        "suspended": schools.filter(status="suspended").count(),
        "pending_schools": schools.filter(status="pending").order_by("-created_at"),
        "total_students": total_students,
        # Flat manual billing: ৳10 per student across the platform.
        "expected_revenue": total_students * 10,
        "recent": schools.order_by("-created_at")[:6],
        "leads": ContactMessage.objects.all()[:8],
        "open_leads": ContactMessage.objects.filter(is_handled=False).count(),
    }
    return render(request, "superadmin/dashboard.html", ctx)


# ------------------------------------------------------------------ helpers
def _current_student(request):
    return Student.objects.filter(user=request.user).first()


def _require(request, roles):
    # Super Admin bypasses per-role gates — they have platform-wide access.
    if request.user.role == "super_admin":
        return
    if request.user.role not in roles:
        from django.core.exceptions import PermissionDenied
        raise PermissionDenied()


# --------------------------------------------------------------- detail pages
@login_required
def teacher_detail(request, pk):
    _require(request, ADMIN_ROLES)
    t = get_object_or_404(TeacherProfile, pk=pk)
    agg = TeacherRatingAggregate.objects.filter(teacher=t).order_by("-last_calculated_at").first()
    return render(request, "teachers/detail.html",
                  {"t": t, "agg": agg, "rooms": t.rooms.all()})


@login_required
def student_detail(request, pk):
    _require(request, ADMIN_ROLES | {"accountant"})
    s = get_object_or_404(Student, pk=pk)
    return render(request, "students/detail.html", {
        "s": s,
        "guardians": s.guardians.all(),
        "invoices": s.invoices.all(),
        "results": ExamResult.objects.filter(student=s).select_related("exam_subject"),
    })


def _fees_summary(student):
    from django.db.models import Q, Sum
    from apps.fees.models import FeeStructure, Payment
    invoices = list(student.invoices.all())
    billed = sum((i.grand_total for i in invoices), 0)
    paid = Payment.objects.filter(invoice__student=student).aggregate(
        t=Sum("amount_paid"))["t"] or 0
    schedule = FeeStructure.objects.filter(
        academic_year=student.academic_year
    ).filter(Q(applicable_class__isnull=True)
             | Q(applicable_class=student.current_class)).select_related("fee_type")
    return {"invoices": invoices, "billed": billed, "paid": paid,
            "due": billed - paid, "schedule": schedule}


@login_required
def student_id_card(request, pk):
    _require(request, ADMIN_ROLES | {"accountant"})
    student = get_object_or_404(Student, pk=pk)
    return render(request, "students/id_card.html",
                  {"s": student, "school": request.school})


@login_required
def admission_slip(request, pk):
    _require(request, ADMIN_ROLES | {"accountant"})
    student = get_object_or_404(Student, pk=pk)
    return render(request, "students/admission_slip.html", {
        "s": student, "school": request.school,
        "fees": _fees_summary(student),
        "guardians": student.guardians.all(),
    })


@login_required
def guardian_add(request, pk):
    _require(request, ADMIN_ROLES)
    student = get_object_or_404(Student, pk=pk)
    if request.method == "POST":
        form = forms.GuardianForm(request.POST, school=request.school)
        if form.is_valid():
            g = form.save(commit=False)
            g.school = request.school
            g.student = student
            g.save()
            messages.success(request, "Guardian added.")
            return redirect("student_detail", pk=student.pk)
    else:
        form = forms.GuardianForm(school=request.school)
    return render(request, "generic/form.html", {
        "form": form, "header": f"Add guardian for {student.full_name}",
        "cancel_url": f"/app/students/{student.pk}/"})


# ------------------------------------------------------------- certificates
@login_required
def certificate_list(request):
    _require(request, ADMIN_ROLES)
    from apps.students.models import Certificate
    qs = Certificate.objects.select_related("student")
    q = request.GET.get("q", "").strip()
    if q:
        qs = qs.filter(Q(student__full_name__icontains=q) | Q(title__icontains=q))
    page = paginate(request, qs)
    return render(request, "certificates/list.html",
                  {"certificates": page, "page_obj": page, "q": q})


@login_required
def certificate_form(request, pk=None):
    _require(request, ADMIN_ROLES)
    import json

    from apps.students.certificates import DEFAULTS
    from apps.students.models import Certificate
    cert = get_object_or_404(Certificate, pk=pk) if pk else None
    if request.method == "POST":
        form = forms.CertificateForm(request.POST, instance=cert,
                                     school=request.school)
        if form.is_valid():
            obj = form.save(commit=False)
            obj.school = request.school
            obj.save()
            messages.success(request, "Certificate saved.")
            return redirect("certificate_print", pk=obj.pk)
    else:
        initial = {}
        student_id = request.GET.get("student")
        if student_id:
            initial["student"] = student_id
        form = forms.CertificateForm(instance=cert, school=request.school,
                                     initial=initial)
    return render(request, "certificates/form.html", {
        "form": form, "cert": cert,
        "defaults_json": json.dumps(DEFAULTS),
        "placeholders": ["student_name", "admission_no", "class", "section",
                         "roll", "dob", "school", "school_address", "date",
                         "ref_no", "he_she", "him_her", "his_her"],
    })


@login_required
def certificate_delete(request, pk):
    _require(request, ADMIN_ROLES)
    from apps.students.models import Certificate
    cert = get_object_or_404(Certificate, pk=pk)
    if request.method == "POST":
        cert.delete()
        messages.success(request, "Certificate deleted.")
        return redirect("certificate_list")
    return render(request, "generic/confirm_delete.html",
                  {"object": cert, "cancel_url": reverse("certificate_list")})


@login_required
def certificate_print(request, pk):
    _require(request, ADMIN_ROLES | {"accountant"})
    from apps.students.certificates import build_context, render_text
    from apps.students.models import Certificate
    cert = get_object_or_404(Certificate, pk=pk)
    ctx = build_context(cert.student, request.school, cert.issue_date,
                        cert.reference_no)
    return render(request, "certificates/print.html", {
        "cert": cert, "school": request.school,
        "title": render_text(cert.title, ctx),
        "body": render_text(cert.body, ctx),
    })


# ------------------------------------------------------------- admissions (admin)
@login_required
def application_list(request):
    _require(request, ADMIN_ROLES)
    from apps.students.models import AdmissionApplication
    apps_qs = AdmissionApplication.objects.all()
    status = request.GET.get("status", "").strip()
    q = request.GET.get("q", "").strip()
    if status:
        apps_qs = apps_qs.filter(status=status)
    if q:
        apps_qs = apps_qs.filter(Q(full_name__icontains=q) | Q(phone__icontains=q)
                                 | Q(guardian_name__icontains=q))
    page = paginate(request, apps_qs)
    base = AdmissionApplication.objects
    return render(request, "students/applications.html", {
        "applications": page, "page_obj": page, "status": status, "q": q,
        "total": base.count(),
        "pending": base.filter(status="pending").count(),
        "approved": base.filter(status="approved").count(),
        "rejected": base.filter(status="rejected").count(),
        "school": request.school})


@login_required
def admission_settings(request):
    _require(request, ADMIN_ROLES)
    school = request.school
    if request.method == "POST":
        form = forms.AdmissionFormSettingsForm(request.POST, request.FILES,
                                               instance=school)
        if form.is_valid():
            form.save()
            messages.success(request, "Admission form settings saved.")
            return redirect("admission_settings")
    else:
        form = forms.AdmissionFormSettingsForm(instance=school)
    return render(request, "students/admission_settings.html",
                  {"form": form, "school": school})


@login_required
def application_review(request, pk):
    _require(request, ADMIN_ROLES)
    from apps.students.models import AdmissionApplication, Guardian
    app = get_object_or_404(AdmissionApplication, pk=pk)

    if request.method == "POST":
        action = request.POST.get("action")
        if action == "reject":
            app.status = "rejected"
            app.rejection_reason = request.POST.get("rejection_reason", "")
            app.reviewed_by = request.user
            app.reviewed_at = timezone.now()
            app.save()
            messages.success(request, "Application rejected.")
            return redirect("application_review", pk=app.pk)
        if action == "approve":
            form = forms.AdmissionApproveForm(request.POST, school=request.school)
            if form.is_valid():
                student = form.save(commit=False)
                student.school = request.school
                student.full_name = app.full_name
                student.dob = app.dob
                student.gender = app.gender
                student.address = app.address
                student.previous_school = app.previous_school
                student.admission_date = timezone.now().date()
                student.save()
                if app.father_name:
                    Guardian.objects.create(
                        school=request.school, student=student,
                        relation="father", name=app.father_name,
                        phone=app.father_phone,
                        occupation=app.father_occupation,
                        is_primary_contact=True)
                if app.mother_name:
                    Guardian.objects.create(
                        school=request.school, student=student,
                        relation="mother", name=app.mother_name,
                        phone=app.mother_phone,
                        occupation=app.mother_occupation,
                        is_primary_contact=not app.father_name)
                if app.guardian_name:
                    Guardian.objects.create(
                        school=request.school, student=student,
                        relation="other", name=app.guardian_name,
                        phone=app.guardian_phone, email=app.guardian_email,
                        is_primary_contact=not (app.father_name or app.mother_name))
                app.status = "approved"
                app.created_student = student
                app.reviewed_by = request.user
                app.reviewed_at = timezone.now()
                app.save()
                messages.success(request, f"Approved — {student.full_name} admitted.")
                return redirect("student_detail", pk=student.pk)
        else:
            form = forms.AdmissionApproveForm(school=request.school)
    else:
        # suggest an admission number
        count = Student.objects.count() + 1
        year = timezone.now().year
        form = forms.AdmissionApproveForm(
            school=request.school,
            initial={"admission_number": f"{year}-{count:04d}"})

    return render(request, "students/application_review.html",
                  {"app": app, "form": form})


@login_required
def admissions_toggle(request):
    _require(request, ADMIN_ROLES)
    school = request.school
    school.admissions_open = not school.admissions_open
    school.save(update_fields=["admissions_open"])
    state = "open" if school.admissions_open else "closed"
    messages.success(request, f"Online admissions are now {state}.")
    return redirect(request.META.get("HTTP_REFERER") or reverse("application_list"))


# ------------------------------------------------------------------- rooms
@login_required
def room_detail(request, pk):
    room = get_object_or_404(ClassRoom, pk=pk)
    can_post = request.user.role in ADMIN_ROLES or request.user.role == "super_admin"
    if request.method == "POST" and can_post:
        form = forms.RoomPostForm(request.POST, request.FILES, school=request.school)
        if form.is_valid():
            p = form.save(commit=False)
            p.school = request.school
            p.room = room
            p.author = request.user
            p.save()
            messages.success(request, "Posted.")
            return redirect("room_detail", pk=room.pk)
    else:
        form = forms.RoomPostForm(school=request.school)
    ctx = {
        "room": room, "can_post": can_post, "post_form": form,
        "posts": room.posts.select_related("author")[:30],
        "notes": room.notes.all()[:30],
        "assignments": room.assignments.all()[:30],
        "participants": room.memberships.select_related("student"),
    }
    return render(request, "rooms/detail.html", ctx)


@login_required
def note_add(request, pk):
    room = get_object_or_404(ClassRoom, pk=pk)
    if request.method == "POST":
        form = forms.NoteForm(request.POST, request.FILES, school=request.school)
        if form.is_valid():
            n = form.save(commit=False)
            n.school = request.school
            n.room = room
            n.uploaded_by = request.user
            n.save()
            messages.success(request, "Note uploaded.")
            return redirect("room_detail", pk=room.pk)
    else:
        form = forms.NoteForm(school=request.school)
    return render(request, "generic/form.html",
                  {"form": form, "header": f"Add note — {room.name}",
                   "cancel_url": f"/app/rooms/{room.pk}/"})


@login_required
def assignment_add(request, pk):
    room = get_object_or_404(ClassRoom, pk=pk)
    if request.method == "POST":
        form = forms.AssignmentForm(request.POST, request.FILES, school=request.school)
        if form.is_valid():
            a = form.save(commit=False)
            a.school = request.school
            a.room = room
            a.save()
            messages.success(request, "Assignment created.")
            return redirect("room_detail", pk=room.pk)
    else:
        form = forms.AssignmentForm(school=request.school)
    return render(request, "generic/form.html",
                  {"form": form, "header": f"New assignment — {room.name}",
                   "cancel_url": f"/app/rooms/{room.pk}/"})


@login_required
def assignment_detail(request, pk):
    a = get_object_or_404(Assignment, pk=pk)
    ctx = {
        "a": a, "student": None, "my_submission": None,
        "submissions": a.submissions.select_related("student"),
    }
    return render(request, "rooms/assignment.html", ctx)


@login_required
def grade_submission(request, pk):
    sub = get_object_or_404(AssignmentSubmission, pk=pk)
    if request.method == "POST":
        sub.marks_obtained = request.POST.get("marks") or None
        sub.feedback = request.POST.get("feedback", "")
        sub.graded_at = timezone.now()
        sub.graded_by = request.user
        sub.save()
        messages.success(request, "Graded.")
    return redirect("assignment_detail", pk=sub.assignment_id)


# -------------------------------------------------------------------- fees
@login_required
def invoice_list(request):
    _require(request, ADMIN_ROLES | {"accountant"})
    invoices = Invoice.objects.select_related("student")
    q = request.GET.get("q", "").strip()
    status = request.GET.get("status", "").strip()
    if q:
        invoices = invoices.filter(
            Q(invoice_number__icontains=q) | Q(student__full_name__icontains=q))
    if status:
        invoices = invoices.filter(status=status)
    page = paginate(request, invoices)
    return render(request, "fees/invoice_list.html", {
        "invoices": page, "page_obj": page, "q": q, "status": status,
        "statuses": Invoice.STATUS_CHOICES,
        "filtered": bool(q or status),
    })


@login_required
def invoice_create(request):
    _require(request, ADMIN_ROLES | {"accountant"})
    if request.method == "POST":
        form = forms.InvoiceForm(request.POST, school=request.school)
        if form.is_valid():
            inv = form.save(commit=False)
            inv.school = request.school
            _autofill_invoice(inv)
            inv.save()
            messages.success(request, "Invoice created from fee structure.")
            return redirect("invoice_detail", pk=inv.pk)
    else:
        form = forms.InvoiceForm(school=request.school,
                                 initial={"invoice_date": date.today()})
    return render(request, "generic/form.html",
                  {"form": form, "header": "New invoice", "cancel_url": "/app/invoices/"})


def _autofill_invoice(inv):
    """Build line items from the student's class fee structures."""
    structures = FeeStructure.objects.filter(academic_year=inv.academic_year).filter(
        models_q(inv))
    items, subtotal = [], Decimal("0")
    for s in structures:
        items.append({"fee_type": s.fee_type.name, "description": s.fee_type.name,
                      "amount": float(s.amount), "discount": 0})
        subtotal += s.amount
    inv.line_items = items
    inv.subtotal = subtotal
    inv.grand_total = subtotal
    if not inv.invoice_number:
        inv.invoice_number = f"INV-{date.today():%Y}-{Invoice.all_objects.filter(school=inv.school).count()+1:04d}"


def models_q(inv):
    from django.db.models import Q
    cls = inv.student.current_class_id
    return Q(applicable_class__isnull=True) | Q(applicable_class_id=cls)


def _can_view_invoice(request, inv):
    """Only admins are left on the platform; they see their school's invoices."""
    return request.user.role in ADMIN_ROLES or request.user.role == "super_admin"


@login_required
def invoice_receipt(request, pk):
    """Standalone, print-optimised money receipt (browser -> Save as PDF)."""
    inv = get_object_or_404(Invoice, pk=pk)
    if not _can_view_invoice(request, inv):
        from django.core.exceptions import PermissionDenied
        raise PermissionDenied()
    paid = inv.payments.aggregate(t=Sum("amount_paid"))["t"] or 0
    return render(request, "fees/receipt.html", {
        "inv": inv, "school": request.school, "payments": inv.payments.all(),
        "paid": paid, "due": inv.grand_total - paid,
    })


@login_required
def invoice_detail(request, pk):
    inv = get_object_or_404(Invoice, pk=pk)
    if request.method == "POST":
        form = forms.PaymentForm(request.POST, school=request.school)
        if form.is_valid():
            p = form.save(commit=False)
            p.school = request.school
            p.invoice = inv
            p.received_by = request.user
            p.save()
            paid = inv.payments.aggregate(t=Sum("amount_paid"))["t"] or 0
            inv.status = "paid" if paid >= inv.grand_total else "partially_paid"
            inv.save()
            messages.success(request, "Payment recorded.")
            return redirect("invoice_detail", pk=inv.pk)
    else:
        form = forms.PaymentForm(school=request.school,
                                 initial={"paid_at": timezone.now()})
    paid = inv.payments.aggregate(t=Sum("amount_paid"))["t"] or 0
    return render(request, "fees/invoice_detail.html",
                  {"inv": inv, "payments": inv.payments.all(),
                   "paid": paid, "due": inv.grand_total - paid, "payment_form": form})


# ------------------------------------------------------------------ ratings
@login_required
def rating_dashboard(request):
    _require(request, ADMIN_ROLES)
    data = (TeacherRating.objects
            .values("teacher", "teacher__full_name")
            .annotate(overall=Avg("score_overall"), n=Count("id"))
            .order_by("-overall"))
    return render(request, "ratings/dashboard.html", {"rows": data})


# --------------------------------------------------------------- attendance
@login_required
def attendance_mark(request):
    _require(request, ADMIN_ROLES | {"teacher"})
    from apps.academics.models import Section
    sections = Section.objects.select_related("school_class")
    section_id = request.GET.get("section")
    day = request.GET.get("date") or str(date.today())
    students, existing = [], {}
    section = None
    if section_id:
        section = get_object_or_404(Section, pk=section_id)
        students = Student.objects.filter(current_section=section)
        existing = {a.student_id: a.status for a in
                    StudentAttendance.objects.filter(section=section, date=day)}
    if request.method == "POST":
        section = get_object_or_404(Section, pk=request.POST["section"])
        day = request.POST["date"]
        for s in Student.objects.filter(current_section=section):
            status = request.POST.get(f"status_{s.pk}", "present")
            StudentAttendance.objects.update_or_create(
                student=s, date=day,
                defaults={"school": request.school, "section": section,
                          "status": status, "marked_by": request.user})
        messages.success(request, "Attendance saved.")
        return redirect(f"/app/attendance/?section={section.pk}&date={day}")
    return render(request, "attendance/mark.html",
                  {"sections": sections, "section": section, "students": students,
                   "existing": existing, "day": day})


@login_required
def staff_attendance(request):
    """Manual staff/teacher attendance register for a given date."""
    _require(request, ADMIN_ROLES)
    from apps.attendance.models import StaffAttendance
    day = request.GET.get("date") or str(date.today())
    teachers = TeacherProfile.objects.filter(status="active").select_related("user")
    if request.method == "POST":
        day = request.POST["date"]
        for t in teachers:
            present = request.POST.get(f"present_{t.pk}") == "on"
            check_in = request.POST.get(f"in_{t.pk}") or None
            check_out = request.POST.get(f"out_{t.pk}") or None
            StaffAttendance.objects.update_or_create(
                teacher=t, date=day,
                defaults={"school": request.school, "is_present": present,
                          "check_in": check_in, "check_out": check_out})
        messages.success(request, "Staff attendance saved.")
        return redirect(f"/app/staff-attendance/?date={day}")
    existing = {a.teacher_id: a for a in
                StaffAttendance.objects.filter(date=day)}
    present_count = sum(1 for a in existing.values() if a.is_present)
    return render(request, "attendance/staff.html", {
        "teachers": teachers, "existing": existing, "day": day,
        "present_count": present_count, "total": teachers.count()})


# --------------------------------------------------------------- class routine
@login_required
def class_routine(request):
    """School-admin weekly routine builder for one section."""
    _require(request, ADMIN_ROLES)
    from apps.academics.models import RoutineSlot, Section
    sections = Section.objects.select_related("school_class")
    section_id = request.GET.get("section")
    section, slots, form = None, [], None
    if section_id:
        section = get_object_or_404(Section, pk=section_id)
        if request.method == "POST":
            form = forms.RoutineSlotForm(request.POST, school=request.school)
            if form.is_valid():
                slot = form.save(commit=False)
                slot.school = request.school
                slot.section = section
                slot.save()
                messages.success(request, "Routine slot added.")
                return redirect(f"/app/routine/?section={section.pk}")
        else:
            form = forms.RoutineSlotForm(school=request.school)
        slots = RoutineSlot.objects.filter(section=section).select_related(
            "subject", "teacher__user")
    grid = _routine_grid(slots)
    return render(request, "academics/routine.html", {
        "sections": sections, "section": section, "form": form,
        "grid": grid, "days": RoutineSlot.DAYS})


@login_required
def routine_slot_delete(request, pk):
    _require(request, ADMIN_ROLES)
    from apps.academics.models import RoutineSlot
    slot = get_object_or_404(RoutineSlot, pk=pk)
    section_id = slot.section_id
    slot.delete()
    messages.success(request, "Slot removed.")
    return redirect(f"/app/routine/?section={section_id}")


def _routine_grid(slots):
    """Group routine slots into {day_index: [slots ordered by period]}."""
    grid = {}
    for slot in slots:
        grid.setdefault(slot.day_of_week, []).append(slot)
    for day in grid:
        grid[day].sort(key=lambda s: (s.period, s.start_time))
    return grid


# ------------------------------------------------------- biometric devices
@login_required
def device_settings(request):
    _require(request, ADMIN_ROLES)
    from django.utils.crypto import get_random_string

    from apps.attendance.models import BiometricEnrollment, BiometricPunch
    school = request.school
    if school is None:
        messages.info(request, "Enter a school first.")
        return redirect("dashboard")

    if request.method == "POST":
        action = request.POST.get("action")
        if action == "regenerate":
            school.device_token = get_random_string(40)
            school.save()
            messages.success(request, "New device token generated.")
            return redirect("device_settings")
        form = forms.DeviceSettingsForm(request.POST, instance=school)
        if form.is_valid():
            form.save()  # save() issues a token if a brand was just enabled
            messages.success(request, "Device settings saved.")
            return redirect("device_settings")
    else:
        form = forms.DeviceSettingsForm(instance=school)

    ingest_url = request.build_absolute_uri(reverse("device_punch"))
    punches = BiometricPunch.objects.all()[:20]
    return render(request, "attendance/devices.html", {
        "school": school, "form": form, "ingest_url": ingest_url,
        "punches": punches,
        "unresolved": BiometricPunch.objects.filter(status="unresolved").count(),
        "enrolled": BiometricEnrollment.objects.count(),
    })


# ------------------------------------------------------------------- exams
@login_required
def exam_detail(request, pk):
    _require(request, ADMIN_ROLES)
    exam = get_object_or_404(ExamSession, pk=pk)
    if request.method == "POST":
        form = forms.ExamSubjectForm(request.POST, school=request.school)
        if form.is_valid():
            es = form.save(commit=False)
            es.school = request.school
            es.save()
            messages.success(request, "Exam subject added.")
            return redirect("exam_detail", pk=exam.pk)
    else:
        form = forms.ExamSubjectForm(school=request.school,
                                     initial={"exam_session": exam})
    subjects = (exam.exam_subjects.select_related("subject", "school_class",
                                                  "invigilator")
                .order_by("exam_date", "start_time"))
    classes = sorted({es.school_class for es in subjects},
                     key=lambda c: c.numeric_level)
    return render(request, "exams/detail.html",
                  {"exam": exam, "subjects": subjects, "form": form,
                   "classes": classes})


@login_required
def marks_entry(request, pk):
    """Admin enters marks per subject, keyed by student ID (roll/admission no).

    The saved list is shown sorted highest -> lowest.
    """
    _require(request, ADMIN_ROLES)
    es = get_object_or_404(
        ExamSubject.objects.select_related("subject", "school_class",
                                           "exam_session"), pk=pk)
    students = (Student.objects.filter(current_class=es.school_class)
                .order_by("roll_number", "admission_number"))
    existing = {r.student_id: r for r in es.results.all()}
    if request.method == "POST":
        for s in students:
            raw = request.POST.get(f"marks_{s.pk}", "").strip()
            absent = request.POST.get(f"absent_{s.pk}") == "on"
            if raw == "" and not absent:
                continue
            ExamResult.objects.update_or_create(
                exam_subject=es, student=s,
                defaults={"school": request.school,
                          "marks_obtained": raw or 0,
                          "is_absent": absent,
                          "entered_by": request.user})
        messages.success(request, "Marks saved.")
        return redirect("marks_entry", pk=es.pk)
    ranked = sorted(
        (r for r in existing.values() if not r.is_absent),
        key=lambda r: r.marks_obtained, reverse=True)
    return render(request, "exams/marks.html",
                  {"es": es, "students": students, "existing": existing,
                   "ranked": ranked, "entered": len(existing),
                   "total_students": students.count()})


# ---- exam routine / admit cards / merit / transcript / promotion -----------
def _exam_class(request, exam):
    """Resolve the ?class= filter to one of the exam's classes (or None)."""
    from apps.academics.models import SchoolClass
    class_id = request.GET.get("class")
    if class_id:
        return get_object_or_404(SchoolClass, pk=class_id)
    return None


@login_required
def exam_routine(request, pk):
    """Printable exam routine: date/time, subject+code, hall, guard teacher."""
    _require(request, ADMIN_ROLES)
    exam = get_object_or_404(ExamSession, pk=pk)
    school_class = _exam_class(request, exam)
    subjects = (ExamSubject.objects.filter(exam_session=exam)
                .select_related("subject", "school_class", "invigilator")
                .order_by("exam_date", "start_time"))
    if school_class:
        subjects = subjects.filter(school_class=school_class)
    classes = (exam.exam_subjects.select_related("school_class")
               .order_by("school_class__numeric_level")
               .values_list("school_class_id", "school_class__name").distinct())
    return render(request, "exams/routine.html", {
        "exam": exam, "subjects": subjects, "school_class": school_class,
        "classes": classes, "school": request.school})


@login_required
def exam_admit_cards(request, pk):
    """Printable admit cards — one per student — for an exam session."""
    _require(request, ADMIN_ROLES)
    exam = get_object_or_404(ExamSession, pk=pk)
    school_class = _exam_class(request, exam)
    classes = (exam.exam_subjects.select_related("school_class")
               .order_by("school_class__numeric_level")
               .values_list("school_class_id", "school_class__name").distinct())
    students, subjects = [], []
    if school_class:
        students = (Student.objects.filter(current_class=school_class,
                                           status="active")
                    .order_by("roll_number", "admission_number"))
        subjects = (ExamSubject.objects
                    .filter(exam_session=exam, school_class=school_class)
                    .select_related("subject")
                    .order_by("exam_date", "start_time"))
    return render(request, "exams/admit_cards.html", {
        "exam": exam, "school_class": school_class, "classes": classes,
        "students": students, "subjects": subjects, "school": request.school})


def _merit_rows(exam, school_class):
    """Aggregate results for one class: totals, %, grade, pass/fail, rank.

    Returns (rows, subjects, complete). Rows are sorted highest total first;
    `complete` is True once every active student has a result for every paper.
    """
    from apps.exams.grading import grade_for
    subjects = list(ExamSubject.objects
                    .filter(exam_session=exam, school_class=school_class)
                    .select_related("subject")
                    .order_by("exam_date", "start_time"))
    students = list(Student.objects
                    .filter(current_class=school_class, status="active")
                    .order_by("roll_number", "admission_number"))
    results = (ExamResult.objects.filter(exam_subject__in=subjects)
               .select_related("exam_subject"))
    by_student = {}
    for r in results:
        by_student.setdefault(r.student_id, {})[r.exam_subject_id] = r

    total_possible = sum(es.total_marks for es in subjects)
    rows = []
    for s in students:
        marks = by_student.get(s.pk, {})
        cells, total, passed_all = [], 0.0, bool(subjects)
        for es in subjects:
            r = marks.get(es.pk)
            if r is None or r.is_absent:
                cells.append({"es": es, "result": r, "obtained": None,
                              "grade": "—" if r is None else "F (absent)",
                              "passed": False})
                passed_all = False
                continue
            obtained = float(r.marks_obtained)
            total += obtained
            sub_pct = obtained / es.total_marks * 100 if es.total_marks else 0
            letter, point = grade_for(sub_pct)
            sub_pass = obtained >= es.pass_marks
            passed_all = passed_all and sub_pass
            cells.append({"es": es, "result": r, "obtained": obtained,
                          "grade": letter, "point": point, "passed": sub_pass})
        pct = total / total_possible * 100 if total_possible else 0
        letter, gpa = grade_for(pct)
        if not passed_all:
            letter, gpa = "F", 0.0
        rows.append({"student": s, "cells": cells, "total": total,
                     "percentage": round(pct, 2), "grade": letter, "gpa": gpa,
                     "passed": passed_all, "entered": len(marks),
                     "expected": len(subjects)})
    rows.sort(key=lambda r: r["total"], reverse=True)
    for i, row in enumerate(rows, start=1):
        row["rank"] = i
    complete = bool(rows) and all(r["entered"] == r["expected"] for r in rows)
    return rows, subjects, complete


@login_required
def exam_merit(request, pk):
    """Merit table — every student of a class ranked first to last."""
    _require(request, ADMIN_ROLES)
    exam = get_object_or_404(ExamSession, pk=pk)
    school_class = _exam_class(request, exam)
    classes = (exam.exam_subjects.select_related("school_class")
               .order_by("school_class__numeric_level")
               .values_list("school_class_id", "school_class__name").distinct())
    rows, subjects, complete = ([], [], False)
    if school_class:
        rows, subjects, complete = _merit_rows(exam, school_class)
    return render(request, "exams/merit.html", {
        "exam": exam, "school_class": school_class, "classes": classes,
        "rows": rows, "subjects": subjects, "complete": complete,
        "school": request.school})


@login_required
def exam_transcript(request, pk, student_pk):
    """Printable transcript for one student, with class rank."""
    _require(request, ADMIN_ROLES)
    exam = get_object_or_404(ExamSession, pk=pk)
    student = get_object_or_404(Student, pk=student_pk)
    rows, subjects, complete = _merit_rows(exam, student.current_class)
    row = next((r for r in rows if r["student"].pk == student.pk), None)
    if row is None:
        messages.error(request, "No results for this student in this exam.")
        return redirect("exam_merit", pk=exam.pk)
    return render(request, "exams/transcript.html", {
        "exam": exam, "s": student, "row": row, "subjects": subjects,
        "complete": complete, "total_students": len(rows),
        "school": request.school})


@login_required
def exam_promote(request, pk):
    """After the final exam: promote passed students to the next class and
    re-number their rolls by merit rank (highest percentage = roll 1)."""
    from apps.academics.models import SchoolClass
    from apps.exams.models import StudentPromotion
    _require(request, ADMIN_ROLES)
    exam = get_object_or_404(ExamSession, pk=pk)
    school_class = _exam_class(request, exam)
    classes = (exam.exam_subjects.select_related("school_class")
               .order_by("school_class__numeric_level")
               .values_list("school_class_id", "school_class__name").distinct())

    ctx = {"exam": exam, "school_class": school_class, "classes": classes,
           "school": request.school}
    if not exam.is_final:
        return render(request, "exams/promote.html",
                      {**ctx, "not_final": True})
    if not school_class:
        return render(request, "exams/promote.html", ctx)

    next_class = (SchoolClass.objects
                  .filter(numeric_level__gt=school_class.numeric_level)
                  .order_by("numeric_level").first())
    rows, subjects, complete = _merit_rows(exam, school_class)
    already = StudentPromotion.objects.filter(
        exam_session=exam, from_class=school_class).select_related(
        "student", "to_class")

    if request.method == "POST" and next_class and complete and not already.exists():
        passed = [r for r in rows if r["passed"]]
        rank = 0
        for r in rows:
            promote = r["passed"]
            if promote:
                rank += 1
                student = r["student"]
                student.current_class = next_class
                student.current_section = None
                student.roll_number = str(rank)
                student.save(update_fields=["current_class", "current_section",
                                            "roll_number"])
            StudentPromotion.objects.create(
                school=request.school, exam_session=exam,
                student=r["student"], from_class=school_class,
                to_class=next_class if promote else school_class,
                percentage=r["percentage"], rank=r["rank"],
                promoted=promote, promoted_by=request.user)
        messages.success(
            request,
            f"Promoted {len(passed)} of {len(rows)} students to "
            f"{next_class.name}; ranks assigned by percentage.")
        return redirect(f"{reverse('exam_promote', args=[exam.pk])}"
                        f"?class={school_class.pk}")

    return render(request, "exams/promote.html", {
        **ctx, "rows": rows, "subjects": subjects, "complete": complete,
        "next_class": next_class, "already": already,
        "passed_count": sum(1 for r in rows if r["passed"]),
    })


# ------------------------------------------------------------ super admin
@login_required
def tenant_list(request):
    _require(request, {"super_admin"})
    schools = School.all_objects.order_by("-created_at")
    q = request.GET.get("q", "").strip()
    status = request.GET.get("status", "").strip()
    if q:
        schools = schools.filter(
            Q(name__icontains=q) | Q(slug__icontains=q) | Q(admin_email__icontains=q))
    if status:
        schools = schools.filter(status=status)
    page = paginate(request, schools)
    return render(request, "superadmin/tenants.html", {
        "schools": page, "page_obj": page, "q": q, "status": status,
        "statuses": School.STATUS_CHOICES, "filtered": bool(q or status)})


@login_required
def school_create(request):
    """Super Admin manually provisions a school (+ its admin login)."""
    _require(request, {"super_admin"})
    lead = ContactMessage.objects.filter(pk=request.GET.get("lead")).first()
    if request.method == "POST":
        form = forms.SchoolCreateForm(request.POST)
        if form.is_valid():
            school = form.save()
            lead_id = request.POST.get("lead_id")
            if lead_id:
                ContactMessage.objects.filter(pk=lead_id).update(
                    is_handled=True, converted_school=school)
            messages.success(
                request, f"School '{school.name}' created. Admin can now sign in.")
            return redirect("tenant_detail", pk=school.pk)
    else:
        initial = {}
        if lead:
            initial = {"school_name": lead.school_name, "admin_name": lead.name,
                       "admin_email": lead.email, "phone": lead.phone}
        form = forms.SchoolCreateForm(initial=initial)
    return render(request, "superadmin/school_form.html",
                  {"form": form, "lead": lead})


@login_required
def enter_school(request, pk):
    """Super Admin enters a tenant's workspace (full admin/teacher/... access)."""
    _require(request, {"super_admin"})
    school = get_object_or_404(School.all_objects, pk=pk)
    request.session["active_school_id"] = school.pk
    messages.success(request, f"You're now managing {school.name}.")
    return redirect("dashboard")


@login_required
def exit_school(request):
    """Super Admin leaves the tenant workspace, back to the platform view."""
    request.session.pop("active_school_id", None)
    return redirect("dashboard")


# ---- Contact messages / leads: full CRUD (Super Admin) ---------------------
@login_required
def lead_list(request):
    _require(request, {"super_admin"})
    leads = ContactMessage.objects.all()
    q = request.GET.get("q", "").strip()
    status = request.GET.get("status", "").strip()
    if q:
        leads = leads.filter(
            Q(name__icontains=q) | Q(email__icontains=q)
            | Q(phone__icontains=q) | Q(school_name__icontains=q))
    if status == "open":
        leads = leads.filter(is_handled=False)
    elif status == "handled":
        leads = leads.filter(is_handled=True)
    page = paginate(request, leads)
    return render(request, "superadmin/leads.html", {
        "leads": page, "page_obj": page, "q": q, "status": status,
        "open_count": ContactMessage.objects.filter(is_handled=False).count(),
        "filtered": bool(q or status)})


@login_required
def lead_detail(request, pk):
    _require(request, {"super_admin"})
    lead = get_object_or_404(ContactMessage, pk=pk)
    return render(request, "superadmin/lead_detail.html", {"lead": lead})


@login_required
def lead_form(request, pk=None):
    _require(request, {"super_admin"})
    lead = get_object_or_404(ContactMessage, pk=pk) if pk else None
    if request.method == "POST":
        form = forms.ContactMessageForm(request.POST, instance=lead)
        if form.is_valid():
            obj = form.save()
            messages.success(request, "Message saved.")
            return redirect("lead_detail", pk=obj.pk)
    else:
        form = forms.ContactMessageForm(instance=lead)
    return render(request, "superadmin/lead_form.html",
                  {"form": form, "lead": lead})


@login_required
def lead_delete(request, pk):
    _require(request, {"super_admin"})
    lead = get_object_or_404(ContactMessage, pk=pk)
    if request.method == "POST":
        lead.delete()
        messages.success(request, "Message deleted.")
        return redirect("lead_list")
    return render(request, "generic/confirm_delete.html",
                  {"object": lead, "cancel_url": reverse("lead_list")})


@login_required
def lead_handled(request, pk):
    """Toggle handled/unhandled; ?state=open re-opens."""
    _require(request, {"super_admin"})
    lead = get_object_or_404(ContactMessage, pk=pk)
    lead.is_handled = request.GET.get("state") != "open"
    lead.save(update_fields=["is_handled"])
    messages.success(request, "Marked handled." if lead.is_handled else "Re-opened.")
    return redirect(request.META.get("HTTP_REFERER") or reverse("lead_list"))


@login_required
def tenant_detail(request, pk):
    _require(request, {"super_admin"})
    school = get_object_or_404(School.all_objects, pk=pk)
    if request.method == "POST":
        action = request.POST.get("action")
        if action in dict(School.STATUS_CHOICES):
            school.status = action
            school.save()
            messages.success(request, f"Status set to {school.get_status_display()}.")
        return redirect("tenant_detail", pk=school.pk)
    from apps.students.models import Student as S
    stats = {
        "students": S.all_objects.filter(school=school).count(),
        "teachers": TeacherProfile.all_objects.filter(school=school).count(),
    }
    return render(request, "superadmin/tenant_detail.html",
                  {"school": school, "stats": stats,
                   "statuses": School.STATUS_CHOICES})


class PlanListView:  # placeholder to satisfy imports if needed
    pass


@login_required
def plan_list(request):
    _require(request, {"super_admin"})
    plans = SubscriptionPlan.objects.all()
    return render(request, "superadmin/plans.html", {"plans": plans})


@login_required
def plan_edit(request, pk=None):
    _require(request, {"super_admin"})
    plan = SubscriptionPlan.objects.filter(pk=pk).first() if pk else None
    if request.method == "POST":
        form = forms.SubscriptionPlanForm(request.POST, instance=plan)
        if form.is_valid():
            form.save()
            messages.success(request, "Plan saved.")
            return redirect("plan_list")
    else:
        form = forms.SubscriptionPlanForm(instance=plan)
    return render(request, "generic/form.html",
                  {"form": form, "header": "Plan", "cancel_url": "/app/plans/"})


# --------------------------------------------------------------- misc pages
@login_required
def notification_list(request):
    notes = Notification.objects.filter(recipient=request.user)
    page = paginate(request, notes, per_page=20)
    return render(request, "misc/notifications.html",
                  {"notes": page, "page_obj": page})


@login_required
def onboarding(request):
    _require(request, ADMIN_ROLES)
    from apps.academics.models import SchoolClass
    from apps.fees.models import FeeType
    school = request.school
    if school is None:
        # Super Admin with no tenant selected — send them to pick one.
        messages.info(request, "Enter a school first to run its setup wizard.")
        return redirect("tenant_list")
    steps = {
        "profile": bool(school.logo) or bool(school.address),
        "academics": SchoolClass.objects.exists(),
        "fees": FeeType.objects.exists(),
        "teacher": TeacherProfile.objects.exists(),
        "students": Student.objects.exists(),
    }
    done = sum(steps.values())
    return render(request, "misc/onboarding.html",
                  {"steps": steps, "done": done, "total": len(steps)})


@login_required
def settings_page(request):
    return render(request, "misc/settings.html", {"school": request.school})
