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
from apps.tenants.api.serializers import DeviceSettingsSerializer
from apps.attendance.api.serializers import BiometricPunchSerializer
from . import serializers as s

User = get_user_model()

class LoginView(TokenObtainPairView):
    serializer_class = s.SchoolTokenObtainPairSerializer


class MeView(APIView):
    def get(self, request):
        return Response(s.UserSerializer(request.user).data)


class SchoolProfileView(APIView):
    """The school the caller is currently acting in (own school, or the Super
    Admin's active school). Powers the SPA header + branding."""

    def get(self, request):
        from apps.tenants.api.serializers import SchoolSelfSerializer
        school = get_active_school(request)
        if school is None:
            return Response({"detail": "No active school."}, status=404)
        return Response(SchoolSelfSerializer(school, context={"request": request}).data)

    def patch(self, request):
        """Update the active school's own profile/branding (admin settings)."""
        from apps.tenants.api.serializers import SchoolSelfSerializer
        school = get_active_school(request)
        if school is None:
            return Response({"detail": "No active school."}, status=404)
        ser = SchoolSelfSerializer(
            school, data=request.data, partial=True, context={"request": request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


class DeviceSettingsView(APIView):
    """Biometric device config for the active school + punch health, and a
    token-regenerate action (POST)."""

    def _payload(self, request, school):
        data = DeviceSettingsSerializer(school).data
        data["ingest_url"] = request.build_absolute_uri("/api/devices/punch/")
        data["unresolved_punches"] = BiometricPunch.objects.filter(status="unresolved").count()
        recent = BiometricPunch.objects.order_by("-punched_at")[:20]
        data["recent_punches"] = BiometricPunchSerializer(recent, many=True).data
        return data

    def _school(self, request):
        school = get_active_school(request)
        if school is None:
            from apps.core.tenant import set_current_school
            return None
        # Bind tenant so BiometricPunch (scoped manager) filters correctly.
        from apps.core.tenant import set_current_school
        set_current_school(school)
        return school

    def get(self, request):
        school = self._school(request)
        if school is None:
            return Response({"detail": "No active school."}, status=404)
        return Response(self._payload(request, school))

    def patch(self, request):
        school = self._school(request)
        if school is None:
            return Response({"detail": "No active school."}, status=404)
        ser = DeviceSettingsSerializer(school, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(self._payload(request, school))

    def post(self, request):
        """Regenerate the per-school device token."""
        school = self._school(request)
        if school is None:
            return Response({"detail": "No active school."}, status=404)
        school.device_token = get_random_string(40)
        school.save(update_fields=["device_token"])
        return Response(self._payload(request, school))

class UserViewSet(SchoolScopedViewSet):
    """Manage users for the active school."""
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = s.UserManagementSerializer
    search_fields = ["username", "email", "first_name", "last_name", "phone"]
    filterset_fields = ["role"]

    def perform_create(self, serializer):
        serializer.save(school=self._active_school)

class PlatformUserViewSet(viewsets.ModelViewSet):
    """Super Admin view for managing platform staff (school=None)"""
    permission_classes = [IsSuperAdmin]
    queryset = User.objects.filter(school__isnull=True).order_by("-date_joined")
    serializer_class = s.UserManagementSerializer
    search_fields = ["username", "email", "first_name", "last_name"]
    filterset_fields = ["role", "is_active"]

class SchoolAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """Super Admin view to list all school admins across all tenants"""
    permission_classes = [IsSuperAdmin]
    queryset = User.objects.filter(role=User.ROLE_SCHOOL_ADMIN).select_related('school').order_by("-date_joined")
    serializer_class = s.UserManagementSerializer
    search_fields = ["username", "email", "first_name", "last_name", "school__name"]
    filterset_fields = ["is_active"]

from apps.accounts.models import LoginActivity

class LoginActivitySerializer(s.serializers.ModelSerializer):
    username = s.serializers.CharField(source='user.username', read_only=True)
    role = s.serializers.CharField(source='user.get_role_display', read_only=True)
    school_name = s.serializers.CharField(source='user.school.name', read_only=True, default="Platform")

    class Meta:
        model = LoginActivity
        fields = '__all__'

class LoginActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """Super Admin view to see all login audit logs"""
    permission_classes = [IsSuperAdmin]
    queryset = LoginActivity.objects.all().select_related('user', 'user__school').order_by("-login_time")
    serializer_class = LoginActivitySerializer
    search_fields = ["user__username", "user__email", "ip_address"]
    filterset_fields = ["status", "user__role"]

