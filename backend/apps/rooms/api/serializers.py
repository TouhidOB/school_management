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
    AssignmentSubmissionFile,
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

class ClassRoomSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True, default=None)
    section_name = serializers.CharField(source="section.__str__", read_only=True, default=None)

    class Meta:
        model = ClassRoom
        fields = [
            "id", "name", "room_code", "subject", "subject_name", "section",
            "section_name", "academic_year", "teachers", "cover_image",
            "description", "is_active",
        ]
        read_only_fields = ["room_code", "created_by"]


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = [
            "id", "room", "title", "description", "file", "topic",
            "chapter", "is_important",
        ]
        read_only_fields = ["uploaded_by"]


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = [
            "id", "room", "title", "instructions", "attachment",
            "due_datetime", "total_marks", "is_published",
        ]



class AssignmentSubmissionFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentSubmissionFile
        fields = ["id", "file", "file_name"]

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    files = AssignmentSubmissionFileSerializer(many=True, read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = [
            "id", "assignment", "student", "student_name", "text_answer",
            "files", "submitted_at", "is_late", "marks_obtained",
            "feedback", "graded_at",
        ]
        read_only_fields = ["submitted_at", "is_late", "graded_at", "graded_by"]


class RoomPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomPost
        fields = [
            "id", "room", "content", "attachment", "post_type",
            "is_pinned", "published_at",
        ]
        read_only_fields = ["author", "published_at"]


class RoomMembershipSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = RoomMembership
        fields = ["id", "room", "student", "student_name", "is_active"]
