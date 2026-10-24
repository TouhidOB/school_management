"""API viewsets.

Three tiers:
* Tenant-scoped resources -> `SchoolScopedViewSet` (auto-filtered by the
  caller's effective school; Super Admin picks the school via X-Active-School).
* Platform resources (schools, leads, plans, stats) -> `IsSuperAdmin`, operate
  across all tenants with `all_objects`.
* Public admissions -> `AllowAny`.
"""
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.academics.models import (
    AcademicYear, RoutineSlot, SchoolClass, Section, Subject,
)
from apps.attendance.models import (
    BiometricEnrollment, BiometricPunch, LeaveApplication,
    StaffAttendance, StudentAttendance,
)
from apps.exams.models import ExamResult, ExamSession, ExamSubject, StudentPromotion
from apps.fees.models import (
    FeeStructure, FeeType, Invoice, InvoiceLineItem, Payment, StudentFeeDiscount,
)
from apps.notifications.models import Notification
from apps.ratings.models import RatingPeriod, TeacherRating, TeacherRatingAggregate
from apps.rooms.models import (
    Assignment, AssignmentSubmission, ClassRoom, Note, RoomMembership, RoomPost,
)
from apps.students.models import (
    AdmissionApplication, Certificate, Guardian, Student, StudentTransfer,
)
from apps.teachers.models import Designation, TeacherProfile
from apps.tenants.models import ContactMessage, School, SubscriptionPlan

from apps.core.api import SchoolScopedViewSet, get_active_school
from apps.core.permissions import IsSuperAdmin
from . import serializers as s

User = get_user_model()

def _compute_merit(session):
    """Rank a session's students by total marks. Returns list of dicts sorted
    by total desc, with rank + percentage."""
    results = (ExamResult.objects
               .filter(exam_subject__exam_session=session)
               .select_related("student", "exam_subject"))
    agg = {}
    for r in results:
        a = agg.setdefault(r.student_id, {
            "student_id": r.student_id,
            "student_name": r.student.full_name,
            "current_class_id": r.student.current_class_id,
            "obtained": 0.0, "possible": 0,
        })
        a["obtained"] += float(r.marks_obtained or 0)
        a["possible"] += int(r.exam_subject.total_marks or 0)
    rows = list(agg.values())
    for a in rows:
        a["percentage"] = round(a["obtained"] / a["possible"] * 100, 2) if a["possible"] else 0
    rows.sort(key=lambda x: x["obtained"], reverse=True)
    for i, a in enumerate(rows, start=1):
        a["rank"] = i
    return rows


