"""API serializers.

`school` is never accepted from the client — the viewset stamps it from the
caller's effective school (see base.SchoolScopedViewSet) — so it is read-only
everywhere below.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.academics.models import (
    AcademicYear,
    RoutineSlot,
    SchoolClass,
    Section,
    Subject,
)
from apps.accounts.models import User
from apps.attendance.models import (
    BiometricEnrollment,
    BiometricPunch,
    LeaveApplication,
    StaffAttendance,
    StudentAttendance,
)
from apps.exams.models import (
    ExamResult,
    ExamSession,
    ExamSubject,
    StudentPromotion,
)
from apps.fees.models import (
    FeeStructure,
    FeeType,
    Invoice,
    Payment,
    StudentFeeDiscount,
)
from apps.notifications.models import Notification
from apps.ratings.models import RatingPeriod, TeacherRating, TeacherRatingAggregate
from apps.rooms.models import (
    Assignment,
    AssignmentSubmission,
    ClassRoom,
    Note,
    RoomMembership,
    RoomPost,
)
from apps.students.models import (
    AdmissionApplication,
    Certificate,
    Guardian,
    Student,
    StudentTransfer,
)
from apps.teachers.models import Designation, TeacherProfile
from apps.tenants.models import ContactMessage, School, SubscriptionPlan

class RatingPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = RatingPeriod
        fields = ["id", "name", "start_date", "end_date", "is_active", "eligible_classes"]


class TeacherRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherRating
        fields = "__all__"
        read_only_fields = ["school", "submitted_at"]


class TeacherRatingAggregateSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.__str__", read_only=True)

    class Meta:
        model = TeacherRatingAggregate
        fields = "__all__"
        read_only_fields = ["school"]
