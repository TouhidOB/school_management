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
from apps.teachers.models import Designation, TeacherProfile, Department
from apps.tenants.models import ContactMessage, School, SubscriptionPlan

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name"]

class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = ["id", "name", "rank_order", "permissions_group"]


class TeacherProfileSerializer(serializers.ModelSerializer):
    designation_name = serializers.CharField(source="designation.name", read_only=True, default=None)
    department_name = serializers.CharField(source="department.name", read_only=True, default=None)
    display_name = serializers.CharField(source="__str__", read_only=True)
    
    # Optional fields for user account creation
    create_user_account = serializers.BooleanField(write_only=True, required=False, default=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = TeacherProfile
        fields = [
            "id", "first_name", "last_name", "full_name", "display_name",
            "dob", "gender", "blood_group", "photo",
            "email", "phone", "alternate_phone", "current_address", "permanent_address",
            "highest_qualification", "years_of_experience", "resume", "subjects",
            "employee_id", "joining_date", "department", "department_name", "designation", "designation_name", 
            "salary_basic", "contract_type", "sections",
            "status",
            "emergency_contact_name", "emergency_contact_relation", "emergency_contact_phone",
            "create_user_account", "password", "user_email", "user_id"
        ]
        read_only_fields = ["full_name"]