class ExamSessionViewSet(SchoolScopedViewSet):
    required_module = "exams"
    queryset = ExamSession.objects.select_related("academic_year").all()
    serializer_class = s.ExamSessionSerializer
    filterset_fields = ["academic_year", "is_published"]
    search_fields = ["name"]

    @action(detail=True, methods=["get"])
    def routine(self, request, pk=None):
        """Exam schedule: subjects with date/time/room, ordered by date."""
        session = self.get_object()
        subs = (ExamSubject.objects
                .filter(exam_session=session)
                .select_related("subject", "school_class")
                .order_by("exam_date", "start_time"))
        return Response(s.ExamSubjectSerializer(subs, many=True).data)

    @action(detail=True, methods=["get"])
    def merit(self, request, pk=None):
        """Merit list — students ranked by total marks across the session."""
        return Response(_compute_merit(self.get_object()))

    @action(detail=True, methods=["get"], url_path=r"transcript/(?P<student_pk>\d+)")
    def transcript(self, request, pk=None, student_pk=None):
        """One student's full mark sheet for this session."""
        session = self.get_object()
        results = (ExamResult.objects
                   .filter(exam_subject__exam_session=session, student_id=student_pk)
                   .select_related("exam_subject", "exam_subject__subject", "student"))
        student = Student.objects.filter(pk=student_pk).first()
        lines = [{
            "subject": r.exam_subject.subject.name if r.exam_subject.subject_id else "—",
            "total_marks": r.exam_subject.total_marks,
            "pass_marks": r.exam_subject.pass_marks,
            "marks_obtained": r.marks_obtained,
            "grade": r.grade,
            "is_absent": r.is_absent,
        } for r in results]
        obtained = sum(float(l["marks_obtained"] or 0) for l in lines)
        possible = sum(int(l["total_marks"] or 0) for l in lines)
        return Response({
            "student": student.full_name if student else None,
            "student_id": int(student_pk),
            "session": session.name,
            "lines": lines,
            "total_obtained": obtained,
            "total_possible": possible,
            "percentage": round(obtained / possible * 100, 2) if possible else 0,
        })

    @action(detail=True, methods=["post"])
    def promote(self, request, pk=None):
        """Create StudentPromotion rows from the merit list. `move=true` also
        advances each promoted student to the next class (by numeric_level)."""
        from apps.academics.models import SchoolClass  # noqa: PLC0415
        session = self.get_object()
        move = bool(request.data.get("move"))
        pass_pct = float(request.data.get("pass_percentage", 33))
        classes = list(SchoolClass.objects.order_by("numeric_level"))
        next_of = {}
        for i, c in enumerate(classes):
            next_of[c.id] = classes[i + 1].id if i + 1 < len(classes) else None

        created = 0
        for row in _compute_merit(session):
            promoted = row["percentage"] >= pass_pct
            to_class_id = next_of.get(row["current_class_id"]) if promoted else row["current_class_id"]
            obj, _ = StudentPromotion.objects.update_or_create(
                exam_session=session, student_id=row["student_id"],
                defaults=dict(
                    school=session.school,
                    from_class_id=row["current_class_id"],
                    to_class_id=to_class_id,
                    percentage=row["percentage"], rank=row["rank"],
                    promoted=promoted, promoted_by=request.user,
                ),
            )
            created += 1
            if move and promoted and to_class_id:
                Student.objects.filter(pk=row["student_id"]).update(current_class_id=to_class_id)
        return Response({"processed": created, "moved": move})


class ExamSubjectViewSet(SchoolScopedViewSet):
    required_module = "exams"
    queryset = ExamSubject.objects.select_related("subject", "school_class").all()
    serializer_class = s.ExamSubjectSerializer
    filterset_fields = ["exam_session", "school_class", "subject"]


class ExamResultViewSet(SchoolScopedViewSet):
    required_module = "exams"
    queryset = ExamResult.objects.select_related("student").all()
    serializer_class = s.ExamResultSerializer
    filterset_fields = ["exam_subject", "student"]

    def perform_create(self, serializer):
        serializer.save(school=self._active_school, entered_by=self.request.user)


