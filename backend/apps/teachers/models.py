from django.db import models

from apps.core.models import SchoolScopedModel


class Department(SchoolScopedModel):
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = [("school", "name")]
        ordering = ["name"]

    def __str__(self):
        return self.name

class Designation(SchoolScopedModel):
    """Freely configurable per school (PRD Requirement 1)."""

    name = models.CharField(max_length=100)
    rank_order = models.PositiveSmallIntegerField(
        default=0, help_text="Lower = more senior, for display hierarchy"
    )
    permissions_group = models.CharField(max_length=100, blank=True)

    class Meta:
        unique_together = [("school", "name")]
        ordering = ["rank_order"]

    def __str__(self):
        return self.name


class TeacherProfile(SchoolScopedModel):
    CONTRACT_CHOICES = [
        ("permanent", "Permanent"),
        ("part_time", "Part-time"),
        ("contract", "Contract"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("resigned", "Resigned"),
        ("terminated", "Terminated"),
    ]

    # Teachers are records, not logins — the platform has only Super Admin and
    # School Admin accounts. `user` remains for rows created before that change.
    user = models.OneToOneField(
        "accounts.User", on_delete=models.SET_NULL,
        related_name="teacher_profile", null=True, blank=True,
    )
    
    # 1. Personal Information
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    full_name = models.CharField(max_length=200, blank=True)
    dob = models.DateField(null=True, blank=True)
    GENDER_CHOICES = [("male", "Male"), ("female", "Female"), ("other", "Other")]
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    blood_group = models.CharField(max_length=5, blank=True)
    photo = models.ImageField(upload_to="teacher_photos/", blank=True, null=True)

    # 2. Contact Details
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    alternate_phone = models.CharField(max_length=30, blank=True)
    current_address = models.TextField(blank=True)
    permanent_address = models.TextField(blank=True)

    # 3. Academic & Professional Background
    highest_qualification = models.CharField(max_length=100, blank=True)
    years_of_experience = models.PositiveSmallIntegerField(null=True, blank=True)
    resume = models.FileField(upload_to="teacher_resumes/", blank=True, null=True)
    subjects = models.ManyToManyField("academics.Subject", blank=True)

    # 4. Employment & Institutional Details
    employee_id = models.CharField(max_length=50, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="teachers")
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, related_name="teachers", null=True)
    salary_basic = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    contract_type = models.CharField(max_length=20, choices=CONTRACT_CHOICES, default="permanent")
    sections = models.ManyToManyField("academics.Section", blank=True)

    # 5. System Access & Security (user and status fields cover this mostly)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    # 6. Emergency Contact
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)
    emergency_contact_phone = models.CharField(max_length=30, blank=True)

    class Meta:
        unique_together = [("school", "employee_id")]

    def save(self, *args, **kwargs):
        if self.first_name or self.last_name:
            self.full_name = f"{self.first_name} {self.last_name}".strip()
        super().save(*args, **kwargs)

    def __str__(self):
        if self.full_name:
            return self.full_name
        if self.user_id:
            return self.user.get_full_name() or self.user.get_username()
        return f"Teacher #{self.pk}"


class DesignationHistory(SchoolScopedModel):
    teacher = models.ForeignKey(
        TeacherProfile, on_delete=models.CASCADE, related_name="designation_history"
    )
    old_designation = models.ForeignKey(
        Designation, on_delete=models.SET_NULL, null=True, related_name="+"
    )
    new_designation = models.ForeignKey(
        Designation, on_delete=models.SET_NULL, null=True, related_name="+"
    )
    changed_at = models.DateField()
    changed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="+"
    )

    class Meta:
        ordering = ["-changed_at"]
