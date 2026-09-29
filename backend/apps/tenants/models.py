from django.db import models

from apps.core.models import TimeStampedModel


class ContactMessage(TimeStampedModel):
    """A sales lead from the public Contact form.

    Prospective schools reach out here; the Super Admin reviews these on their
    dashboard and manually provisions a school (billing is handled offline at
    a flat per-student rate).
    """

    name = models.CharField(max_length=150)
    school_name = models.CharField(max_length=200, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    topic = models.CharField(max_length=100, blank=True)
    message = models.TextField()
    is_handled = models.BooleanField(default=False)
    converted_school = models.ForeignKey(
        "tenants.School", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="source_leads",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.school_name or self.email}"


class SubscriptionPlan(TimeStampedModel):
    """Platform-level plan the school subscribes to (PRD Module 7)."""

    TIER_TRIAL = "trial"
    TIER_BASIC = "basic"
    TIER_STANDARD = "standard"
    TIER_PREMIUM = "premium"
    TIER_PROFESSIONAL = "professional"
    TIER_ENTERPRISE = "enterprise"
    TIER_CHOICES = [
        (TIER_TRIAL, "Free Trial"),
        (TIER_BASIC, "Basic"),
        (TIER_STANDARD, "Standard"),
        (TIER_PREMIUM, "Premium"),
        (TIER_PROFESSIONAL, "Professional"),
        (TIER_ENTERPRISE, "Enterprise"),
    ]

    name = models.CharField(max_length=100)
    plan_code = models.CharField(max_length=50, default="DEFAULT")
    description = models.TextField(blank=True)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES)
    
    currency = models.CharField(max_length=10, default="USD")
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_per_student = models.BooleanField(default=False, help_text="If true, price_monthly is multiplied by active student count")

    trial_days = models.PositiveIntegerField(default=14)

    student_limit = models.PositiveIntegerField(null=True, blank=True, help_text="Null = unlimited")
    teacher_limit = models.PositiveIntegerField(null=True, blank=True)
    parent_limit = models.PositiveIntegerField(null=True, blank=True)
    staff_limit = models.PositiveIntegerField(null=True, blank=True)
    branch_limit = models.PositiveIntegerField(null=True, blank=True)
    storage_limit_gb = models.PositiveIntegerField(default=10)
    sms_limit = models.PositiveIntegerField(default=1000)
    email_limit = models.PositiveIntegerField(default=10000)
    api_request_limit = models.PositiveIntegerField(default=100000)

    features = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["price_monthly"]

    def __str__(self):
        return self.name


