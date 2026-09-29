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
    FeeStructure, FeeType, Expense, ExpenseCategory, Invoice, InvoiceLineItem, Payment, StudentFeeDiscount,
    SalaryPayment, SchoolWallet,
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

class FeeTypeViewSet(SchoolScopedViewSet):
    queryset = FeeType.objects.all()
    serializer_class = s.FeeTypeSerializer
    search_fields = ["name"]


class FeeStructureViewSet(SchoolScopedViewSet):
    queryset = FeeStructure.objects.select_related("fee_type", "applicable_class", "applicable_student").all()
    serializer_class = s.FeeStructureSerializer
    filterset_fields = ["fee_type", "academic_year", "applicable_class", "applicable_student"]

    def destroy(self, request, *args, **kwargs):
        """When a fee structure is deleted, also remove any unpaid invoices generated from it so student dues update immediately."""
        instance = self.get_object()
        school = self._active_school

        unpaid_invoices = Invoice.objects.filter(
            school=school,
            academic_year=instance.academic_year,
            line_items__fee_type=instance.fee_type,
            payments__isnull=True
        )
        if instance.applicable_student:
            unpaid_invoices = unpaid_invoices.filter(student=instance.applicable_student)
        elif instance.applicable_class:
            unpaid_invoices = unpaid_invoices.filter(student__current_class=instance.applicable_class)

        cleared_count = unpaid_invoices.count()
        unpaid_invoices.delete()
        instance.delete()

        return Response({
            "success": True,
            "cleared_invoices_count": cleared_count,
            "message": f"Fee structure deleted and {cleared_count} unpaid student invoice(s) removed from dues."
        })

    @action(detail=True, methods=["post"])
    def generate_invoices(self, request, pk=None):
        """Bulk generate or assign invoices to students based on this fee structure."""
        structure = self.get_object()
        due_date = request.data.get("due_date")
        invoice_date = request.data.get("invoice_date") or timezone.now().date()
        month = request.data.get("month")

        target_students = []
        if structure.applicable_student:
            target_students = [structure.applicable_student]
        elif structure.applicable_class:
            target_students = list(Student.objects.filter(
                school=structure.school,
                current_class=structure.applicable_class,
                status="active"
            ))
        else:
            target_students = list(Student.objects.filter(
                school=structure.school,
                status="active"
            ))

        created_invoices = []
        skipped_count = 0
        for student in target_students:
            # Check if active/unpaid invoice for this fee type and period already exists
            existing_unpaid = Invoice.objects.filter(
                school=structure.school,
                student=student,
                academic_year=structure.academic_year,
                line_items__fee_type=structure.fee_type,
                status__in=["sent", "draft", "partially_paid", "overdue"]
            )
            if structure.fee_type.frequency == "monthly" and month:
                existing_unpaid = existing_unpaid.filter(month=month)
            if existing_unpaid.exists():
                skipped_count += 1
                continue

            inv_num = f"INV-{student.roll_number or student.id}-{get_random_string(5).upper()}"
            invoice = Invoice.objects.create(
                school=structure.school,
                student=student,
                academic_year=structure.academic_year,
                month=month,
                invoice_number=inv_num,
                invoice_date=invoice_date,
                due_date=due_date,
                subtotal=structure.amount,
                grand_total=structure.amount,
                status="sent"
            )
            InvoiceLineItem.objects.create(
                invoice=invoice,
                fee_type=structure.fee_type,
                description=f"{structure.fee_type.name} ({structure.fee_type.get_frequency_display()})",
                amount=structure.amount,
            )
            created_invoices.append(invoice.id)

        msg = f"Successfully generated {len(created_invoices)} invoice(s)."
        if skipped_count > 0:
            msg += f" ({skipped_count} skipped as already billed and active)."

        return Response({
            "success": True,
            "created_count": len(created_invoices),
            "skipped_count": skipped_count,
            "message": msg
        })



class StudentFeeDiscountViewSet(SchoolScopedViewSet):
    queryset = StudentFeeDiscount.objects.select_related(
        "student", "student__current_class", "student__current_section", "fee_type"
    ).all().order_by("-id")
    serializer_class = s.StudentFeeDiscountSerializer
    filterset_fields = ["student", "fee_type", "student__current_class", "student__current_section"]
    search_fields = ["student__full_name", "student__admission_number", "student__roll_number", "discount_type", "reason"]
    ordering = ["-id"]


