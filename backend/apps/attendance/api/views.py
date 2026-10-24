"""API viewsets.

Three tiers:
* Tenant-scoped resources -> `SchoolScopedViewSet` (auto-filtered by the
  caller's effective school; Super Admin picks the school via X-Active-School).
* Platform resources (schools, leads, plans, stats) -> `IsSuperAdmin`, operate
  across all tenants with `all_objects`.
* Public admissions -> `AllowAny`.
"""
import datetime
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
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
    StaffAttendance, StudentAttendance, StaffLeaveApplication,
)
from apps.exams.models import ExamResult, ExamSession, ExamSubject, StudentPromotion
from apps.fees.models import (
    FeeStructure, FeeType, Invoice, Payment, StudentFeeDiscount,
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


def get_student_monthly_attendance_stats(student, school, target_date=None, month_str=None):
    """
    Computes monthly attendance statistics and recent daily records for a student.
    """
    if target_date is None:
        target_date = timezone.now().date()
    elif isinstance(target_date, str):
        try:
            target_date = datetime.date.fromisoformat(target_date)
        except ValueError:
            target_date = timezone.now().date()

    if month_str:
        try:
            parts = month_str.split("-")
            month_start = datetime.date(int(parts[0]), int(parts[1]), 1)
        except Exception:
            month_start = target_date.replace(day=1)
    else:
        month_start = target_date.replace(day=1)

    # Next month start
    if month_start.month == 12:
        next_month_start = datetime.date(month_start.year + 1, 1, 1)
    else:
        next_month_start = datetime.date(month_start.year, month_start.month + 1, 1)

    records = list(
        StudentAttendance.objects.filter(
            school=school,
            student=student,
            date__gte=month_start,
            date__lt=next_month_start,
        ).order_by("date")
    )

    total_days = len(records)
    present_count = sum(1 for r in records if r.status == "present")
    absent_count = sum(1 for r in records if r.status == "absent")
    late_count = sum(1 for r in records if r.status == "late")
    leave_count = sum(1 for r in records if r.status == "leave")

    attendance_rate = 100.0
    if total_days > 0:
        attendance_rate = round(((present_count + late_count * 0.5) / total_days) * 100, 1)

    # Calculate consecutive absent days ending on or before target_date
    consecutive_absent = 0
    prior_records = [r for r in records if r.date <= target_date]
    prior_records.sort(key=lambda r: r.date, reverse=True)
    for r in prior_records:
        if r.status == "absent":
            consecutive_absent += 1
        else:
            break

    recent_logs = [
        {"date": r.date.isoformat(), "status": r.status}
        for r in records
    ]

    return {
        "month": month_start.strftime("%Y-%m"),
        "total_working_days": total_days,
        "present_count": present_count,
        "absent_count": absent_count,
        "late_count": late_count,
        "leave_count": leave_count,
        "attendance_rate": attendance_rate,
        "consecutive_absent": consecutive_absent,
        "recent_logs": recent_logs,
    }


def serialize_absent_student(student, school, attendance_record=None, target_date=None, month_str=None):
    guardians = list(student.guardians.all())
    guardians_data = []
    primary_phone = ""
    primary_guardian_name = ""
    primary_relation = ""

    for g in guardians:
        g_dict = {
            "id": g.id,
            "relation": g.relation,
            "relation_display": g.get_relation_display(),
            "name": g.name,
            "phone": g.phone,
            "email": g.email,
            "occupation": g.occupation,
            "is_primary_contact": g.is_primary_contact,
        }
        guardians_data.append(g_dict)
        if g.is_primary_contact or (not primary_phone and g.phone):
            primary_phone = g.phone
            primary_guardian_name = g.name
            primary_relation = g.get_relation_display()

    if not primary_phone and student.emergency_contact:
        primary_phone = student.emergency_contact

    monthly_stats = get_student_monthly_attendance_stats(
        student=student,
        school=school,
        target_date=target_date,
        month_str=month_str,
    )

    photo_url = student.photo.url if student.photo else None

    # Full Present Address
    address_parts = [student.address] if student.address else []
    if student.present_thana:
        address_parts.append(student.present_thana)
    if student.present_zilla:
        address_parts.append(student.present_zilla)
    if student.present_postal_code:
        address_parts.append(f"Postal: {student.present_postal_code}")
    full_present_address = ", ".join(filter(None, address_parts)) or "—"

    # Full Permanent Address
    perm_parts = [student.permanent_address] if student.permanent_address else []
    if student.permanent_thana:
        perm_parts.append(student.permanent_thana)
    if student.permanent_zilla:
        perm_parts.append(student.permanent_zilla)
    if student.permanent_postal_code:
        perm_parts.append(f"Postal: {student.permanent_postal_code}")
    full_perm_address = ", ".join(filter(None, perm_parts)) or "—"

    record_date_str = (
        attendance_record.date.isoformat()
        if attendance_record
        else (target_date.isoformat() if hasattr(target_date, "isoformat") else str(target_date))
    )

    return {
        "student_id": student.id,
        "full_name": student.full_name,
        "admission_number": student.admission_number,
        "roll_number": student.roll_number,
        "gender": student.gender,
        "blood_group": student.blood_group,
        "photo": photo_url,
        "class_id": student.current_class_id,
        "class_name": student.current_class.name if student.current_class else "—",
        "section_id": student.current_section_id,
        "section_name": student.current_section.name if student.current_section else "—",
        "emergency_contact": student.emergency_contact or "",
        "primary_phone": primary_phone,
        "primary_guardian_name": primary_guardian_name,
        "primary_relation": primary_relation,
        "address": student.address or "",
        "full_present_address": full_present_address,
        "permanent_address": student.permanent_address or "",
        "full_perm_address": full_perm_address,
        "guardians": guardians_data,
        "attendance_record_id": attendance_record.id if attendance_record else None,
        "attendance_date": record_date_str,
        "status": attendance_record.status if attendance_record else "absent",
        "monthly_stats": monthly_stats,
    }


class StudentAttendanceViewSet(SchoolScopedViewSet):
    required_module = "attendance"
    queryset = StudentAttendance.objects.select_related("student").all()
    serializer_class = s.StudentAttendanceSerializer
    filterset_fields = ["section", "date", "status", "student"]

    def perform_create(self, serializer):
        serializer.save(school=self._active_school, marked_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="absentees")
    def absentees(self, request):
        """
        Returns all students marked absent on a specific date,
        with contact numbers, guardian details, addresses, and monthly attendance stats.
        """
        school = self._active_school
        date_str = request.query_params.get("date")
        if date_str:
            try:
                target_date = datetime.date.fromisoformat(date_str)
            except ValueError:
                target_date = timezone.now().date()
        else:
            target_date = timezone.now().date()

        section_id = request.query_params.get("section")
        class_id = request.query_params.get("school_class")
        search = request.query_params.get("search", "").strip()
        month_str = request.query_params.get("month")

        qs = (
            StudentAttendance.objects.filter(school=school, date=target_date, status="absent")
            .select_related(
                "student",
                "student__current_class",
                "student__current_section",
            )
            .prefetch_related(
                "student__guardians",
            )
        )

        if section_id:
            qs = qs.filter(section_id=section_id)
        if class_id:
            qs = qs.filter(student__current_class_id=class_id)
        if search:
            qs = qs.filter(
                Q(student__full_name__icontains=search)
                | Q(student__admission_number__icontains=search)
                | Q(student__roll_number__icontains=search)
                | Q(student__emergency_contact__icontains=search)
                | Q(student__guardians__phone__icontains=search)
                | Q(student__guardians__name__icontains=search)
            ).distinct()

        results = [
            serialize_absent_student(
                student=r.student,
                school=school,
                attendance_record=r,
                target_date=target_date,
                month_str=month_str,
            )
            for r in qs
        ]

        return Response({
            "date": target_date.isoformat(),
            "month": month_str or target_date.strftime("%Y-%m"),
            "count": len(results),
            "results": results,
        })

    @action(detail=False, methods=["get"], url_path="student-month-summary")
    def student_month_summary(self, request):
        """
        Returns full profile, contact, guardian info, and monthly attendance stats for a single student.
        """
        school = self._active_school
        student_id = request.query_params.get("student_id")
        if not student_id:
            return Response({"error": "student_id is required"}, status=400)

        try:
            student = (
                Student.objects.select_related("current_class", "current_section")
                .prefetch_related("guardians")
                .get(school=school, id=student_id)
            )
        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=404)

        date_str = request.query_params.get("date")
        month_str = request.query_params.get("month")
        if date_str:
            try:
                target_date = datetime.date.fromisoformat(date_str)
            except ValueError:
                target_date = timezone.now().date()
        else:
            target_date = timezone.now().date()

        data = serialize_absent_student(
            student=student,
            school=school,
            target_date=target_date,
            month_str=month_str,
        )
        return Response(data)


