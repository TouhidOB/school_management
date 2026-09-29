from django.db import models

from apps.core.models import SchoolScopedModel


class BiometricEnrollment(SchoolScopedModel):
    """Maps a fingerprint device's user id to a platform person.

    A punch arriving from the device carries only `device_user_id`; this table
    resolves it to the actual Student or TeacherProfile so attendance can be
    written. Exactly one of student/teacher is set.
    """

    device_user_id = models.CharField(
        max_length=64, help_text="Enrollment / user id stored on the device")
    label = models.CharField(max_length=150, blank=True,
                             help_text="Cached name for quick display")
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, null=True, blank=True,
        related_name="biometric_enrollments")
    teacher = models.ForeignKey(
        "teachers.TeacherProfile", on_delete=models.CASCADE, null=True, blank=True,
        related_name="biometric_enrollments")

    class Meta:
        unique_together = [("school", "device_user_id")]
        ordering = ["device_user_id"]

    @property
    def person(self):
        return self.student or self.teacher

    @property
    def kind(self):
        return "student" if self.student_id else "teacher" if self.teacher_id else "—"

    def __str__(self):
        return f"{self.device_user_id} → {self.person or 'unmapped'}"


class BiometricPunch(SchoolScopedModel):
    """Raw scan event received from a device, kept for audit + reprocessing."""

    STATUS_APPLIED = "applied"
    STATUS_UNRESOLVED = "unresolved"
    STATUS_DUPLICATE = "duplicate"
    STATUS_ERROR = "error"
    STATUS_CHOICES = [
        (STATUS_APPLIED, "Applied"),
        (STATUS_UNRESOLVED, "Unresolved (no enrollment)"),
        (STATUS_DUPLICATE, "Duplicate"),
        (STATUS_ERROR, "Error"),
    ]

    device_user_id = models.CharField(max_length=64)
    punched_at = models.DateTimeField()
    direction = models.CharField(max_length=10, default="in")
    enrollment = models.ForeignKey(
        BiometricEnrollment, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="punches")
    status = models.CharField(max_length=12, choices=STATUS_CHOICES,
                              default=STATUS_UNRESOLVED)
    raw = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-punched_at"]
        indexes = [models.Index(fields=["school", "device_user_id", "punched_at"])]


class StudentAttendance(SchoolScopedModel):
    STATUS_CHOICES = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("late", "Late"),
        ("leave", "On Leave"),
    ]

    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="attendances"
    )
    section = models.ForeignKey(
        "academics.Section", on_delete=models.CASCADE, related_name="attendances"
    )
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="present")
    marked_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="+"
    )

    class Meta:
        unique_together = [("student", "date")]
        ordering = ["-date"]


class StaffAttendance(SchoolScopedModel):
    teacher = models.ForeignKey(
        "teachers.TeacherProfile", on_delete=models.CASCADE, related_name="attendances"
    )
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    is_present = models.BooleanField(default=True)

    class Meta:
        unique_together = [("teacher", "date")]


class LeaveApplication(SchoolScopedModel):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="leave_applications"
    )
    from_date = models.DateField()
    to_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    reviewed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

class StaffLeaveApplication(SchoolScopedModel):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    teacher = models.ForeignKey(
        "teachers.TeacherProfile", on_delete=models.CASCADE, related_name="leave_applications"
    )
    from_date = models.DateField()
    to_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    reviewed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
