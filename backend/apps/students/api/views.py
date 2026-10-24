import datetime
"""API viewsets.

Three tiers:
* Tenant-scoped resources -> `SchoolScopedViewSet` (auto-filtered by the
  caller's effective school; Super Admin picks the school via X-Active-School).
* Platform resources (schools, leads, plans, stats) -> `IsSuperAdmin`, operate
  across all tenants with `all_objects`.
* Public admissions -> `AllowAny`.
"""
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Value, CharField, Case, When
from django.db.models.functions import LPad
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
    AdmissionApplication,
    AlumniProfile,
    Certificate,
    Guardian,
    PassingBatch,
    Student,
    StudentTransfer,
)
from apps.teachers.models import Designation, TeacherProfile
from apps.tenants.models import ContactMessage, School, SubscriptionPlan

from apps.core.api import SchoolScopedViewSet, get_active_school
from apps.core.permissions import IsSuperAdmin
from . import serializers as s

User = get_user_model()

class StudentViewSet(SchoolScopedViewSet):
    queryset = Student.objects.all()
    serializer_class = s.StudentSerializer
    filterset_fields = ["current_class", "current_section", "academic_year", "status", "gender"]
    search_fields = ["full_name", "admission_number", "roll_number"]
    ordering_fields = [
        "sort_roll",
        "roll_number",
        "full_name",
        "admission_number",
        "current_class",
        "current_section",
        "academic_year",
    ]
    ordering = ["current_class__numeric_level", "sort_roll", "current_section__name", "full_name"]

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related(
            "current_class", "current_section", "academic_year"
        ).prefetch_related("guardians").annotate(
            sort_roll=Case(
                When(roll_number="", then=Value("9999999999")),
                When(roll_number__isnull=True, then=Value("9999999999")),
                default=LPad("roll_number", 10, Value("0")),
                output_field=CharField(),
            )
        )

    def filter_queryset(self, queryset):
        qs = super().filter_queryset(queryset)
        ordering = self.request.query_params.get("ordering")
        if ordering in ("roll_number", "sort_roll"):
            return qs.order_by("sort_roll", "current_section__name", "full_name")
        elif ordering in ("-roll_number", "-sort_roll"):
            return qs.order_by("-sort_roll", "-current_section__name", "-full_name")
        return qs

    def perform_create(self, serializer):
        school = getattr(self, "_active_school", None)
        if school is None:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No active school.")
            
        data = serializer.validated_data
        
        admission_number = data.get('admission_number', '')
        roll_number = data.get('roll_number', '')
        
        if not admission_number or admission_number.lower() == 'auto':
            prefix = getattr(school, 'id_prefix', 'ADM').strip()
            include_year = getattr(school, 'id_include_year', True)
            digits = getattr(school, 'id_digits', 4)
            
            year_str = ""
            count_filter = {'school': school}
            
            if include_year:
                year = datetime.date.today().year
                year_str = f"{year}-"
                count_filter['admission_date__year'] = year
                
            count = Student.objects.filter(**count_filter).count() + 1
            
            format_str = f"{{prefix}}-{{year_str}}{{count:0{digits}d}}" if prefix else f"{{year_str}}{{count:0{digits}d}}"
            # Clean up double dashes if prefix is empty
            admission_number = format_str.format(prefix=prefix, year_str=year_str, count=count).replace('--', '-').strip('-')
            
        if not roll_number or roll_number.lower() == 'auto':
            current_class = data.get('current_class')
            current_section = data.get('current_section')
            if current_class:
                qs = Student.objects.filter(school=school, current_class=current_class)
                if current_section:
                    qs = qs.filter(current_section=current_section)
                max_r = 0
                for st in qs:
                    try:
                        if st.roll_number:
                            r = int(st.roll_number)
                            if r > max_r: max_r = r
                    except Exception:
                        pass
                roll_number = str(max_r + 1)
            else:
                roll_number = "1"
        save_kwargs = {'school': school, 'admission_number': admission_number, 'roll_number': roll_number}
        if not data.get('academic_year'):
            curr_yr = AcademicYear.objects.filter(school=school, is_current=True).first() or AcademicYear.objects.filter(school=school).order_by('-id').first()
            if curr_yr:
                save_kwargs['academic_year'] = curr_yr
                
        serializer.save(**save_kwargs)



    @action(detail=False, methods=['get'])
    def next_ids(self, request):
        school = getattr(self, "_active_school", None)
        if not school:
            return Response({"admission_number": "Auto-generated", "roll_number": "Auto-generated"})
            
        class_id = request.query_params.get('class_id')
        
        # Calculate next admission number
        prefix = getattr(school, 'id_prefix', 'ADM').strip()
        include_year = getattr(school, 'id_include_year', True)
        digits = getattr(school, 'id_digits', 4)
        
        year_str = ""
        count_filter = {'school': school}
        
        if include_year:
            import datetime
            year = datetime.date.today().year
            year_str = f"{year}-"
            count_filter['admission_date__year'] = year
            
        count = Student.objects.filter(**count_filter).count() + 1
        format_str = f"{{prefix}}-{{year_str}}{{count:0{digits}d}}" if prefix else f"{{year_str}}{{count:0{digits}d}}"
        next_adm = format_str.format(prefix=prefix, year_str=year_str, count=count).replace('--', '-').strip('-')
        
        section_id = request.query_params.get('section_id')
        # Calculate next roll number
        next_roll = "1"
        if class_id:
            qs = Student.objects.filter(school=school, current_class_id=class_id)
            if section_id:
                qs = qs.filter(current_section_id=section_id)
            max_r = 0
            for st in qs:
                try:
                    if st.roll_number:
                        r = int(st.roll_number)
                        if r > max_r: max_r = r
                except Exception:
                    pass
            next_roll = str(max_r + 1)
            
        return Response({
            "admission_number": next_adm,
            "roll_number": next_roll
        })


    @action(detail=True, methods=['post'])
    def create_user_account(self, request, pk=None):
        student = self.get_object()
        if student.user:
            return Response({"detail": "User already exists", "email": student.user.email})
            
        email = request.data.get("email")
        if not email:
            # Fallback to generating an email if none provided
            email = f"student_{student.admission_number.lower()}@demo.local".replace("-", "")
            
        if User.objects.filter(email=email).exists():
            return Response({"detail": "Email already in use"}, status=400)
            
        password = request.data.get("password", "student123")
        
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            role=User.ROLE_STUDENT,
            school=student.school,
            first_name=student.full_name.split()[0],
            last_name=" ".join(student.full_name.split()[1:]) if " " in student.full_name else ""
        )
        student.user = user
        student.save()
        
        return Response({"detail": "User created", "email": user.email})

