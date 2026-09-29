from django.db import models

from apps.core.models import SchoolScopedModel


class Certificate(SchoolScopedModel):
    """A printable document issued to a student.

    `body` and `title` may contain {placeholders} (e.g. {student_name}, {class},
    {date}) that are substituted at print time from the student/school.
    """

    TYPE_CUSTOM = "custom"
    TYPE_TESTIMONIAL = "testimonial"
    TYPE_TRANSFER = "transfer"
    TYPE_CHOICES = [
        (TYPE_CUSTOM, "Custom Certificate"),
        (TYPE_TESTIMONIAL, "Testimonial"),
        (TYPE_TRANSFER, "Transfer Certificate"),
    ]

    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="certificates")
    cert_type = models.CharField(max_length=20, choices=TYPE_CHOICES,
                                 default=TYPE_CUSTOM)
    title = models.CharField(max_length=200)
    reference_no = models.CharField(max_length=50, blank=True)
    issue_date = models.DateField()
    body = models.TextField(help_text="Supports {placeholders}.")
    signatory_name = models.CharField(max_length=150, blank=True)
    signatory_designation = models.CharField(max_length=150, blank=True)

    class Meta:
        ordering = ["-issue_date", "-created_at"]

    def __str__(self):
        return f"{self.get_cert_type_display()} — {self.student.full_name}"


class Student(SchoolScopedModel):
    GENDER_CHOICES = [("male", "Male"), ("female", "Female"), ("other", "Other")]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("transferred", "Transferred"),
        ("alumni", "Alumni"),
        ("inactive", "Inactive"),
    ]

    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="student_profile",
        null=True,
        blank=True,
    )
    admission_number = models.CharField(max_length=50)
    roll_number = models.CharField(max_length=20, blank=True)
    full_name = models.CharField(max_length=200)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    blood_group = models.CharField(max_length=5, blank=True)
    photo = models.ImageField(upload_to="student_photos/", blank=True, null=True)

    current_class = models.ForeignKey(
        "academics.SchoolClass", on_delete=models.SET_NULL, null=True, related_name="students"
    )
    current_section = models.ForeignKey(
        "academics.Section", on_delete=models.SET_NULL, null=True, related_name="students"
    )
    academic_year = models.ForeignKey(
        "academics.AcademicYear", on_delete=models.SET_NULL, null=True, related_name="students"
    )
    admission_date = models.DateField(null=True, blank=True)
    admission_type = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True, verbose_name="Present Address")
    permanent_address = models.TextField(blank=True)
    present_thana = models.CharField(max_length=100, blank=True)
    present_zilla = models.CharField(max_length=100, blank=True)
    present_postal_code = models.CharField(max_length=20, blank=True)
    permanent_thana = models.CharField(max_length=100, blank=True)
    permanent_zilla = models.CharField(max_length=100, blank=True)
    permanent_postal_code = models.CharField(max_length=20, blank=True)
    emergency_contact = models.CharField(max_length=30, blank=True)
    previous_school = models.CharField(max_length=200, blank=True)
    medical_notes = models.TextField(blank=True, help_text="Admin/designated staff only")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    # Plaintext temporary portal password, shown on the admission slip so the
    # office can hand it to the student. They should change it on first login.
    login_temp_password = models.CharField(max_length=64, blank=True)

    class Meta:
        unique_together = [("school", "admission_number")]
        ordering = ["roll_number"]

    def __str__(self):
        return f"{self.full_name} ({self.admission_number})"


class Guardian(SchoolScopedModel):
    RELATION_CHOICES = [
        ("father", "Father"),
        ("mother", "Mother"),
        ("other", "Other"),
    ]

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="guardians"
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="guardian_of",
        null=True,
        blank=True,
        help_text="Parent portal login",
    )
    relation = models.CharField(max_length=10, choices=RELATION_CHOICES)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    nid = models.CharField(max_length=50, blank=True)
    is_primary_contact = models.BooleanField(default=False)
    can_login_to_portal = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.get_relation_display()})"


class AdmissionApplication(SchoolScopedModel):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    GENDER_CHOICES = [("male", "Male"), ("female", "Female"), ("other", "Other")]

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    # Public reference the applicant uses to track status / print an admit card.
    tracking_code = models.CharField(max_length=40, blank=True, default="")
    track_token = models.CharField(max_length=32, blank=True, default="", db_index=True)
    # Applicant details (submitted via the public admission form)
    full_name = models.CharField(max_length=200, default="")
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, default="")
    class_applied = models.CharField(max_length=50, blank=True, default="")
    phone = models.CharField(max_length=30, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    address = models.TextField(blank=True, default="", verbose_name="Present Address")
    permanent_address = models.TextField(blank=True, default="")
    present_thana = models.CharField(max_length=100, blank=True, default="")
    present_zilla = models.CharField(max_length=100, blank=True, default="")
    present_postal_code = models.CharField(max_length=20, blank=True, default="")
    permanent_thana = models.CharField(max_length=100, blank=True, default="")
    permanent_zilla = models.CharField(max_length=100, blank=True, default="")
    permanent_postal_code = models.CharField(max_length=20, blank=True, default="")
    previous_school = models.CharField(max_length=200, blank=True, default="")
    # Documents
    birth_certificate = models.FileField(
        upload_to="admission_docs/", blank=True, null=True)
    transfer_certificate = models.FileField(
        upload_to="admission_docs/", blank=True, null=True,
        help_text="Optional — for students coming from another school.")

    reviewed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_student = models.ForeignKey(
        Student, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} — {self.get_status_display()}"


class StudentTransfer(SchoolScopedModel):
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="transfers"
    )
    from_section = models.ForeignKey(
        "academics.Section", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    to_section = models.ForeignKey(
        "academics.Section", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    transfer_date = models.DateField()
    reason = models.TextField(blank=True)

class ApplicationGuardian(models.Model):
    application = models.ForeignKey(AdmissionApplication, on_delete=models.CASCADE, related_name="guardians")
    relation = models.CharField(max_length=50, choices=[('father', 'Father'), ('mother', 'Mother'), ('other', 'Other')])
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.get_relation_display()})"
