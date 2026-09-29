"""API serializers.

`school` is never accepted from the client — the viewset stamps it from the
caller's effective school (see base.SchoolScopedViewSet) — so it is read-only
everywhere below.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.core.api import get_active_school
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

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ["id", "name", "start_date", "end_date", "is_current"]


class SchoolClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolClass
        fields = ["id", "name", "numeric_level"]

    def validate(self, attrs):
        request = self.context.get('request')
        if not request:
            return attrs
            
        school = get_active_school(request)
        name = attrs.get('name')
        numeric_level = attrs.get('numeric_level', 0)
        
        # Build base queryset for the current school
        qs = SchoolClass.objects.filter(school=school)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
            # If not provided in patch, keep existing
            name = name if name is not None else self.instance.name
            numeric_level = numeric_level if numeric_level is not None else self.instance.numeric_level
            
        if name and qs.filter(name__iexact=name).exists():
            raise serializers.ValidationError({"name": "A class with this name already exists."})
            
        if qs.filter(numeric_level=numeric_level).exists():
            raise serializers.ValidationError(
                {"numeric_level": "A class with this Level number already exists. Please choose a unique sequence number."}
            )
            
        return attrs


class SubjectSerializer(serializers.ModelSerializer):
    school_class_name = serializers.CharField(
        source="school_class.name", read_only=True, default=None)

    class Meta:
        model = Subject
        fields = ["id", "name", "code", "school_class", "school_class_name"]


class SectionSerializer(serializers.ModelSerializer):
    school_class_name = serializers.CharField(source="school_class.name", read_only=True)
    academic_year_name = serializers.CharField(source="academic_year.name", read_only=True)

    class Meta:
        model = Section
        fields = [
            "id", "name", "school_class", "school_class_name",
            "academic_year", "academic_year_name", "class_teacher",
        ]


class RoutineSlotSerializer(serializers.ModelSerializer):
    day_display = serializers.CharField(source="get_day_of_week_display", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True, default=None)
    section_name = serializers.SerializerMethodField()
    teacher_name = serializers.CharField(source="teacher.display_name", read_only=True, default=None)

    class Meta:
        model = RoutineSlot
        fields = [
            "id", "section", "section_name", "day_of_week", "day_display", "period",
            "start_time", "end_time", "subject", "subject_name", "teacher", "teacher_name",
            "room", "is_break",
        ]
        
    def get_section_name(self, obj):
        return str(obj.section) if obj.section else None

from apps.academics.models import Event, StudyMaterial, OnlineClass

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ["school", "created_at", "updated_at"]

class StudyMaterialSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = StudyMaterial
        fields = "__all__"
        read_only_fields = ["school", "uploaded_by"]

class OnlineClassSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = OnlineClass
        fields = "__all__"
        read_only_fields = ["school", "host"]
