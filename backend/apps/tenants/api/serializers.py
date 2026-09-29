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

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = "__all__"


class SchoolSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    student_count = serializers.SerializerMethodField()
    modules = serializers.SerializerMethodField()

    class Meta:
        model = School
        exclude = ["device_api_secret", "device_token"]

    def get_student_count(self, obj):
        return obj.students.count()

    def get_modules(self, obj):
        return obj.get_modules()


class SchoolWriteSerializer(serializers.ModelSerializer):
    """Super Admin create/update. Optional admin_password provisions a School
    Admin login on create (mirrors the old one-form provisioning)."""

    admin_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    admin_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = School
        fields = [
            "id", "name", "slug", "school_type", "admin_email", "phone",
            "alternative_phone", "website", "address", "country", "division",
            "district", "city", "postal_code", "timezone", "currency", "language",
            "primary_color", "status", "plan", "modules",
            "admissions_open", "admission_mode", "device_brand",
            "admin_password", "admin_name", "registration_number",
            "default_grading_system", "default_attendance_system",
            "school_working_days", "school_start_time", "school_end_time"
        ]

    def create(self, validated_data):
        # admin_* are not School fields — the viewset uses them to provision a
        # login; strip before persisting the School.
        validated_data.pop("admin_password", None)
        validated_data.pop("admin_name", None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("admin_password", None)
        validated_data.pop("admin_name", None)
        return super().update(instance, validated_data)


class SchoolSelfSerializer(serializers.ModelSerializer):
    """The caller's own school (branding/settings for the SPA header)."""
    modules = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = [
            "id", "name", "slug", "school_type", "admin_email", "phone",
            "address", "country", "logo", "primary_color", "status",
            "admissions_open", "admission_mode", "admission_instructions",
            "modules",
        ]
        read_only_fields = ["slug", "status", "modules"]

    def get_modules(self, obj):
        return obj.get_modules()


class DeviceSettingsSerializer(serializers.ModelSerializer):
    """Biometric device config for a school. `device_token` is read-only (the
    device's credential — shown so the admin can hand it to the middleware);
    api_secret is write-only."""

    device_brand_display = serializers.CharField(source="get_device_brand_display", read_only=True)
    device_api_secret = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = School
        fields = [
            "device_brand", "device_brand_display", "device_token",
            "device_api_key", "device_api_secret", "device_api_url",
            "attendance_late_after",
        ]
        read_only_fields = ["device_token"]


class PublicSchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = [
            "id", "name", "slug", "school_type", "logo", "primary_color",
            "address", "country", "admissions_open", "admission_mode",
            "admission_google_form_url", "admission_instructions",
        ]


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = "__all__"
