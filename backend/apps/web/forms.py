from django import forms
from django.contrib.auth import get_user_model
from django.db.models import ForeignKey, ManyToManyField
from django.utils.crypto import get_random_string

from apps.academics.models import (AcademicYear, RoutineSlot, SchoolClass,
                                   Section, Subject)
from apps.attendance.models import BiometricEnrollment
from apps.exams.models import ExamSession, ExamSubject
from apps.fees.models import FeeStructure, FeeType, Invoice, Payment
from apps.ratings.models import RatingPeriod, TeacherRating
from apps.rooms.models import Assignment, ClassRoom, Note, RoomPost
from apps.students.models import (AdmissionApplication, Certificate, Guardian,
                                  Student)
from apps.teachers.models import Designation, TeacherProfile
from apps.tenants.models import ContactMessage, School, SubscriptionPlan

User = get_user_model()


class ContactMessageForm(forms.ModelForm):
    """Super Admin edit/create form for contact leads (platform-level)."""

    class Meta:
        model = ContactMessage
        fields = ["name", "school_name", "email", "phone", "topic", "message",
                  "is_handled"]
        widgets = {"message": forms.Textarea(attrs={"rows": 5})}


class TenantModelForm(forms.ModelForm):
    """ModelForm that scopes every school-owned FK/M2M dropdown to one tenant."""

    def __init__(self, *args, school=None, **kwargs):
        self.school = school
        super().__init__(*args, **kwargs)
        if school is None:
            return
        for name, field in self.fields.items():
            model = getattr(field, "queryset", None)
            if model is not None and _has_school(field.queryset.model):
                field.queryset = field.queryset.model.all_objects.filter(school=school)


def _has_school(model):
    return any(f.name == "school" for f in model._meta.fields) or any(
        isinstance(f, (ForeignKey, ManyToManyField)) and f.name == "school"
        for f in model._meta.get_fields()
    )


# ---- Academics -------------------------------------------------------------
class AcademicYearForm(TenantModelForm):
    class Meta:
        model = AcademicYear
        fields = ["name", "start_date", "end_date", "is_current"]
        widgets = {
            "start_date": forms.DateInput(attrs={"type": "date"}),
            "end_date": forms.DateInput(attrs={"type": "date"}),
        }


