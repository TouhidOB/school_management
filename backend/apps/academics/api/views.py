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
    StudyMaterial,
    OnlineClass,
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

class AcademicYearViewSet(SchoolScopedViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = s.AcademicYearSerializer
    search_fields = ["name"]


class SchoolClassViewSet(SchoolScopedViewSet):
    queryset = SchoolClass.objects.all()
    serializer_class = s.SchoolClassSerializer
    search_fields = ["name"]
    ordering_fields = ["numeric_level", "name"]


class SubjectViewSet(SchoolScopedViewSet):
    queryset = Subject.objects.select_related("school_class").all()
    serializer_class = s.SubjectSerializer
    filterset_fields = ["school_class"]
    search_fields = ["name", "code"]


class SectionViewSet(SchoolScopedViewSet):
    queryset = Section.objects.select_related("school_class", "academic_year").all()
    serializer_class = s.SectionSerializer
    filterset_fields = ["school_class", "academic_year"]


class RoutineSlotViewSet(SchoolScopedViewSet):
    queryset = RoutineSlot.objects.select_related("subject", "teacher", "section").all()
    serializer_class = s.RoutineSlotSerializer
    filterset_fields = ["section", "day_of_week", "teacher"]

    @action(detail=False, methods=["get"])
    def conflicts(self, request):
        slots = self.get_queryset().filter(is_break=False)
        
        teacher_conflicts = []
        room_conflicts = []
        
        from collections import defaultdict
        teacher_map = defaultdict(list)
        room_map = defaultdict(list)
        
        for slot in slots:
            if slot.teacher_id:
                key = (slot.teacher_id, slot.day_of_week, slot.period)
                teacher_map[key].append(slot)
            if slot.room:
                key = (slot.room, slot.day_of_week, slot.period)
                room_map[key].append(slot)
                
        for (teacher_id, day, period), group in teacher_map.items():
            if len(group) > 1:
                teacher_conflicts.append({
                    "teacher_id": teacher_id,
                    "teacher_name": group[0].teacher.display_name,
                    "day_of_week": day,
                    "day_display": group[0].get_day_of_week_display(),
                    "period": period,
                    "slots": [s.id for s in group],
                    "details": [f"Section {s.section.name} ({s.subject.name if s.subject else 'No Subject'})" for s in group]
                })

        for (room, day, period), group in room_map.items():
            if len(group) > 1:
                room_conflicts.append({
                    "room": room,
                    "day_of_week": day,
                    "day_display": group[0].get_day_of_week_display(),
                    "period": period,
                    "slots": [s.id for s in group],
                    "details": [f"Section {s.section.name} ({s.subject.name if s.subject else 'No Subject'})" for s in group]
                })

        return Response({
            "teacher_conflicts": teacher_conflicts,
            "room_conflicts": room_conflicts
        })

from apps.academics.models import Event

class EventViewSet(SchoolScopedViewSet):
    queryset = Event.objects.all()
    serializer_class = s.EventSerializer
    filterset_fields = ["event_type"]
    search_fields = ["title", "description"]

class StudyMaterialViewSet(SchoolScopedViewSet):
    queryset = StudyMaterial.objects.select_related("school_class", "subject").all()
    serializer_class = s.StudyMaterialSerializer
    filterset_fields = ["school_class", "subject"]
    search_fields = ["title", "description"]

    def perform_create(self, serializer):
        teacher = getattr(self.request.user, "teacherprofile", None)
        serializer.save(school=self._active_school, uploaded_by=teacher)

class OnlineClassViewSet(SchoolScopedViewSet):
    queryset = OnlineClass.objects.select_related("school_class", "subject").all()
    serializer_class = s.OnlineClassSerializer
    filterset_fields = ["school_class", "subject"]
    search_fields = ["topic"]

    def perform_create(self, serializer):
        teacher = getattr(self.request.user, "teacherprofile", None)
        serializer.save(school=self._active_school, host=teacher)