class StaffAttendanceViewSet(SchoolScopedViewSet):
    required_module = "hr"
    queryset = StaffAttendance.objects.select_related("teacher").all()
    serializer_class = s.StaffAttendanceSerializer
    filterset_fields = ["teacher", "date", "is_present"]


class LeaveApplicationViewSet(SchoolScopedViewSet):
    required_module = "attendance"
    queryset = LeaveApplication.objects.select_related("student").all()
    serializer_class = s.LeaveApplicationSerializer
    filterset_fields = ["student", "status"]


class BiometricEnrollmentViewSet(SchoolScopedViewSet):
    required_module = "biometric"
    queryset = BiometricEnrollment.objects.all()
    serializer_class = s.BiometricEnrollmentSerializer
    search_fields = ["device_user_id", "label"]


class BiometricPunchViewSet(SchoolScopedViewSet):
    required_module = "biometric"
    queryset = BiometricPunch.objects.all()
    serializer_class = s.BiometricPunchSerializer
    filterset_fields = ["status", "direction"]
    http_method_names = ["get", "head", "options"]  # read-only (ingested by device API)

class StaffLeaveApplicationViewSet(SchoolScopedViewSet):
    required_module = "hr"
    queryset = StaffLeaveApplication.objects.select_related("teacher", "reviewed_by").all()
    serializer_class = s.StaffLeaveApplicationSerializer
    filterset_fields = ["teacher", "status"]

    def perform_update(self, serializer):
        # Auto-stamp the reviewed_by when status changes to approved/rejected
        status_val = serializer.validated_data.get("status")
        if status_val in ["approved", "rejected"]:
            serializer.save(reviewed_by=self.request.user)
        else:
            serializer.save()