class SubjectForm(TenantModelForm):
    class Meta:
        model = Subject
        fields = ["school_class", "name", "code"]
        help_texts = {
            "code": "Unique across the whole school, e.g. MATH-9.",
            "school_class": "The class this subject is taught in.",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["school_class"].required = True

    def clean_code(self):
        code = self.cleaned_data["code"].strip().upper()
        qs = Subject.all_objects.filter(school=self.school, code__iexact=code)
        if self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError(
                "This code is already used by another subject in your school.")
        return code


class SchoolClassForm(TenantModelForm):
    class Meta:
        model = SchoolClass
        fields = ["name", "numeric_level"]


class SectionForm(TenantModelForm):
    class Meta:
        model = Section
        fields = ["school_class", "academic_year", "name", "class_teacher"]


class RoutineSlotForm(TenantModelForm):
    """Add/edit a single class-routine cell. Section is set by the view."""

    class Meta:
        model = RoutineSlot
        fields = ["day_of_week", "period", "start_time", "end_time",
                  "subject", "teacher", "room", "is_break"]
        widgets = {
            "start_time": forms.TimeInput(attrs={"type": "time"}),
            "end_time": forms.TimeInput(attrs={"type": "time"}),
        }

    def clean(self):
        cleaned = super().clean()
        start, end = cleaned.get("start_time"), cleaned.get("end_time")
        if start and end and end <= start:
            self.add_error("end_time", "End time must be after start time.")
        # A teaching slot needs a subject; a break row does not.
        if not cleaned.get("is_break") and not cleaned.get("subject"):
            self.add_error("subject", "Pick a subject (or mark it as a break).")
        return cleaned


# ---- Teachers --------------------------------------------------------------
class DesignationForm(TenantModelForm):
    class Meta:
        model = Designation
        fields = ["name", "rank_order", "permissions_group"]


class TeacherForm(TenantModelForm):
    """Teachers are staff records only — no login account is created."""

    class Meta:
        model = TeacherProfile
        fields = ["full_name", "email", "phone", "employee_id", "designation",
                  "joining_date", "contract_type", "subjects", "sections",
                  "salary_basic", "status"]
        widgets = {"joining_date": forms.DateInput(attrs={"type": "date"})}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["designation"].required = False
        self.fields["full_name"].required = True


# ---- Students --------------------------------------------------------------
class StudentForm(TenantModelForm):
    class Meta:
        model = Student
        fields = ["full_name", "admission_number", "roll_number", "dob", "gender",
                  "blood_group", "photo", "current_class", "current_section",
                  "academic_year", "admission_date", "admission_type", "address",
                  "emergency_contact", "previous_school", "medical_notes", "status"]
        widgets = {
            "dob": forms.DateInput(attrs={"type": "date"}),
            "admission_date": forms.DateInput(attrs={"type": "date"}),
            "medical_notes": forms.Textarea(attrs={"rows": 2}),
            "address": forms.Textarea(attrs={"rows": 2}),
        }


class GuardianForm(TenantModelForm):
    class Meta:
        model = Guardian
        fields = ["relation", "name", "phone", "email", "occupation", "nid",
                  "is_primary_contact", "can_login_to_portal"]


class AdmissionApplicationForm(forms.ModelForm):
    """Public admission form. `school` is bound by the view, not the applicant."""

    class Meta:
        model = AdmissionApplication
        fields = ["full_name", "dob", "gender", "class_applied",
                  "father_name", "father_occupation", "father_phone",
                  "mother_name", "mother_occupation", "mother_phone",
                  "phone", "email", "address", "previous_school",
                  "birth_certificate", "transfer_certificate",
                  "guardian_name", "guardian_phone", "guardian_email"]
        widgets = {
            "dob": forms.DateInput(attrs={"type": "date"}),
            "address": forms.Textarea(attrs={"rows": 2}),
        }
        labels = {
            "birth_certificate": "Birth certificate",
            "transfer_certificate": "Transfer certificate (optional)",
        }

    def __init__(self, *args, school=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["full_name"].required = True
        for name in ("father_name", "mother_name", "birth_certificate"):
            self.fields[name].required = True
        # Offer the school's classes as a dropdown when it has any.
        if school is not None:
            from apps.academics.models import SchoolClass
            names = list(SchoolClass.all_objects.filter(school=school)
                         .order_by("numeric_level").values_list("name", flat=True))
            if names:
                self.fields["class_applied"] = forms.ChoiceField(
                    label="Class applying for",
                    choices=[("", "— select —")] + [(n, n) for n in names])


class AdmissionFormSettingsForm(forms.ModelForm):
    class Meta:
        model = School
        fields = ["admission_mode", "admission_google_form_url",
                  "admission_form_pdf", "admission_instructions"]
        widgets = {"admission_instructions": forms.Textarea(attrs={"rows": 3})}
        labels = {"admission_google_form_url": "Google Form URL (online form)"}


class AdmissionApproveForm(TenantModelForm):
    """Admin picks placement when approving an application -> creates a Student."""

    admission_number = forms.CharField(max_length=50)

    class Meta:
        model = Student
        fields = ["admission_number", "current_class", "current_section",
                  "academic_year", "roll_number"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for name in ("current_class", "current_section", "academic_year",
                     "roll_number"):
            self.fields[name].required = False


class CertificateForm(TenantModelForm):
    class Meta:
        model = Certificate
        fields = ["student", "cert_type", "title", "reference_no", "issue_date",
                  "body", "signatory_name", "signatory_designation"]
        widgets = {
            "issue_date": forms.DateInput(attrs={"type": "date"}),
            "body": forms.Textarea(attrs={"rows": 8}),
        }


# ---- Rooms -----------------------------------------------------------------
class RoomForm(TenantModelForm):
    class Meta:
        model = ClassRoom
        fields = ["name", "room_code", "subject", "section", "academic_year",
                  "teachers", "cover_image", "description", "is_active"]


class RoomPostForm(TenantModelForm):
    class Meta:
        model = RoomPost
        fields = ["content", "attachment", "post_type", "is_pinned"]
        widgets = {"content": forms.Textarea(attrs={"rows": 3})}


class NoteForm(TenantModelForm):
    class Meta:
        model = Note
        fields = ["title", "description", "file", "link", "topic", "chapter", "is_important"]
        widgets = {"description": forms.Textarea(attrs={"rows": 3})}


class AssignmentForm(TenantModelForm):
    class Meta:
        model = Assignment
        fields = ["title", "instructions", "attachment", "due_datetime",
                  "total_marks", "is_published"]
        widgets = {
            "instructions": forms.Textarea(attrs={"rows": 3}),
            "due_datetime": forms.DateTimeInput(attrs={"type": "datetime-local"}),
        }


# ---- Fees ------------------------------------------------------------------
class FeeTypeForm(TenantModelForm):
    class Meta:
        model = FeeType
        fields = ["name", "fee_category", "frequency", "is_mandatory",
                  "is_active", "display_order"]


class FeeStructureForm(TenantModelForm):
    class Meta:
        model = FeeStructure
        fields = ["fee_type", "academic_year", "applicable_class", "amount"]


class InvoiceForm(TenantModelForm):
    class Meta:
        model = Invoice
        fields = ["student", "academic_year", "month", "invoice_number",
                  "invoice_date", "due_date", "status"]
        widgets = {
            "invoice_date": forms.DateInput(attrs={"type": "date"}),
            "due_date": forms.DateInput(attrs={"type": "date"}),
        }
        help_texts = {"invoice_number": "Leave blank to auto-generate."}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["invoice_number"].required = False


class PaymentForm(TenantModelForm):
    class Meta:
        model = Payment
        fields = ["amount_paid", "payment_method", "transaction_id", "paid_at"]
        widgets = {"paid_at": forms.DateTimeInput(attrs={"type": "datetime-local"})}


# ---- Ratings ---------------------------------------------------------------
class RatingPeriodForm(TenantModelForm):
    class Meta:
        model = RatingPeriod
        fields = ["name", "start_date", "end_date", "is_active", "eligible_classes"]
        widgets = {
            "start_date": forms.DateInput(attrs={"type": "date"}),
            "end_date": forms.DateInput(attrs={"type": "date"}),
        }


class TeacherRatingForm(TenantModelForm):
    class Meta:
        model = TeacherRating
        fields = ["score_teaching_quality", "score_punctuality", "score_helpfulness",
                  "score_assignment_feedback", "score_communication", "score_overall",
                  "text_comment"]
        widgets = {"text_comment": forms.Textarea(attrs={"rows": 3})}


# ---- Exams -----------------------------------------------------------------
class ExamSessionForm(TenantModelForm):
    class Meta:
        model = ExamSession
        fields = ["name", "academic_year", "start_date", "end_date",
                  "is_published", "is_final"]
        widgets = {
            "start_date": forms.DateInput(attrs={"type": "date"}),
            "end_date": forms.DateInput(attrs={"type": "date"}),
        }


class ExamSubjectForm(TenantModelForm):
    """One paper: subject + schedule + hall + guard teacher (exam routine row)."""

    class Meta:
        model = ExamSubject
        fields = ["exam_session", "subject", "school_class", "exam_date",
                  "start_time", "end_time", "exam_room", "invigilator",
                  "total_marks", "pass_marks"]
        widgets = {
            "exam_date": forms.DateInput(attrs={"type": "date"}),
            "start_time": forms.TimeInput(attrs={"type": "time"}),
            "end_time": forms.TimeInput(attrs={"type": "time"}),
        }
        labels = {
            "exam_room": "Exam hall / room no.",
            "invigilator": "Guard teacher",
        }

    def clean(self):
        cleaned = super().clean()
        subject, school_class = cleaned.get("subject"), cleaned.get("school_class")
        if subject and school_class and subject.school_class_id and \
                subject.school_class_id != school_class.pk:
            self.add_error("subject",
                           f"{subject.name} belongs to {subject.school_class.name}, "
                           f"not {school_class.name}.")
        start, end = cleaned.get("start_time"), cleaned.get("end_time")
        if start and end and end <= start:
            self.add_error("end_time", "End time must be after start time.")
        return cleaned


# ---- Biometric attendance --------------------------------------------------
class BiometricEnrollmentForm(TenantModelForm):
    """Map a device fingerprint id to a student OR a teacher (exactly one)."""

    class Meta:
        model = BiometricEnrollment
        fields = ["device_user_id", "student", "teacher", "label"]
        help_texts = {
            "device_user_id": "The user/enrollment id programmed on the device.",
            "label": "Optional display name (auto-filled from the person).",
        }

    def clean(self):
        cd = super().clean()
        student, teacher = cd.get("student"), cd.get("teacher")
        if bool(student) == bool(teacher):
            raise forms.ValidationError(
                "Pick exactly one — either a student or a teacher.")
        if not cd.get("label"):
            person = student or teacher
            cd["label"] = getattr(person, "full_name", None) or str(person)
        return cd


class DeviceSettingsForm(forms.ModelForm):
    class Meta:
        model = School
        fields = ["device_brand", "device_api_key", "device_api_secret",
                  "device_api_url", "attendance_late_after"]
        widgets = {
            "attendance_late_after": forms.TimeInput(
                attrs={"type": "time"}, format="%H:%M"),
            "device_api_secret": forms.PasswordInput(render_value=True),
        }
        help_texts = {
            "device_api_key": "Brand's API key/app key, if the device uses one.",
            "device_api_url": "Cloud/device API base URL, if applicable.",
            "attendance_late_after": "Student punches at/after this time are marked Late.",
        }


# ---- Platform (Super Admin) ------------------------------------------------
class SubscriptionPlanForm(forms.ModelForm):
    class Meta:
        model = SubscriptionPlan
        fields = ["name", "tier", "student_limit", "price_monthly",
                  "price_yearly", "is_active"]


# ---- Public school registration (requires Super Admin approval) ------------
class SchoolRegistrationForm(forms.Form):
    """A school signs itself up; the tenant starts as Pending until the
    Super Admin approves it."""

    school_name = forms.CharField(max_length=200)
    school_type = forms.ChoiceField(choices=School.SCHOOL_TYPES)
    slug = forms.SlugField(
        max_length=30, label="Subdomain",
        help_text="Short name used in your school's URL, e.g. greenvalley")
    address = forms.CharField(widget=forms.Textarea(attrs={"rows": 2}),
                              required=False)
    country = forms.CharField(max_length=80, required=False, initial="Bangladesh")
    admin_name = forms.CharField(max_length=150, label="Your full name")
    admin_email = forms.EmailField(label="Email (this becomes your login)")
    phone = forms.CharField(max_length=30, required=False)
    password = forms.CharField(widget=forms.PasswordInput, min_length=8)

    def clean_slug(self):
        slug = self.cleaned_data["slug"].lower()
        if School.all_objects.filter(slug=slug).exists():
            raise forms.ValidationError("That subdomain is taken.")
        return slug

    def clean_admin_email(self):
        email = self.cleaned_data["admin_email"].lower()
        if User.objects.filter(username=email).exists():
            raise forms.ValidationError("An account with this email already exists.")
        return email

    def save(self):
        cd = self.cleaned_data
        school = School.all_objects.create(
            name=cd["school_name"], slug=cd["slug"],
            school_type=cd["school_type"], admin_email=cd["admin_email"],
            phone=cd["phone"], address=cd["address"], country=cd["country"],
            status=School.STATUS_PENDING,
        )
        User.objects.create_user(
            username=cd["admin_email"], email=cd["admin_email"],
            password=cd["password"], first_name=cd["admin_name"],
            role=User.ROLE_SCHOOL_ADMIN, school=school,
        )
        return school


# ---- School provisioning (Super Admin only) --------------------------------
class SchoolCreateForm(forms.Form):
    """Super Admin manually provisions a school + its admin account.

    Billing is offline (flat ৳10/student), so there is no plan/payment step —
    just create the tenant and hand the admin their credentials.
    """

    school_name = forms.CharField(max_length=200)
    school_type = forms.ChoiceField(choices=School.SCHOOL_TYPES)
    slug = forms.SlugField(max_length=30, label="Subdomain",
                           help_text="used as the school's subdomain / URL slug")
    admin_name = forms.CharField(max_length=150, label="Admin full name")
    admin_email = forms.EmailField(label="Admin email (login)")
    phone = forms.CharField(max_length=30, required=False)
    country = forms.CharField(max_length=80, required=False,
                              initial="Bangladesh")
    password = forms.CharField(widget=forms.PasswordInput, min_length=8,
                               label="Admin password")
    status = forms.ChoiceField(choices=School.STATUS_CHOICES,
                               initial=School.STATUS_ACTIVE)
    device_brand = forms.ChoiceField(
        choices=School.DEVICE_BRANDS, initial=School.DEVICE_NONE,
        label="Fingerprint device brand",
        help_text="Attendance machine used by this school (sets the API format).")
    device_api_key = forms.CharField(
        required=False, label="Device API key",
        help_text="Brand's API key/app key, if the device uses one.")
    device_api_secret = forms.CharField(
        required=False, label="Device API secret",
        widget=forms.PasswordInput(render_value=True))
    device_api_url = forms.URLField(
        required=False, label="Device API URL",
        help_text="Cloud/device API base URL, if applicable.")

    def clean_slug(self):
        slug = self.cleaned_data["slug"].lower()
        if School.all_objects.filter(slug=slug).exists():
            raise forms.ValidationError("That subdomain is taken.")
        return slug

    def clean_admin_email(self):
        email = self.cleaned_data["admin_email"].lower()
        if User.objects.filter(username=email).exists():
            raise forms.ValidationError("An account with this email already exists.")
        return email

    def save(self):
        cd = self.cleaned_data
        school = School.all_objects.create(
            name=cd["school_name"], slug=cd["slug"],
            school_type=cd["school_type"], admin_email=cd["admin_email"],
            phone=cd["phone"], country=cd["country"], status=cd["status"],
            device_brand=cd["device_brand"],  # save() auto-issues device_token
            device_api_key=cd["device_api_key"],
            device_api_secret=cd["device_api_secret"],
            device_api_url=cd["device_api_url"],
        )
        User.objects.create_user(
            username=cd["admin_email"], email=cd["admin_email"],
            password=cd["password"], first_name=cd["admin_name"],
            role=User.ROLE_SCHOOL_ADMIN, school=school,
        )
        return school
