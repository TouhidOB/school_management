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
    StaffLeaveApplication,
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

class StudentAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = StudentAttendance
        fields = ["id", "student", "student_name", "section", "date", "status"]
        read_only_fields = ["marked_by"]


class StaffAttendanceSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.__str__", read_only=True)

    class Meta:
        model = StaffAttendance
        fields = ["id", "teacher", "teacher_name", "date", "check_in", "check_out", "is_present"]


class LeaveApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = LeaveApplication
        fields = [
            "id", "student", "student_name", "from_date", "to_date",
            "reason", "status", "status_display",
        ]
        read_only_fields = ["reviewed_by"]


class BiometricEnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiometricEnrollment
        fields = ["id", "device_user_id", "label", "student", "teacher"]


class BiometricPunchSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiometricPunch
        fields = ["id", "device_user_id", "punched_at", "direction", "enrollment", "status"]

class StaffLeaveApplicationSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.__str__", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.get_full_name", read_only=True)

    class Meta:
        model = StaffLeaveApplication
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "from_date",
            "to_date",
            "reason",
            "status",
            "reviewed_by",
            "reviewed_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "reviewed_by"]
