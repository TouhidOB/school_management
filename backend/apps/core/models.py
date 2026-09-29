"""Abstract base models shared across every app."""
from django.db import models

from .managers import SchoolScopedManager


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SchoolScopedModel(TimeStampedModel):
    """Base for every tenant-owned row. Carries the `school` FK + scoped manager.

    `objects` is tenant-aware (auto-filtered by request tenant).
    `all_objects` is the raw manager for platform-level / Super Admin code.
    """

    school = models.ForeignKey(
        "tenants.School",
        on_delete=models.CASCADE,
        related_name="%(class)ss",
    )

    objects = SchoolScopedManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True


class SingletonModel(TimeStampedModel):
    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj


class GeneralSettings(SingletonModel):
    platform_name = models.CharField(max_length=255, default="Super Admin Platform")
    platform_logo = models.ImageField(upload_to="settings/", null=True, blank=True)
    favicon = models.ImageField(upload_to="settings/", null=True, blank=True)
    support_email = models.EmailField(default="support@example.com")
    support_phone = models.CharField(max_length=30, blank=True)
    website_url = models.URLField(blank=True)
    maintenance_mode = models.BooleanField(default=False)


class EmailSettings(SingletonModel):
    smtp_host = models.CharField(max_length=255, blank=True)
    smtp_port = models.IntegerField(default=587)
    smtp_username = models.CharField(max_length=255, blank=True)
    smtp_password = models.CharField(max_length=255, blank=True)
    encryption = models.CharField(max_length=50, choices=[('TLS', 'TLS'), ('SSL', 'SSL'), ('NONE', 'None')], default='TLS')
    from_name = models.CharField(max_length=255, blank=True)
    from_email = models.EmailField(blank=True)
    reply_to_email = models.EmailField(blank=True)


class SMSSettings(SingletonModel):
    provider = models.CharField(max_length=100, blank=True)
    api_url = models.URLField(blank=True)
    api_key = models.CharField(max_length=255, blank=True)
    api_secret = models.CharField(max_length=255, blank=True)
    sender_id = models.CharField(max_length=50, blank=True)
    default_country_code = models.CharField(max_length=10, blank=True)


class StorageSettings(SingletonModel):
    storage_provider = models.CharField(max_length=100, default="Local")
    bucket_name = models.CharField(max_length=255, blank=True)
    region = models.CharField(max_length=100, blank=True)
    access_key = models.CharField(max_length=255, blank=True)
    secret_key = models.CharField(max_length=255, blank=True)
    max_file_size_mb = models.IntegerField(default=10)
    allowed_extensions = models.CharField(max_length=255, default="jpg,png,pdf,doc,docx")
    cdn_url = models.URLField(blank=True)


class LocalizationSettings(SingletonModel):
    default_language = models.CharField(max_length=10, default="en")
    supported_languages = models.CharField(max_length=255, default="en,es,fr")
    default_currency = models.CharField(max_length=10, default="USD")
    supported_currencies = models.CharField(max_length=255, default="USD,EUR,GBP")
    timezone = models.CharField(max_length=50, default="UTC")
    date_format = models.CharField(max_length=50, default="Y-m-d")
    number_format = models.CharField(max_length=50, default="standard")