class GuardianViewSet(SchoolScopedViewSet):
    queryset = Guardian.objects.all()
    serializer_class = s.GuardianSerializer
    filterset_fields = ["student", "relation"]


class StudentTransferViewSet(SchoolScopedViewSet):
    queryset = StudentTransfer.objects.all()
    serializer_class = s.StudentTransferSerializer
    filterset_fields = ["student"]


class CertificateViewSet(SchoolScopedViewSet):
    required_module = "certificates"
    queryset = Certificate.objects.select_related("student").all()
    serializer_class = s.CertificateSerializer
    filterset_fields = ["student", "cert_type"]


class AdmissionApplicationViewSet(SchoolScopedViewSet):
    required_module = "admissions"
    queryset = AdmissionApplication.objects.all()
    serializer_class = s.AdmissionApplicationSerializer
    filterset_fields = ["status"]
    search_fields = ["full_name", "phone", "email", "tracking_code"]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve an application AND materialise it into a Student record
        (placement + guardians copied from the applicant), mirroring the old
        review flow. Body: admission_number, current_class, current_section,
        academic_year, roll_number."""
        app = self.get_object()
        if app.created_student_id:
            return Response({"detail": "Already admitted.", "student": app.created_student_id})

        d = request.data
        student = Student(
            school=app.school,
            admission_number=d.get("admission_number") or app.tracking_code,
            roll_number=d.get("roll_number", ""),
            full_name=app.full_name,
            dob=app.dob or None,
            gender=app.gender,
            address=app.address,
            previous_school=app.previous_school,
            admission_date=timezone.now().date(),
            current_class_id=d.get("current_class") or None,
            current_section_id=d.get("current_section") or None,
            academic_year_id=d.get("academic_year") or None,
        )
        student.save()

        # Copy the applicant's parents/guardian into Guardian rows.
        if app.father_name:
            Guardian.objects.create(
                school=app.school, student=student, relation="father",
                name=app.father_name, phone=app.father_phone,
                occupation=app.father_occupation, is_primary_contact=True)
        if app.mother_name:
            Guardian.objects.create(
                school=app.school, student=student, relation="mother",
                name=app.mother_name, phone=app.mother_phone,
                occupation=app.mother_occupation,
                is_primary_contact=not app.father_name)
        if app.guardian_name:
            Guardian.objects.create(
                school=app.school, student=student, relation="other",
                name=app.guardian_name, phone=app.guardian_phone,
                email=app.guardian_email,
                is_primary_contact=not (app.father_name or app.mother_name))

        app.status = "approved"
        app.created_student = student
        app.reviewed_by = request.user
        app.reviewed_at = timezone.now()
        app.save()
        return Response({
            **self.get_serializer(app).data,
            "created_student": student.id,
        })

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        app = self.get_object()
        app.status = "rejected"
        app.rejection_reason = request.data.get("reason", "")
        app.reviewed_by = request.user
        app.reviewed_at = timezone.now()
        app.save()
        return Response(self.get_serializer(app).data)


class PassingBatchViewSet(SchoolScopedViewSet):
    required_module = "exStudents"
    queryset = PassingBatch.objects.all()
    serializer_class = s.PassingBatchSerializer
    filterset_fields = ["passing_year", "graduating_class", "academic_year"]
    search_fields = ["name", "description"]
    ordering_fields = ["passing_year", "name", "created_at"]
    ordering = ["-passing_year", "-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related("graduating_class", "academic_year").annotate(
            total_students=Count("alumni_members", distinct=True)
        )

    @action(detail=True, methods=["get"])
    def students(self, request, pk=None):
        """Returns all alumni in this batch with student demographic details."""
        batch = self.get_object()
        qs = AlumniProfile.objects.filter(
            batch=batch
        ).select_related("student", "batch")
        
        search = request.query_params.get("search")
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(student__full_name__icontains=search) |
                Q(student__admission_number__icontains=search) |
                Q(passing_roll__icontains=search) |
                Q(current_institution__icontains=search) |
                Q(current_occupation__icontains=search) |
                Q(contact_phone__icontains=search)
            )

        status_filter = request.query_params.get("current_status")
        if status_filter:
            qs = qs.filter(current_status=status_filter)

        ordering = request.query_params.get("ordering", "passing_roll")
        if ordering:
            qs = qs.order_by(ordering)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = s.AlumniProfileSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = s.AlumniProfileSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def graduate_class(self, request, pk=None):
        """Bulk graduate students into this batch and mark them as alumni."""
        batch = self.get_object()
        data = request.data
        student_ids = data.get("student_ids", [])
        academic_year_id = data.get("academic_year_id")
        class_id = data.get("class_id")
        results_map = data.get("results", {})
        default_result = data.get("default_result", "Passed")
        graduation_date = data.get("graduation_date") or batch.graduation_date

        if not student_ids and academic_year_id and class_id:
            student_ids = list(
                Student.objects.filter(
                    school=self._active_school,
                    current_class_id=class_id,
                    academic_year_id=academic_year_id,
                    status="active"
                ).values_list("id", flat=True)
            )

        if not student_ids:
            return Response({"error": "No students selected to graduate."}, status=400)

        students = Student.objects.filter(
            id__in=student_ids,
            school=self._active_school
        ).prefetch_related("guardians")

        graduated_count = 0
        for student in students:
            student.status = "alumni"
            student.save(update_fields=["status"])

            primary_guardian = student.guardians.filter(is_primary_contact=True).first()
            phone = student.emergency_contact or (primary_guardian.phone if primary_guardian else "")
            city = student.present_zilla or student.present_thana or ""

            result_val = results_map.get(str(student.id)) or results_map.get(student.id) or default_result

            profile, created = AlumniProfile.objects.update_or_create(
                school=self._active_school,
                student=student,
                defaults={
                    "batch": batch,
                    "passing_roll": student.roll_number or "",
                    "passing_result": result_val or "Passed",
                    "contact_phone": phone,
                    "current_city": city,
                }
            )
            graduated_count += 1

        if graduation_date and not batch.graduation_date:
            batch.graduation_date = graduation_date
            batch.save(update_fields=["graduation_date"])

        return Response({
            "message": f"Successfully graduated {graduated_count} students into {batch.name}!",
            "graduated_count": graduated_count,
            "batch_id": batch.id,
            "batch_name": batch.name,
        })


class AlumniProfileViewSet(SchoolScopedViewSet):
    required_module = "exStudents"
    queryset = AlumniProfile.objects.all()
    serializer_class = s.AlumniProfileSerializer
    filterset_fields = ["batch", "current_status", "batch__passing_year"]
    search_fields = [
        "student__full_name",
        "student__admission_number",
        "passing_roll",
        "current_institution",
        "current_occupation",
        "contact_phone",
    ]
    ordering_fields = ["passing_roll", "student__full_name", "created_at", "passing_result"]
    ordering = ["passing_roll", "student__full_name"]

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related("batch", "student")

    def perform_create(self, serializer):
        profile = serializer.save(school=self._active_school)
        if profile.student and profile.student.status != "alumni":
            profile.student.status = "alumni"
            profile.student.save(update_fields=["status"])