class School(TimeStampedModel):
    """The tenant. Every scoped row points here (PRD Module 1 / Section 7)."""

    SCHOOL_TYPES = [
        ("primary", "Primary"),
        ("secondary", "Secondary"),
        ("higher_secondary", "Higher Secondary"),
        ("college", "College"),
        ("coaching", "Coaching Center"),
        ("madrasa", "Madrasa"),
        ("university", "University"),
    ]
    STATUS_PENDING = "pending"
    STATUS_TRIAL = "trial"
    STATUS_ACTIVE = "active"
    STATUS_TRIAL_EXPIRED = "trial_expired"
    STATUS_PAYMENT_FAILED = "payment_failed"
    STATUS_SUSPENDED = "suspended"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending Verification"),
        (STATUS_TRIAL, "Trial Active"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_TRIAL_EXPIRED, "Trial Expired"),
        (STATUS_PAYMENT_FAILED, "Payment Failed"),
        (STATUS_SUSPENDED, "Suspended"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    # Biometric / fingerprint attendance device brands. Each maps to an adapter
    # in apps.attendance.devices that parses that vendor's push payload.
    DEVICE_NONE = "none"
    DEVICE_BRANDS = [
        (DEVICE_NONE, "No device (manual attendance)"),
        ("zkteco", "ZKTeco"),
        ("essl", "ESSL"),
        ("suprema", "Suprema BioStar"),
        ("hikvision", "Hikvision"),
        ("mantra", "Mantra"),
        ("generic", "Generic JSON webhook"),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=30, unique=True, help_text="Subdomain label")
    custom_domain = models.CharField(
        max_length=255, blank=True, null=True, unique=True
    )
    school_type = models.CharField(max_length=30, choices=SCHOOL_TYPES)

    admin_email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    alternative_phone = models.CharField(max_length=30, blank=True)
    website = models.URLField(blank=True)
    
    address = models.TextField(blank=True)
    country = models.CharField(max_length=80, blank=True)
    division = models.CharField(max_length=80, blank=True)
    district = models.CharField(max_length=80, blank=True)
    city = models.CharField(max_length=80, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    
    timezone = models.CharField(max_length=50, default="UTC")
    currency = models.CharField(max_length=10, default="USD")
    language = models.CharField(max_length=10, default="en")

    logo = models.ImageField(upload_to="school_logos/", blank=True, null=True)
    favicon = models.ImageField(upload_to="school_favicons/", blank=True, null=True)
    primary_color = models.CharField(max_length=7, default="#2563eb")
    academic_year_start_month = models.PositiveSmallIntegerField(default=1)
    registration_number = models.CharField(max_length=100, blank=True)

    # Dynamic ID Generation Settings
    id_prefix = models.CharField(max_length=10, default="ADM", blank=True, help_text="e.g. ADM")
    id_include_year = models.BooleanField(default=True, help_text="e.g. ADM-2026-...")
    id_digits = models.PositiveSmallIntegerField(default=4, help_text="Number of digits for auto-increment")



    default_grading_system = models.CharField(max_length=50, blank=True)
    default_attendance_system = models.CharField(max_length=50, blank=True)
    school_working_days = models.CharField(max_length=255, default="Monday,Tuesday,Wednesday,Thursday,Friday", blank=True)
    school_start_time = models.TimeField(null=True, blank=True)
    school_end_time = models.TimeField(null=True, blank=True)

    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="schools",
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    subscription_started_at = models.DateTimeField(null=True, blank=True)
    onboarding_completed = models.BooleanField(default=False)
    # When on, the school appears in the public admissions directory and accepts
    # online admission applications.
    admissions_open = models.BooleanField(default=False)
    ADMISSION_ONLINE = "online"
    ADMISSION_PDF = "pdf"
    ADMISSION_MODES = [
        (ADMISSION_ONLINE, "Online form"),
        (ADMISSION_PDF, "Downloadable PDF form"),
    ]
    admission_mode = models.CharField(
        max_length=10, choices=ADMISSION_MODES, default=ADMISSION_ONLINE)
    admission_google_form_url = models.URLField(
        blank=True,
        help_text="Google Form used as the online admission form. When set, "
                  "applicants are sent here instead of the built-in form.")
    admission_form_pdf = models.FileField(
        upload_to="admission_forms/", blank=True, null=True,
        help_text="Printable admission form offered for download (offline "
                  "admission). Leave empty to auto-generate one.")
    admission_instructions = models.TextField(
        blank=True, help_text="Shown to applicants on the admission page.")

    # Biometric attendance device config.
    device_brand = models.CharField(
        max_length=20, choices=DEVICE_BRANDS, default=DEVICE_NONE)
    device_token = models.CharField(
        max_length=64, blank=True, db_index=True,
        help_text="Secret the device/middleware sends to authenticate punches.")
    # Credentials the platform uses to talk to the brand's cloud/device API
    # (e.g. Suprema BioStar, Hikvision HikCentral). Optional for push-only setups.
    device_api_key = models.CharField(max_length=255, blank=True)
    device_api_secret = models.CharField(max_length=255, blank=True)
    device_api_url = models.URLField(blank=True,
                                     help_text="Device/cloud API base URL, if any.")
    # Punches at/after this local time count as 'late' for students.
    attendance_late_after = models.TimeField(null=True, blank=True)

    # Configured module toggles for this school (Superadmin controlled)
    modules = models.JSONField(
        default=dict, blank=True,
        help_text="Module availability toggles, e.g. {'hr': True, 'hostel': False}"
    )

    DEFAULT_MODULES = {
        "hr": True,
        "library": True,
        "transport": True,
        "hostel": True,
        "inventory": True,
        "communication": True,
        "events": True,
        "certificates": True,
        "reports": True,
        "finance": True,
        "exams": True,
        "homework": True,
        "learning": True,
        "attendance": True,
        "timetable": True,
        "academics": True,
        "teachers": True,
        "students": True,
    }

    def get_modules(self):
        """Returns complete dict of all modules with defaults applied."""
        result = dict(self.DEFAULT_MODULES)
        if isinstance(self.modules, dict):
            result.update(self.modules)
        return result

    # School is the tenant itself (not tenant-scoped). `all_objects` mirrors
    # `objects` so platform-level code can use one consistent accessor.
    objects = models.Manager()
    all_objects = models.Manager()

    def save(self, *args, **kwargs):
        # Auto-issue an ingestion token when a device brand is configured.
        if self.device_brand != self.DEVICE_NONE and not self.device_token:
            from django.utils.crypto import get_random_string
            self.device_token = get_random_string(40)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.slug})"

    @property
    def has_access(self):
        return self.status in (self.STATUS_TRIAL, self.STATUS_ACTIVE)
