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

class ExamSessionSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source="academic_year.name", read_only=True, default=None)

    class Meta:
        model = ExamSession
        fields = [
            "id", "name", "academic_year", "academic_year_name",
            "start_date", "end_date", "is_published", "is_final",
        ]


class ExamSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True, default=None)
    class_name = serializers.CharField(source="school_class.name", read_only=True, default=None)

    class Meta:
        model = ExamSubject
        fields = [
            "id", "exam_session", "subject", "subject_name", "school_class",
            "class_name", "exam_date", "start_time", "end_time", "exam_room",
            "invigilator", "total_marks", "pass_marks",
        ]


class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = ExamResult
        fields = [
            "id", "exam_subject", "student", "student_name", "marks_obtained",
            "grade", "grade_point", "is_absent",
        ]
        read_only_fields = ["entered_by"]


class StudentPromotionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = StudentPromotion
        fields = [
            "id", "exam_session", "student", "student_name", "from_class",
            "to_class", "percentage", "rank", "promoted",
        ]
        read_only_fields = ["promoted_by"]
