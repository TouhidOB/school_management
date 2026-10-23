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
    AlumniProfile,
    ApplicationGuardian,
    Certificate,
    Guardian,
    PassingBatch,
    Student,
    StudentTransfer,
)
from apps.teachers.models import Designation, TeacherProfile
from apps.tenants.models import ContactMessage, School, SubscriptionPlan

class GuardianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guardian
        fields = [
            "id", "student", "relation", "name", "phone", "email",
            "occupation", "nid", "is_primary_contact", "can_login_to_portal",
        ]


class StudentSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source="current_class.name", read_only=True, default=None)
    section_name = serializers.CharField(source="current_section.name", read_only=True, default=None)
    academic_year_name = serializers.CharField(source="academic_year.name", read_only=True, default=None)
    user_email = serializers.EmailField(source="user.email", read_only=True, default=None)
    user_id = serializers.IntegerField(source="user.id", read_only=True, default=None)
    guardians = GuardianSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = [
            "id", "admission_number", "roll_number", "full_name", "dob",
            "gender", "blood_group", "photo", "current_class", "class_name",
            "current_section", "section_name", "academic_year", "academic_year_name",
            "admission_date", "admission_type", "address", "permanent_address", "present_thana", "present_zilla", "present_postal_code", "permanent_thana", "permanent_zilla", "permanent_postal_code", "emergency_contact",
            "previous_school", "medical_notes", "status", "guardians", "user_email", "user_id",
        ]
        extra_kwargs = {
            'admission_number': {'required': False, 'allow_blank': True},
            'roll_number': {'required': False, 'allow_blank': True}
        }


class StudentTransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentTransfer
        fields = ["id", "student", "from_section", "to_section", "transfer_date", "reason"]


class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    cert_type_display = serializers.CharField(source="get_cert_type_display", read_only=True)

    class Meta:
        model = Certificate
        fields = [
            "id", "student", "student_name", "cert_type", "cert_type_display",
            "title", "reference_no", "issue_date", "body",
            "signatory_name", "signatory_designation",
        ]



class ApplicationGuardianSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationGuardian
        fields = ["id", "relation", "name", "phone", "occupation", "email"]

class AdmissionApplicationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    guardians = ApplicationGuardianSerializer(many=True, required=False)

    class Meta:
        model = AdmissionApplication
        fields = [
            "id", "status", "status_display", "tracking_code", "full_name",
            "dob", "gender", "class_applied", "phone", "email", "address", "permanent_address", "present_thana", "present_zilla", "present_postal_code", "permanent_thana", "permanent_zilla", "permanent_postal_code",
            "previous_school", "guardian_phone",
            "guardians", "rejection_reason", "created_at",
        ]
        read_only_fields = ["status", "tracking_code"]

    def create(self, validated_data):
        guardians_data = validated_data.pop('guardians', [])
        application = super().create(validated_data)
        for g_data in guardians_data:
            ApplicationGuardian.objects.create(application=application, **g_data)
        return application

    def update(self, instance, validated_data):
        guardians_data = validated_data.pop('guardians', None)
        application = super().update(instance, validated_data)
        if guardians_data is not None:
            instance.guardians.all().delete()
            for g_data in guardians_data:
                ApplicationGuardian.objects.create(application=application, **g_data)
        return application



class PublicAdmissionApplicationSerializer(serializers.ModelSerializer):
    guardians = ApplicationGuardianSerializer(many=True, required=False)
    class Meta:
        model = AdmissionApplication
        fields = [
            "full_name", "dob", "gender", "class_applied", "phone", "email",
            "address", "previous_school", "guardian_phone",
            "father_occupation",
            "mother_phone",
        ]


class PassingBatchSerializer(serializers.ModelSerializer):
    graduating_class_name = serializers.CharField(source="graduating_class.name", read_only=True, default=None)
    academic_year_name = serializers.CharField(source="academic_year.name", read_only=True, default=None)
    total_students = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = PassingBatch
        fields = [
            "id", "name", "passing_year", "graduating_class", "graduating_class_name",
            "academic_year", "academic_year_name", "graduation_date", "description",
            "banner_image", "total_students", "created_at"
        ]


class AlumniProfileSerializer(serializers.ModelSerializer):
    batch_name = serializers.CharField(source="batch.name", read_only=True)
    batch_year = serializers.IntegerField(source="batch.passing_year", read_only=True)
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    admission_number = serializers.CharField(source="student.admission_number", read_only=True)
    gender = serializers.CharField(source="student.gender", read_only=True)
    blood_group = serializers.CharField(source="student.blood_group", read_only=True)
    emergency_contact = serializers.CharField(source="student.emergency_contact", read_only=True)
    student_photo = serializers.SerializerMethodField()
    current_status_display = serializers.CharField(source="get_current_status_display", read_only=True)

    class Meta:
        model = AlumniProfile
        fields = [
            "id", "batch", "batch_name", "batch_year", "student", "student_name",
            "student_photo", "admission_number", "gender", "blood_group", "emergency_contact",
            "passing_roll", "passing_result", "current_status", "current_status_display",
            "current_institution", "current_occupation", "contact_phone", "contact_email",
            "current_city", "achievements", "notes", "created_at"
        ]

    def get_student_photo(self, obj):
        if obj.student and obj.student.photo:
            try:
                return obj.student.photo.url
            except Exception:
                return None
        return None

