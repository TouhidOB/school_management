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
from . import serializers as s

User = get_user_model()

class NotificationViewSet(SchoolScopedViewSet):
    queryset = Notification.objects.all()
    serializer_class = s.NotificationSerializer
    filterset_fields = ["recipient", "channel", "status"]

from apps.notifications.models import Announcement, MessageTemplate

class AnnouncementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = Announcement.objects.all().order_by("-created_at")
    serializer_class = s.AnnouncementSerializer

class MessageTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = MessageTemplate.objects.all()
    serializer_class = s.MessageTemplateSerializer
    filterset_fields = ["channel", "is_active"]

class PlatformNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = Notification.all_objects.all().order_by("-created_at")
    serializer_class = s.NotificationSerializer
    filterset_fields = ["channel", "status", "school"]