class InvoiceViewSet(SchoolScopedViewSet):
    queryset = Invoice.objects.select_related("student").prefetch_related("payments").all()
    serializer_class = s.InvoiceSerializer
    filterset_fields = ["status", "student", "academic_year"]
    search_fields = ["invoice_number", "student__full_name", "student__admission_number", "student__roll_number"]

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        """Record a payment and re-total the invoice (paid vs partial)."""
        invoice = self.get_object()
        payment = Payment(
            invoice=invoice,
            school=invoice.school,
            amount_paid=request.data.get("amount_paid") or 0,
            payment_method=request.data.get("payment_method", "cash"),
            transaction_id=request.data.get("transaction_id", ""),
            paid_at=request.data.get("paid_at") or timezone.now(),
            received_by=request.user,
        )
        payment.save()
        paid = invoice.payments.aggregate(t=Sum("amount_paid"))["t"] or 0
        if paid >= invoice.grand_total:
            invoice.status = "paid"
        elif paid > 0:
            invoice.status = "partially_paid"
        invoice.save(update_fields=["status"])
        return Response(self.get_serializer(invoice).data)


class PaymentViewSet(SchoolScopedViewSet):
    queryset = Payment.objects.select_related("invoice").all()
    serializer_class = s.PaymentSerializer
    filterset_fields = ["invoice", "payment_method"]

    def perform_create(self, serializer):
        serializer.save(school=self._active_school, received_by=self.request.user)