class StudentPromotionViewSet(SchoolScopedViewSet):
    required_module = "exams"
    queryset = StudentPromotion.objects.select_related("student").all()
    serializer_class = s.StudentPromotionSerializer
    filterset_fields = ["exam_session", "student"]

    def perform_create(self, serializer):
        serializer.save(school=self._active_school, promoted_by=self.request.user)



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.students.models import Student
from apps.academics.models import SchoolClass
from apps.exams.models import ExamResult, StudentPromotion

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_annual_results(request):
    academic_year_id = request.query_params.get("academic_year")
    class_id = request.query_params.get("class_id")
    active_school = get_active_school(request)
    school = active_school.id if active_school else None
    if not school:
        school = request.user.school_id or 4
    
    if not academic_year_id or not class_id:
        return Response({"error": "Missing params"}, status=400)
        
    results = (ExamResult.objects
               .filter(student__school_id=school, 
                       student__current_class_id=class_id,
                       exam_subject__exam_session__academic_year_id=academic_year_id)
               .select_related("student", "exam_subject"))
               
    agg = {}
    for r in results:
        a = agg.setdefault(r.student_id, {
            "student_id": r.student_id,
            "student_name": r.student.full_name,
            "roll_number": r.student.roll_number,
            "current_class_id": r.student.current_class_id,
            "obtained": 0.0, "possible": 0,
            "total_subjects": 0,
            "failed_subjects": 0,
        })
        a["obtained"] += float(r.marks_obtained or 0)
        a["possible"] += int(r.exam_subject.total_marks or 0)
        a["total_subjects"] += 1
        pass_marks = r.exam_subject.pass_marks or 33
        if float(r.marks_obtained or 0) < pass_marks:
            a["failed_subjects"] += 1
        
    rows = list(agg.values())
    
    from apps.fees.models import Invoice, InvoiceLineItem, FeeType, Payment
    from apps.academics.models import AcademicYear
    from apps.students.models import Student
    from django.utils import timezone
    from datetime import timedelta

    ay = AcademicYear.objects.filter(pk=academic_year_id, school_id=school).first()
    fee_type, _ = FeeType.objects.get_or_create(
        school_id=school,
        name="Conditional Promotion Fee",
        defaults={
            "fee_category": "custom",
            "frequency": "onetime",
            "is_mandatory": True,
            "is_active": True,
        }
    )

    from apps.fees.models import FeeStructure
    configured_fee = FeeStructure.objects.filter(
        school_id=school,
        academic_year_id=academic_year_id,
        fee_type=fee_type
    ).first()
    default_amount = float(configured_fee.amount) if configured_fee else 500.0

    promo_invoices = {}
    for inv in (Invoice.objects
                .filter(school_id=school, 
                        academic_year_id=academic_year_id,
                        line_items__fee_type=fee_type)
                .prefetch_related("line_items", "payments")):
        promo_invoices[inv.student_id] = inv

    for a in rows:
        a["percentage"] = round(a["obtained"] / a["possible"] * 100, 2) if a["possible"] else 0
        tot = a["total_subjects"]
        fails = a["failed_subjects"]
        if fails == 0 and a["percentage"] >= 33:
            a["status"] = "Pass"
            a["fee_required"] = False
            a["fee_status"] = "Not Required"
            a["fee_amount"] = 0
            a["due_amount"] = 0
            a["invoice_id"] = None
            a["invoice_number"] = None
            a["is_promotable"] = True
        else:
            if fails > 0 and tot > 0 and fails <= (tot / 2) and a["percentage"] >= 33:
                a["status"] = "Partial"
            else:
                a["status"] = "Fail"
            
            a["fee_required"] = True
            inv = promo_invoices.get(a["student_id"])
            if not inv and ay:
                # Automatically add conditional promotion fee to Accounts
                student_obj = Student.objects.filter(pk=a["student_id"], school_id=school).first()
                if student_obj:
                    inv_num = f"INV-PROM-{academic_year_id}-{a['student_id']}"
                    if Invoice.objects.filter(school_id=school, invoice_number=inv_num).exists():
                        inv_num = f"INV-PROM-{academic_year_id}-{a['student_id']}-{timezone.now().strftime('%H%M%S')}"
                    inv = Invoice.objects.create(
                        school_id=school,
                        student=student_obj,
                        academic_year=ay,
                        invoice_number=inv_num,
                        invoice_date=timezone.now().date(),
                        due_date=timezone.now().date() + timedelta(days=14),
                        subtotal=default_amount,
                        grand_total=default_amount,
                        status="sent",
                    )
                    InvoiceLineItem.objects.create(
                        invoice=inv,
                        fee_type=fee_type,
                        description=f"Conditional Promotion Fee - Academic Year {ay.name}",
                        amount=default_amount,
                    )
                    promo_invoices[a["student_id"]] = inv

            if inv:
                a["invoice_id"] = inv.id
                a["invoice_number"] = inv.invoice_number
                a["fee_amount"] = float(inv.subtotal) if float(inv.subtotal) > 0 else float(inv.grand_total)
                
                paid_sum = sum(float(p.amount_paid) for p in inv.payments.all())
                is_waived = (inv.status == "paid" and float(inv.grand_total) == 0 and float(inv.total_discount) > 0)
                is_paid = (inv.status == "paid" and not is_waived)
                
                if is_waived:
                    a["fee_status"] = "Waived"
                    a["due_amount"] = 0.0
                    a["is_promotable"] = True
                elif is_paid:
                    a["fee_status"] = "Paid"
                    a["due_amount"] = 0.0
                    a["is_promotable"] = True
                else:
                    a["fee_status"] = "Unpaid"
                    a["due_amount"] = max(0.0, float(inv.grand_total) - paid_sum)
                    a["is_promotable"] = False
            else:
                a["invoice_id"] = None
                a["invoice_number"] = None
                a["fee_amount"] = default_amount
                a["due_amount"] = default_amount
                a["fee_status"] = "Unpaid"
                a["is_promotable"] = False
        
    rows.sort(key=lambda x: x["obtained"], reverse=True)
    for i, a in enumerate(rows, start=1):
        a["rank"] = i
        
    return Response(rows)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def issue_promotion_fee(request):
    active_school = get_active_school(request)
    school = active_school.id if active_school else None
    if not school:
        school = request.user.school_id or 4

    academic_year_id = request.data.get("academic_year")
    student_id = request.data.get("student_id")
    student_ids = request.data.get("student_ids")
    if not student_ids:
        student_ids = [student_id] if student_id else []
    
    amount = float(request.data.get("amount", 500))

    if not academic_year_id or not student_ids:
        return Response({"error": "Missing academic_year or student_ids"}, status=400)

    from apps.fees.models import FeeType, FeeStructure, Invoice, InvoiceLineItem
    from apps.academics.models import AcademicYear
    from apps.students.models import Student
    from django.utils import timezone
    from datetime import timedelta

    ay = AcademicYear.objects.filter(pk=academic_year_id, school_id=school).first()
    if not ay:
        return Response({"error": "Academic year not found"}, status=404)

    fee_type, _ = FeeType.objects.get_or_create(
        school_id=school,
        name="Conditional Promotion Fee",
        defaults={
            "fee_category": "custom",
            "frequency": "seasonal",
            "is_mandatory": True,
            "is_active": True,
        }
    )

    # Ensure fee structure exists in the payment structure section
    fee_structure, _ = FeeStructure.objects.get_or_create(
        school_id=school,
        fee_type=fee_type,
        academic_year=ay,
        applicable_class=None,
        applicable_student=None,
        defaults={"amount": amount}
    )

    invoices_created = []
    for s_id in student_ids:
        student = Student.objects.filter(pk=s_id, school_id=school).first()
        if not student:
            continue

        existing = Invoice.objects.filter(
            school_id=school,
            student_id=s_id,
            academic_year_id=academic_year_id,
            line_items__fee_type=fee_type
        ).first()

        if existing:
            invoices_created.append({
                "invoice_id": existing.id,
                "invoice_number": existing.invoice_number,
                "student_id": s_id,
                "status": existing.status,
                "amount": float(existing.grand_total)
            })
            continue

        inv_num = f"INV-PROM-{academic_year_id}-{s_id}"
        if Invoice.objects.filter(school_id=school, invoice_number=inv_num).exists():
            inv_num = f"INV-PROM-{academic_year_id}-{s_id}-{timezone.now().strftime('%H%M%S')}"

        inv = Invoice.objects.create(
            school_id=school,
            student=student,
            academic_year=ay,
            invoice_number=inv_num,
            invoice_date=timezone.now().date(),
            due_date=timezone.now().date() + timedelta(days=14),
            subtotal=amount,
            grand_total=amount,
            status="sent",
        )
        InvoiceLineItem.objects.create(
            invoice=inv,
            fee_type=fee_type,
            description=f"Conditional Promotion Fee - Academic Year {ay.name}",
            amount=amount,
        )
        invoices_created.append({
            "invoice_id": inv.id,
            "invoice_number": inv.invoice_number,
            "student_id": s_id,
            "status": inv.status,
            "amount": float(inv.grand_total)
        })

    return Response({
        "success": True,
        "count": len(invoices_created),
        "invoices": invoices_created
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def settle_promotion_fee(request):
    active_school = get_active_school(request)
    school = active_school.id if active_school else None
    if not school:
        school = request.user.school_id or 4

    academic_year_id = request.data.get("academic_year")
    student_id = request.data.get("student_id")
    student_ids = request.data.get("student_ids")
    settlement_type = request.data.get("settlement_type", "pay")  # 'pay' or 'waive'
    payment_method = request.data.get("payment_method", "cash")
    transaction_id = request.data.get("transaction_id", "")
    reason = request.data.get("reason", "")
    amount_paid_override = request.data.get("amount")

    if not student_ids:
        student_ids = [student_id] if student_id else []

    if not academic_year_id or not student_ids:
        return Response({"error": "Missing academic_year or student_ids"}, status=400)

    from apps.fees.models import FeeType, FeeStructure, Invoice, InvoiceLineItem, Payment
    from apps.academics.models import AcademicYear
    from apps.students.models import Student
    from django.utils import timezone
    from datetime import timedelta

    ay = AcademicYear.objects.filter(pk=academic_year_id, school_id=school).first()
    if not ay:
        return Response({"error": "Academic year not found"}, status=404)

    fee_type, _ = FeeType.objects.get_or_create(
        school_id=school,
        name="Conditional Promotion Fee",
        defaults={
            "fee_category": "custom",
            "frequency": "seasonal",
            "is_mandatory": True,
            "is_active": True,
        }
    )

    configured_fee = FeeStructure.objects.filter(
        school_id=school,
        academic_year=ay,
        fee_type=fee_type
    ).first()
    fee_amount = float(configured_fee.amount) if configured_fee else 500.0

    settled_results = []
    for s_id in student_ids:
        student = Student.objects.filter(pk=s_id, school_id=school).first()
        if not student:
            continue

        invoice = Invoice.objects.filter(
            school_id=school,
            student=student,
            academic_year=ay,
            line_items__fee_type=fee_type
        ).first()

        if not invoice:
            inv_num = f"INV-PROM-{academic_year_id}-{s_id}"
            if Invoice.objects.filter(school_id=school, invoice_number=inv_num).exists():
                inv_num = f"INV-PROM-{academic_year_id}-{s_id}-{timezone.now().strftime('%H%M%S')}"
            invoice = Invoice.objects.create(
                school_id=school,
                student=student,
                academic_year=ay,
                invoice_number=inv_num,
                invoice_date=timezone.now().date(),
                due_date=timezone.now().date() + timedelta(days=14),
                subtotal=fee_amount,
                grand_total=fee_amount,
                status="sent",
            )
            InvoiceLineItem.objects.create(
                invoice=invoice,
                fee_type=fee_type,
                description=f"Conditional Promotion Fee - Academic Year {ay.name}",
                amount=fee_amount,
            )

        if settlement_type == "waive":
            waiver_text = reason or f"Fee waived by {request.user.get_full_name() or request.user.username or 'Admin'}"
            invoice.total_discount = invoice.subtotal
            invoice.grand_total = 0
            invoice.status = "paid"
            invoice.save(update_fields=["total_discount", "grand_total", "status"])

            for li in invoice.line_items.all():
                li.discount = li.amount
                li.description = f"Conditional Promotion Fee - Academic Year {ay.name} [WAIVED: {waiver_text}]"
                li.save(update_fields=["discount", "description"])

            settled_results.append({
                "student_id": s_id,
                "student_name": student.full_name,
                "invoice_id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "status": "Waived",
                "reason": waiver_text
            })
        else:  # "pay"
            pay_amt = float(amount_paid_override) if amount_paid_override is not None else float(invoice.grand_total)
            if pay_amt <= 0 and float(invoice.grand_total) > 0:
                pay_amt = float(invoice.grand_total)

            txn = transaction_id or f"TXN-PROM-{invoice.id}-{timezone.now().strftime('%M%S')}"
            Payment.objects.create(
                school_id=school,
                invoice=invoice,
                amount_paid=pay_amt,
                payment_method=payment_method,
                transaction_id=txn,
                paid_at=timezone.now(),
                received_by=request.user,
            )
            invoice.status = "paid"
            invoice.save(update_fields=["status"])

            settled_results.append({
                "student_id": s_id,
                "student_name": student.full_name,
                "invoice_id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "status": "Paid",
                "amount_paid": pay_amt,
                "payment_method": payment_method,
                "transaction_id": txn
            })

    return Response({
        "success": True,
        "settlement_type": settlement_type,
        "settled_count": len(settled_results),
        "results": settled_results,
        "message": f"Successfully settled {len(settled_results)} student(s) via {'Waiver' if settlement_type == 'waive' else 'Payment'}."
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def pay_promotion_fee(request):
    return settle_promotion_fee(request)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def annual_promote(request):
    academic_year_id = request.data.get("academic_year")
    class_id = request.data.get("class_id")
    pass_pct = float(request.data.get("pass_percentage", 33))
    move = bool(request.data.get("move"))
    active_school = get_active_school(request)
    school = active_school.id if active_school else None
    if not school:
        school = request.user.school_id or 4
    
    if not academic_year_id or not class_id:
        return Response({"error": "Missing params"}, status=400)
        
    results = (ExamResult.objects
               .filter(student__school_id=school, 
                       student__current_class_id=class_id,
                       exam_subject__exam_session__academic_year_id=academic_year_id)
               .select_related("student", "exam_subject"))
               
    agg = {}
    for r in results:
        a = agg.setdefault(r.student_id, {
            "student_id": r.student_id,
            "current_class_id": r.student.current_class_id,
            "obtained": 0.0, "possible": 0,
            "total_subjects": 0,
            "failed_subjects": 0,
        })
        a["obtained"] += float(r.marks_obtained or 0)
        a["possible"] += int(r.exam_subject.total_marks or 0)
        a["total_subjects"] += 1
        pass_marks = r.exam_subject.pass_marks or 33
        if float(r.marks_obtained or 0) < pass_marks:
            a["failed_subjects"] += 1
        
    from apps.fees.models import Invoice
    promo_invoices = {
        inv.student_id: inv
        for inv in Invoice.objects.filter(
            school_id=school,
            academic_year_id=academic_year_id,
            line_items__fee_type__name="Conditional Promotion Fee"
        )
    }

    rows = list(agg.values())
    for a in rows:
        a["percentage"] = round(a["obtained"] / a["possible"] * 100, 2) if a["possible"] else 0
        tot = a["total_subjects"]
        fails = a["failed_subjects"]
        if fails == 0 and a["percentage"] >= pass_pct:
            a["status"] = "Pass"
        elif fails > 0 and tot > 0 and fails <= (tot / 2) and a["percentage"] >= pass_pct:
            a["status"] = "Partial"
        else:
            a["status"] = "Fail"
        
        inv = promo_invoices.get(a["student_id"])
        a["fee_paid"] = (inv is not None and inv.status == "paid")
        
    from apps.academics.models import AcademicYear, SchoolClass, Section
    from datetime import date, timedelta
    import re

    curr_year = AcademicYear.objects.filter(pk=academic_year_id, school_id=school).first()
    next_year = None
    if curr_year:
        name = curr_year.name.strip()
        next_name = None
        if name.isdigit():
            next_name = str(int(name) + 1)
        elif "-" in name:
            parts = name.split("-")
            if len(parts) == 2 and parts[0].strip().isdigit() and parts[1].strip().isdigit():
                y1 = int(parts[0].strip()) + 1
                y2 = int(parts[1].strip()) + 1
                next_name = f"{y1}-{y2}"
        if not next_name:
            nums = re.findall(r"\d+", name)
            if nums:
                last_num = nums[-1]
                inc = str(int(last_num) + 1)
                idx = name.rfind(last_num)
                next_name = name[:idx] + inc + name[idx + len(last_num):]
            else:
                next_name = f"{name} (Next)"

        if curr_year.start_date and curr_year.end_date:
            try:
                start_d = curr_year.start_date.replace(year=curr_year.start_date.year + 1)
                end_d = curr_year.end_date.replace(year=curr_year.end_date.year + 1)
            except Exception:
                start_d = curr_year.start_date + timedelta(days=365)
                end_d = curr_year.end_date + timedelta(days=365)
        else:
            y_val = int(next_name) if next_name.isdigit() else 2027
            start_d = date(y_val, 1, 1)
            end_d = date(y_val, 12, 31)

        next_year, _ = AcademicYear.objects.get_or_create(
            school_id=school,
            name=next_name,
            defaults={
                "start_date": start_d,
                "end_date": end_d,
                "is_current": False,
            }
        )

    classes = list(SchoolClass.objects.filter(school_id=school).order_by("numeric_level"))
    next_of = {}
    for i, c in enumerate(classes):
        next_of[c.id] = classes[i + 1].id if i + 1 < len(classes) else None
        
    from apps.exams.models import ExamSession
    session = ExamSession.objects.filter(academic_year_id=academic_year_id, school_id=school).order_by('-id').first()

    # Sort rows by merit: percentage descending, then total obtained descending
    rows.sort(key=lambda x: (x.get("percentage", 0), x.get("obtained", 0)), reverse=True)
    for rank_idx, r in enumerate(rows, 1):
        r["rank"] = rank_idx

    # Pre-fetch sections and student section info if move is requested
    all_class_ids = set([r["current_class_id"] for r in rows] + [next_of.get(r["current_class_id"]) for r in rows if next_of.get(r["current_class_id"])])
    all_sections = list(Section.objects.filter(school_class_id__in=[cid for cid in all_class_ids if cid]))
    sec_by_class_and_name = {(s.school_class_id, s.name): s for s in all_sections}
    first_sec_by_class = {}
    for s_obj in sorted(all_sections, key=lambda x: x.name):
        if s_obj.school_class_id not in first_sec_by_class:
            first_sec_by_class[s_obj.school_class_id] = s_obj

    stu_sec_map = {
        st.id: (st.current_section.name if st.current_section else None)
        for st in Student.objects.filter(id__in=[r["student_id"] for r in rows]).select_related("current_section")
    }
    roll_counters = {}
    
    created = 0
    passed_promoted_count = 0
    conditional_promoted_count = 0
    retained_count = 0
    target_class_name = ""

    retained_students = []
    for row in rows:
        is_pass = (row["status"] == "Pass")
        has_paid_fee = row.get("fee_paid", False)
        promoted = is_pass or has_paid_fee
        to_class_id = next_of.get(row["current_class_id"]) if promoted else row["current_class_id"]
        
        if promoted:
            if is_pass:
                passed_promoted_count += 1
            else:
                conditional_promoted_count += 1
            if not target_class_name and to_class_id:
                tc = SchoolClass.objects.filter(pk=to_class_id).first()
                if tc:
                    target_class_name = tc.name
        else:
            retained_count += 1
            retained_students.append({
                "student_id": row["student_id"],
                "reason": "Unsettled conditional promotion fee" if row["status"] != "Pass" else "Failed"
            })

        if session:
            StudentPromotion.objects.update_or_create(
                exam_session=session, student_id=row["student_id"],
                defaults=dict(
                    school_id=school,
                    from_class_id=row["current_class_id"],
                    to_class_id=to_class_id,
                    percentage=row["percentage"], rank=row.get("rank", 0),
                    promoted=promoted, promoted_by=request.user,
                ),
            )
        created += 1
        if move and promoted:
            update_data = {}
            if next_year:
                update_data["academic_year"] = next_year
            if to_class_id:
                update_data["current_class_id"] = to_class_id
            
            # Map section
            curr_sec_name = stu_sec_map.get(row["student_id"])
            target_sec = None
            if to_class_id:
                if curr_sec_name:
                    target_sec = sec_by_class_and_name.get((to_class_id, curr_sec_name))
                if not target_sec:
                    target_sec = first_sec_by_class.get(to_class_id)
            if target_sec:
                update_data["current_section_id"] = target_sec.id

            # Assign sequential roll 1..n per class/section
            key = (to_class_id, target_sec.id if target_sec else None)
            roll_seq = roll_counters.get(key, 0) + 1
            roll_counters[key] = roll_seq
            update_data["roll_number"] = str(roll_seq)

            Student.objects.filter(pk=row["student_id"]).update(**update_data)
            
    return Response({
        "processed": created,
        "moved": move,
        "promoted_count": passed_promoted_count + conditional_promoted_count,
        "passed_promoted_count": passed_promoted_count,
        "conditional_promoted_count": conditional_promoted_count,
        "retained_count": retained_count,
        "retained_students": retained_students,
        "next_year_name": next_year.name if next_year else None,
        "target_class_name": target_class_name
    })
