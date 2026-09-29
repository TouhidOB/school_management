from django.db import models

from apps.core.models import SchoolScopedModel


class Notification(SchoolScopedModel):
    """Log for SMS / push / email / in-app notices (PRD Module 11)."""

    CHANNEL_CHOICES = [
        ("sms", "SMS"),
        ("push", "Push"),
        ("email", "Email"),
        ("in_app", "In-App"),
    ]
    STATUS_CHOICES = [
        ("queued", "Queued"),
        ("sent", "Sent"),
        ("failed", "Failed"),
        ("read", "Read"),
    ]

    recipient = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="notifications", null=True, blank=True
    )
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default="in_app")
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="queued")
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

class Announcement(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    target_roles = models.CharField(max_length=255, help_text="Comma separated roles or 'ALL'")
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class MessageTemplate(models.Model):
    class Meta:
        ordering = ["-id"]

    name = models.CharField(max_length=100)
    channel = models.CharField(max_length=20, choices=[('email', 'Email'), ('sms', 'SMS'), ('push', 'Push')])
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} ({self.channel})"