class ExpenseCategoryViewSet(SchoolScopedViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = s.ExpenseCategorySerializer
    search_fields = ["name"]

class ExpenseViewSet(SchoolScopedViewSet):
    queryset = Expense.objects.select_related("category", "recorded_by").all()
    serializer_class = s.ExpenseSerializer
    filterset_fields = ["category"]

    def perform_create(self, serializer):
        serializer.save(school=self._active_school, recorded_by=self.request.user)


class SalaryPaymentViewSet(SchoolScopedViewSet):
    queryset = SalaryPayment.objects.select_related("teacher", "disbursed_by").all()
    serializer_class = s.SalaryPaymentSerializer
    filterset_fields = ["employee_type", "payment_basis", "period_year", "period_month", "status"]
    search_fields = ["employee_name", "employee_id", "designation", "transaction_id"]

    def perform_create(self, serializer):
        serializer.save(school=self._active_school, disbursed_by=self.request.user)

    @action(detail=False, methods=["get"])
    def roster(self, request):
        school = getattr(self, "_active_school", None)
        if not school:
            return Response({
                "results": [],
                "count": 0,
                "summary": {
                    "total_employees": 0,
                    "monthly_budget": 0.0,
                    "disbursed_month": 0.0,
                    "pending_amount": 0.0,
                    "paid_count": 0,
                }
            })
        now = timezone.now()
        current_year = int(request.query_params.get("year", now.year))
        current_month = int(request.query_params.get("month", now.month))
        search = request.query_params.get("search", "").strip().lower()
        status_filter = request.query_params.get("status", "all")

        from apps.teachers.models import TeacherProfile
        teachers_qs = TeacherProfile.objects.filter(school=school, status="active").select_related(
            "designation", "department"
        ).order_by("employee_id")

        # Get payments for this month
        payments_this_month = SalaryPayment.objects.filter(
            school=school,
            period_year=current_year,
            period_month=current_month,
            status="paid"
        )
        payments_by_teacher = {p.teacher_id: p for p in payments_this_month if p.teacher_id}
        payments_by_emp_id = {p.employee_id: p for p in payments_this_month if p.employee_id}

        # All payments this year for cumulative stats
        all_year_payments = SalaryPayment.objects.filter(school=school, period_year=current_year, status="paid")
        year_paid_by_teacher = {}
        for p in all_year_payments:
            if p.teacher_id:
                year_paid_by_teacher[p.teacher_id] = year_paid_by_teacher.get(p.teacher_id, 0) + float(p.amount_paid)

        roster_list = []
        total_budget = 0.0
        total_disbursed_month = 0.0
        pending_count = 0
        paid_count = 0

        for t in teachers_qs:
            if search:
                name_match = search in (t.full_name or "").lower()
                id_match = search in (t.employee_id or "").lower()
                phone_match = search in (t.phone or "").lower()
                desig_match = search in ((t.designation.name if t.designation else "") or "").lower()
                dept_match = search in ((t.department.name if t.department else "") or "").lower()
                if not (name_match or id_match or phone_match or desig_match or dept_match):
                    continue

            base_sal = float(t.salary_basic or 0)
            total_budget += base_sal

            # Check if paid this month
            payment = payments_by_teacher.get(t.id) or payments_by_emp_id.get(t.employee_id)
            is_paid = payment is not None

            if is_paid:
                paid_count += 1
                total_disbursed_month += float(payment.amount_paid)
            else:
                pending_count += 1

            if status_filter == "paid" and not is_paid:
                continue
            if status_filter == "unpaid" and is_paid:
                continue

            roster_list.append({
                "teacher_id": t.id,
                "employee_id": t.employee_id or f"TCH-{t.id}",
                "employee_name": t.full_name,
                "employee_type": "teacher",
                "designation": t.designation.name if t.designation else "Teacher",
                "department": t.department.name if t.department else "General",
                "phone": t.phone or "—",
                "contract_type": t.get_contract_type_display() if hasattr(t, "get_contract_type_display") else t.contract_type,
                "basic_salary": base_sal,
                "current_month_status": "paid" if is_paid else "unpaid",
                "last_payment_id": payment.id if payment else None,
                "last_payment_date": str(payment.payment_date) if payment else None,
                "last_amount_paid": float(payment.amount_paid) if payment else None,
                "total_paid_year": year_paid_by_teacher.get(t.id, 0.0)
            })

        return Response({
            "results": roster_list,
            "count": len(roster_list),
            "summary": {
                "total_employees": len(teachers_qs),
                "monthly_budget": total_budget,
                "disbursed_month": total_disbursed_month,
                "pending_amount": max(0.0, total_budget - total_disbursed_month),
                "paid_count": paid_count,
                "pending_count": pending_count,
                "current_month": current_month,
                "current_year": current_year
            }
        })



class StudentDuesViewSet(SchoolScopedViewSet):
    """Provides student-level pending dues, roll, id, name, and 1-click payment with receipt redirect."""

    def list(self, request):
        school = getattr(self, "_active_school", None)
        if not school:
            return Response({
                "results": [],
                "count": 0,
                "summary": {
                    "total_students": 0,
                    "pending_count": 0,
                    "paid_count": 0,
                    "total_billed": 0.0,
                    "total_paid": 0.0,
                    "total_due": 0.0,
                }
            })
        class_id = request.query_params.get("class") or request.query_params.get("current_class")
        section_id = request.query_params.get("section") or request.query_params.get("current_section")
        search = request.query_params.get("search", "").strip().lower()
        status_filter = request.query_params.get("status", "all")

        students_qs = Student.objects.filter(school=school, status="active").select_related(
            "current_class", "current_section"
        )
        if class_id:
            students_qs = students_qs.filter(current_class_id=class_id)
        if section_id:
            students_qs = students_qs.filter(current_section_id=section_id)

        all_students = list(students_qs)

        # Prefetch invoices and payments
        invoices = Invoice.objects.filter(
            school=school,
            student__in=all_students
        ).exclude(status="cancelled").prefetch_related("payments").order_by("invoice_date")

        invoices_by_student = {}
        for inv in invoices:
            invoices_by_student.setdefault(inv.student_id, []).append(inv)

        results = []
        total_billed_all = 0
        total_paid_all = 0
        total_due_all = 0
        pending_count = 0
        paid_count = 0

        for stud in all_students:
            # Match search query if provided
            if search:
                name_match = search in (stud.full_name or "").lower()
                roll_match = search in str(stud.roll_number or "").lower()
                adm_match = search in (stud.admission_number or "").lower()
                if not (name_match or roll_match or adm_match):
                    continue

            stud_invoices = invoices_by_student.get(stud.id, [])
            billed = sum(float(inv.grand_total) for inv in stud_invoices)
            paid = sum(
                sum(float(p.amount_paid) for p in inv.payments.all())
                for inv in stud_invoices
            )
            due = max(0.0, billed - paid)
            status = "paid" if (billed > 0 and due <= 0) else ("pending" if due > 0 else "cleared")

            if status_filter == "pending" and due <= 0:
                continue
            if status_filter == "paid" and due > 0:
                continue

            total_billed_all += billed
            total_paid_all += paid
            total_due_all += due
            if due > 0:
                pending_count += 1
            else:
                paid_count += 1

            pending_inv_list = []
            for inv in stud_invoices:
                inv_paid = sum(float(p.amount_paid) for p in inv.payments.all())
                inv_due = max(0.0, float(inv.grand_total) - inv_paid)
                if inv_due > 0:
                    pending_inv_list.append({
                        "id": inv.id,
                        "invoice_number": inv.invoice_number,
                        "invoice_date": str(inv.invoice_date),
                        "due_date": str(inv.due_date) if inv.due_date else None,
                        "grand_total": float(inv.grand_total),
                        "amount_paid": inv_paid,
                        "due_amount": inv_due,
                        "status": inv.status,
                    })

            # Sort student roll integer-safe
            roll_int = int(stud.roll_number) if (stud.roll_number and str(stud.roll_number).isdigit()) else 999999

            results.append({
                "id": stud.id,
                "student_id": stud.admission_number or f"STU-{stud.id}",
                "roll_number": stud.roll_number or "—",
                "roll_int": roll_int,
                "full_name": stud.full_name,
                "class_id": stud.current_class_id,
                "class_name": stud.current_class.name if stud.current_class else "—",
                "section_id": stud.current_section_id,
                "section_name": stud.current_section.name if stud.current_section else "—",
                "total_billed": billed,
                "total_paid": paid,
                "due_amount": due,
                "status": "pending" if due > 0 else "paid",
                "pending_invoices": pending_inv_list,
                "last_invoice_id": stud_invoices[-1].id if stud_invoices else None,
            })

        results.sort(key=lambda x: (x["class_name"], x["roll_int"]))

        return Response({
            "results": results,
            "count": len(results),
            "summary": {
                "total_students": len(results),
                "pending_count": pending_count,
                "paid_count": paid_count,
                "total_billed": total_billed_all,
                "total_paid": total_paid_all,
                "total_due": total_due_all,
            }
        })

    def retrieve(self, request, pk=None):
        """Returns the complete fee statement and due breakdown for a student."""
        school = self._active_school
        try:
            student = Student.objects.select_related("current_class", "current_section", "academic_year").get(
                id=pk, school=school
            )
        except Student.DoesNotExist:
            return Response({"error": "Student not found."}, status=404)

        invoices = Invoice.objects.filter(
            school=school,
            student=student
        ).exclude(status="cancelled").prefetch_related("payments", "line_items__fee_type").order_by("invoice_date", "id")

        invoice_list = []
        total_billed = 0.0
        total_paid = 0.0
        all_payments = []

        for inv in invoices:
            inv_paid = sum(float(p.amount_paid) for p in inv.payments.all())
            inv_due = max(0.0, float(inv.grand_total) - inv_paid)
            total_billed += float(inv.grand_total)
            total_paid += inv_paid

            for p in inv.payments.all():
                all_payments.append({
                    "id": p.id,
                    "invoice_number": inv.invoice_number,
                    "amount_paid": float(p.amount_paid),
                    "payment_method": p.get_payment_method_display() if hasattr(p, 'get_payment_method_display') else p.payment_method,
                    "transaction_id": p.transaction_id or "—",
                    "paid_at": p.paid_at.isoformat() if p.paid_at else str(inv.invoice_date),
                })

            items = []
            for li in inv.line_items.all():
                items.append({
                    "id": li.id,
                    "description": li.description,
                    "amount": float(li.amount),
                    "fee_type_name": li.fee_type.name if li.fee_type else li.description,
                    "frequency": li.fee_type.frequency if li.fee_type else "—"
                })

            invoice_list.append({
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "invoice_date": str(inv.invoice_date),
                "due_date": str(inv.due_date) if inv.due_date else None,
                "month": inv.month,
                "subtotal": float(inv.subtotal),
                "discount": float(inv.total_discount),
                "late_fine": float(inv.late_fine),
                "grand_total": float(inv.grand_total),
                "amount_paid": inv_paid,
                "due_amount": inv_due,
                "status": inv.status,
                "items": items,
            })

        net_due = max(0.0, total_billed - total_paid)

        return Response({
            "student": {
                "id": student.id,
                "full_name": student.full_name,
                "admission_number": student.admission_number or f"STU-{student.id}",
                "roll_number": student.roll_number or "—",
                "class_name": student.current_class.name if student.current_class else "—",
                "section_name": student.current_section.name if student.current_section else "—",
                "academic_year": student.academic_year.name if student.academic_year else "Current Year",
                "phone": student.emergency_contact or "—",
            },
            "summary": {
                "total_billed": total_billed,
                "total_paid": total_paid,
                "net_due": net_due,
                "status": "pending" if net_due > 0 else ("cleared" if total_billed > 0 else "no_dues"),
            },
            "invoices": invoice_list,
            "payments": sorted(all_payments, key=lambda x: x["paid_at"], reverse=True),
        })

    @action(detail=True, methods=["post"])
    def pay_due(self, request, pk=None):
        """Record payment against student dues and return invoice_id for immediate receipt printing."""
        school = self._active_school
        student = Student.objects.get(id=pk, school=school)
        amount_to_pay = float(request.data.get("amount_paid") or 0)
        payment_method = request.data.get("payment_method", "cash")
        transaction_id = request.data.get("transaction_id", "")
        paid_at = request.data.get("paid_at") or timezone.now()

        if amount_to_pay <= 0:
            return Response({"error": "Payment amount must be greater than 0."}, status=400)

        # Find student's unpaid invoices ordered by date
        pending_invoices = Invoice.objects.filter(
            school=school,
            student=student
        ).exclude(status__in=["paid", "cancelled"]).prefetch_related("payments").order_by("invoice_date", "id")

        if not pending_invoices.exists():
            return Response({"error": "Student has no pending invoices to pay."}, status=400)

        remaining_cash = amount_to_pay
        paid_invoice_id = None

        for inv in pending_invoices:
            if remaining_cash <= 0:
                break

            inv_paid = sum(float(p.amount_paid) for p in inv.payments.all())
            inv_due = max(0.0, float(inv.grand_total) - inv_paid)

            alloc = min(remaining_cash, inv_due)
            if alloc > 0:
                Payment.objects.create(
                    school=school,
                    invoice=inv,
                    amount_paid=alloc,
                    payment_method=payment_method,
                    transaction_id=transaction_id,
                    paid_at=paid_at,
                    received_by=request.user
                )
                remaining_cash -= alloc
                paid_invoice_id = inv.id

                # Update invoice status
                new_total_paid = inv_paid + alloc
                if new_total_paid >= float(inv.grand_total):
                    inv.status = "paid"
                elif new_total_paid > 0:
                    inv.status = "partially_paid"
                inv.save(update_fields=["status"])

        return Response({
            "success": True,
            "student_id": student.id,
            "invoice_id": paid_invoice_id or pending_invoices.first().id,
            "amount_paid": amount_to_pay,
            "message": "Payment collected successfully."
        })


class SchoolWalletViewSet(SchoolScopedViewSet):
    """Real-time treasury wallet aggregating collections (+), salaries (-), and expenses (-)."""
    queryset = SchoolWallet.objects.all()
    serializer_class = s.SchoolWalletSerializer

    @action(detail=False, methods=["get"])
    def current_status(self, request):
        return self.summary(request)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        school = getattr(self, "_active_school", None)
        if not school:
            return Response({
                "current_balance": 0.0,
                "initial_balance": 0.0,
                "total_collected": 0.0,
                "total_salaries": 0.0,
                "total_expenses": 0.0,
                "total_outflow": 0.0,
                "salary_breakdown": {
                    "teachers": 0.0,
                    "staff": 0.0,
                    "daily_workers": 0.0,
                },
                "recent_transactions": [],
            })
        wallet, _ = SchoolWallet.objects.get_or_create(school=school, defaults={"initial_balance": 0})

        total_collected = float(Payment.objects.filter(school=school).aggregate(t=Sum("amount_paid"))["t"] or 0)
        total_salaries = float(SalaryPayment.objects.filter(school=school, status="paid").aggregate(t=Sum("amount_paid"))["t"] or 0)
        total_expenses = float(Expense.objects.filter(school=school).aggregate(t=Sum("amount"))["t"] or 0)
        initial_balance = float(wallet.initial_balance or 0)

        current_balance = initial_balance + total_collected - (total_salaries + total_expenses)

        # Breakdown of salaries
        salary_teachers = float(SalaryPayment.objects.filter(school=school, status="paid", employee_type="teacher").aggregate(t=Sum("amount_paid"))["t"] or 0)
        salary_staff = float(SalaryPayment.objects.filter(school=school, status="paid", employee_type="staff").aggregate(t=Sum("amount_paid"))["t"] or 0)
        salary_daily = float(SalaryPayment.objects.filter(school=school, status="paid", employee_type="daily_worker").aggregate(t=Sum("amount_paid"))["t"] or 0)

        # Recent transactions: unified chronological stream
        recent_txns = []

        payments = Payment.objects.filter(school=school).select_related("invoice__student").order_by("-paid_at")[:15]
        for p in payments:
            recent_txns.append({
                "id": f"pay-{p.id}",
                "type": "credit",
                "source": "Student Fee Collection",
                "title": f"Invoice #{p.invoice.invoice_number}",
                "subtitle": f"{p.invoice.student.full_name} (Roll: {p.invoice.student.roll_number or '—'})",
                "amount": float(p.amount_paid),
                "date": p.paid_at.isoformat() if p.paid_at else str(timezone.now()),
                "method": p.get_payment_method_display(),
                "reference": p.transaction_id or "—",
                "invoice_id": p.invoice_id,
            })

        salaries = SalaryPayment.objects.filter(school=school, status="paid").order_by("-payment_date", "-id")[:15]
        for s_item in salaries:
            recent_txns.append({
                "id": f"sal-{s_item.id}",
                "type": "debit",
                "source": "Staff / Teacher Salary",
                "title": f"Salary: {s_item.employee_name}",
                "subtitle": f"{s_item.get_employee_type_display()} · {s_item.period_label or s_item.get_payment_basis_display()}",
                "amount": float(s_item.amount_paid),
                "date": f"{s_item.payment_date}T12:00:00Z",
                "method": s_item.get_payment_method_display(),
                "reference": s_item.transaction_id or f"EMP-{s_item.employee_id or s_item.id}",
                "salary_id": s_item.id,
            })

        expenses = Expense.objects.filter(school=school).select_related("category").order_by("-expense_date", "-id")[:15]
        for e in expenses:
            recent_txns.append({
                "id": f"exp-{e.id}",
                "type": "debit",
                "source": "Daily Operational Expense",
                "title": f"{e.category.name if e.category else 'General Expense'}",
                "subtitle": e.description or "Office & School Operational Expense",
                "amount": float(e.amount),
                "date": f"{e.expense_date}T12:00:00Z",
                "method": "Cash",
                "reference": f"EXP-{e.id}",
            })

        # Sort combined recent transactions descending by date
        recent_txns.sort(key=lambda x: x["date"], reverse=True)

        return Response({
            "current_balance": current_balance,
            "initial_balance": initial_balance,
            "total_collected": total_collected,
            "total_salaries": total_salaries,
            "total_expenses": total_expenses,
            "total_outflow": total_salaries + total_expenses,
            "salary_breakdown": {
                "teachers": salary_teachers,
                "staff": salary_staff,
                "daily_wage": salary_daily,
            },
            "recent_transactions": recent_txns[:25]
        })

    @action(detail=False, methods=["post"])
    def adjust(self, request):
        school = self._active_school
        wallet, _ = SchoolWallet.objects.get_or_create(school=school, defaults={"initial_balance": 0})
        new_balance = request.data.get("initial_balance")
        notes = request.data.get("notes", "")

        if new_balance is not None:
            wallet.initial_balance = new_balance
        if notes:
            wallet.notes = notes
        wallet.save()

        return Response({
            "success": True,
            "initial_balance": float(wallet.initial_balance),
            "message": "Wallet initial balance adjusted successfully."
        })

