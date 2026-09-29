from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Platform user. `school` scopes non-superadmin users to one tenant.

    Role drives RBAC (PRD Section 6). Super Admin has role=super_admin and
    school=None; everyone else belongs to exactly one school.
    """

    ROLE_SUPER_ADMIN = "super_admin"
    ROLE_SCHOOL_ADMIN = "school_admin"
    ROLE_TEACHER = "teacher"
    ROLE_STUDENT = "student"
    ROLE_STAFF = "staff"
    ROLE_CHOICES = [
        (ROLE_SUPER_ADMIN, "Super Admin"),
        (ROLE_SCHOOL_ADMIN, "School Admin"),
        (ROLE_TEACHER, "Teacher"),
        (ROLE_STUDENT, "Student"),
        (ROLE_STAFF, "Staff"),
    ]

    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default=ROLE_SCHOOL_ADMIN
    )
    school = models.ForeignKey(
        "tenants.School",
        on_delete=models.CASCADE,
        related_name="users",
        null=True,
        blank=True,
    )
    phone = models.CharField(max_length=30, blank=True)
    profile_photo = models.ImageField(upload_to="profiles/", null=True, blank=True)
    requires_2fa = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.get_username()} ({self.get_role_display()})"

    @property
    def is_super_admin(self):
        return self.role == self.ROLE_SUPER_ADMIN


class LoginActivity(models.Model):
    """Tracks user login/logout events and device information."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_activities")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device = models.CharField(max_length=255, blank=True)
    browser = models.CharField(max_length=255, blank=True)
    operating_system = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=[('SUCCESS', 'Success'), ('FAILED', 'Failed')], default='SUCCESS')

    class Meta:
        ordering = ['-login_time']

    def __str__(self):
        return f"{self.user} - {self.login_time} ({self.status})"
