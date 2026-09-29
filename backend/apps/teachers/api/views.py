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
from apps.teachers.models import Designation, TeacherProfile, Department
from apps.tenants.models import ContactMessage, School, SubscriptionPlan

from apps.core.api import SchoolScopedViewSet, get_active_school
from apps.core.permissions import IsSuperAdmin
from . import serializers as s

User = get_user_model()

class DepartmentViewSet(SchoolScopedViewSet):
    queryset = Department.objects.all()
    serializer_class = s.DepartmentSerializer
    search_fields = ["name"]

class DesignationViewSet(SchoolScopedViewSet):
    queryset = Designation.objects.all()
    serializer_class = s.DesignationSerializer
    search_fields = ["name"]


class TeacherProfileViewSet(SchoolScopedViewSet):
    queryset = TeacherProfile.objects.select_related("designation", "department").all()
    serializer_class = s.TeacherProfileSerializer
    filterset_fields = ["designation", "department", "status", "contract_type"]
    search_fields = ["full_name", "first_name", "last_name", "email", "employee_id"]

    @action(detail=False, methods=['get'])
    def next_id(self, request):
        school = getattr(self, "_active_school", None)
        if not school:
            return Response({"employee_id": "Auto-generated"})
            
        import datetime
        year = datetime.date.today().year
        count = TeacherProfile.objects.filter(school=school).count() + 1
        return Response({"employee_id": f"TCH-{year}-{count:03d}"})

    def _handle_user_creation(self, instance, create_account, password):
        if not create_account or not instance.email:
            return
        if getattr(instance, 'user', None):
            return
        
        email = instance.email.lower()
        if User.objects.filter(email=email).exists():
            return
            
        user = User.objects.create_user(
            email=email,
            password=password or get_random_string(10),
            role="teacher"
        )
        instance.user = user
        instance.save(update_fields=['user'])

    def perform_create(self, serializer):
        create_account = serializer.validated_data.pop("create_user_account", False)
        password = serializer.validated_data.pop("password", None)
        
        school = getattr(self, "_active_school", None)
        if school is None:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No active school.")
            
        employee_id = serializer.validated_data.get('employee_id', '')
        if not employee_id or employee_id.lower() == 'auto':
            import datetime
            year = datetime.date.today().year
            count = TeacherProfile.objects.filter(school=school).count() + 1
            serializer.validated_data['employee_id'] = f"TCH-{year}-{count:03d}"
                
        instance = serializer.save(school=school)
        self._handle_user_creation(instance, create_account, password)

    def perform_update(self, serializer):
        create_account = serializer.validated_data.pop("create_user_account", False)
        password = serializer.validated_data.pop("password", None)
        instance = serializer.save()
        self._handle_user_creation(instance, create_account, password)
