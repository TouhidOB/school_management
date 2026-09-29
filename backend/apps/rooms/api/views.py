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

class ClassRoomViewSet(SchoolScopedViewSet):
    queryset = ClassRoom.objects.select_related("subject", "section").all()
    serializer_class = s.ClassRoomSerializer
    filterset_fields = ["subject", "section", "is_active"]
    search_fields = ["name", "room_code"]

    def perform_create(self, serializer):
        serializer.save(
            school=self._active_school,
            created_by=self.request.user,
            room_code=get_random_string(8).upper(),
        )


class NoteViewSet(SchoolScopedViewSet):
    queryset = Note.objects.all()
    serializer_class = s.NoteSerializer
    filterset_fields = ["room", "is_important"]

    def perform_create(self, serializer):
        serializer.save(school=self._active_school, uploaded_by=self.request.user)


class AssignmentViewSet(SchoolScopedViewSet):
    queryset = Assignment.objects.all()
    serializer_class = s.AssignmentSerializer
    filterset_fields = ["room", "is_published"]


class AssignmentSubmissionViewSet(SchoolScopedViewSet):
    queryset = AssignmentSubmission.objects.select_related("student").all()
    serializer_class = s.AssignmentSubmissionSerializer
    filterset_fields = ["assignment", "student"]

    @action(detail=True, methods=["post"])
    def grade(self, request, pk=None):
        sub = self.get_object()
        sub.marks_obtained = request.data.get("marks_obtained")
        sub.feedback = request.data.get("feedback", "")
        sub.graded_at = timezone.now()
        sub.graded_by = request.user
        sub.save()
        return Response(self.get_serializer(sub).data)


class RoomPostViewSet(SchoolScopedViewSet):
    queryset = RoomPost.objects.all()
    serializer_class = s.RoomPostSerializer
    filterset_fields = ["room", "post_type"]

    def perform_create(self, serializer):
        serializer.save(school=self._active_school, author=self.request.user)


class RoomMembershipViewSet(SchoolScopedViewSet):
    queryset = RoomMembership.objects.select_related("student").all()
    serializer_class = s.RoomMembershipSerializer
    filterset_fields = ["room", "student", "is_active"]
