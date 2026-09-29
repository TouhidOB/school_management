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

class StudentAttendanceViewSet(SchoolScopedViewSet):
    queryset = StudentAttendance.objects.select_related("student").all()
    serializer_class = s.StudentAttendanceSerializer
    filterset_fields = ["section", "date", "status", "student"]

    def perform_create(self, serializer):
        serializer.save(school=self._active_school, marked_by=self.request.user)


class StaffAttendanceViewSet(SchoolScopedViewSet):
    queryset = StaffAttendance.objects.select_related("teacher").all()
    serializer_class = s.StaffAttendanceSerializer
    filterset_fields = ["teacher", "date", "is_present"]


class LeaveApplicationViewSet(SchoolScopedViewSet):
    queryset = LeaveApplication.objects.select_related("student").all()
    serializer_class = s.LeaveApplicationSerializer
    filterset_fields = ["student", "status"]


class BiometricEnrollmentViewSet(SchoolScopedViewSet):
    queryset = BiometricEnrollment.objects.all()
    serializer_class = s.BiometricEnrollmentSerializer
    search_fields = ["device_user_id", "label"]


class BiometricPunchViewSet(SchoolScopedViewSet):
    queryset = BiometricPunch.objects.all()
    serializer_class = s.BiometricPunchSerializer
    filterset_fields = ["status", "direction"]
    http_method_names = ["get", "head", "options"]  # read-only (ingested by device API)

class StaffLeaveApplicationViewSet(SchoolScopedViewSet):
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
