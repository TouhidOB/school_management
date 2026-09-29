from django.db import models

from apps.core.models import SchoolScopedModel


class AcademicYear(SchoolScopedModel):
    name = models.CharField(max_length=50, help_text="e.g. 2026 or 2026-2027")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)

    class Meta:
        unique_together = [("school", "name")]
        ordering = ["-start_date"]

    def __str__(self):
        return self.name


class Subject(SchoolScopedModel):
    """A subject taught in one class. Codes are unique across the school."""

    school_class = models.ForeignKey(
        "academics.SchoolClass", on_delete=models.CASCADE,
        related_name="subjects", null=True, blank=True,
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)

    class Meta:
        unique_together = [("school", "code"), ("school", "school_class", "name")]
        ordering = ["school_class__numeric_level", "name"]

    def __str__(self):
        cls = f" · {self.school_class.name}" if self.school_class_id else ""
        return f"{self.name} ({self.code}){cls}"


class SchoolClass(SchoolScopedModel):
    """A grade level, e.g. 'Class 9'. Sections live under it."""

    name = models.CharField(max_length=50)
    numeric_level = models.PositiveSmallIntegerField(
        default=0, help_text="Used for promotion ordering"
    )

    class Meta:
        verbose_name_plural = "school classes"
        unique_together = [("school", "name"), ("school", "numeric_level")]
        ordering = ["numeric_level"]

    def __str__(self):
        return self.name


class Section(SchoolScopedModel):
    school_class = models.ForeignKey(
        SchoolClass, on_delete=models.CASCADE, related_name="sections"
    )
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name="sections"
    )
    name = models.CharField(max_length=20, help_text="e.g. A, B, C")
    class_teacher = models.ForeignKey(
        "teachers.TeacherProfile",
        on_delete=models.SET_NULL,
        related_name="class_teacher_of",
        null=True,
        blank=True,
    )

    class Meta:
        unique_together = [("school_class", "academic_year", "name")]

    def __str__(self):
        return f"{self.school_class.name} - {self.name}"


class RoutineSlot(SchoolScopedModel):
    """One cell of a weekly class routine: a section meets for a subject at a
    given period on a given weekday, taught by a teacher in a room.

    A break/lunch row carries `is_break=True` with no subject/teacher.
    Read by teachers (their own slots) and students (their section's grid);
    built by the school admin.
    """

    DAYS = [
        (0, "Monday"), (1, "Tuesday"), (2, "Wednesday"), (3, "Thursday"),
        (4, "Friday"), (5, "Saturday"), (6, "Sunday"),
    ]

    section = models.ForeignKey(
        Section, on_delete=models.CASCADE, related_name="routine_slots"
    )
    day_of_week = models.PositiveSmallIntegerField(choices=DAYS)
    period = models.PositiveSmallIntegerField(
        default=1, help_text="Period order within the day (1 = first period)"
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    subject = models.ForeignKey(
        Subject, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="routine_slots",
    )
    teacher = models.ForeignKey(
        "teachers.TeacherProfile", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="routine_slots",
    )
    room = models.CharField(max_length=50, blank=True, help_text="Room / location")
    is_break = models.BooleanField(default=False, help_text="Break or lunch row")

    class Meta:
        ordering = ["day_of_week", "period", "start_time"]
        # One slot per section/day/period; the same teacher can't be
        # double-booked at the same weekday+period across sections.
        unique_together = [
            ("section", "day_of_week", "period"),
        ]
        indexes = [
            models.Index(fields=["school", "section", "day_of_week"]),
            models.Index(fields=["school", "teacher", "day_of_week"]),
        ]

    def __str__(self):
        label = "Break" if self.is_break else (self.subject and self.subject.name or "—")
        return f"{self.get_day_of_week_display()} P{self.period} · {label}"

class Event(SchoolScopedModel):
    """School events, holidays, meetings, etc."""
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    event_type = models.CharField(max_length=50, default="event")

    class Meta:
        ordering = ["start_date"]

    def __str__(self):
        return self.title


class StudyMaterial(SchoolScopedModel):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="study_materials")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="study_materials")
    url = models.URLField(blank=True, help_text="Link to Google Drive, PDF, or video.")
    uploaded_by = models.ForeignKey("teachers.TeacherProfile", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.school_class.name} - {self.subject.name})"

class OnlineClass(SchoolScopedModel):
    topic = models.CharField(max_length=200)
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="online_classes")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="online_classes")
    date = models.DateField()
    start_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField(default=45)
    meeting_url = models.URLField()
    host = models.ForeignKey("teachers.TeacherProfile", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ["-date", "-start_time"]
        verbose_name_plural = "online classes"

    def __str__(self):
        return f"{self.topic} ({self.date})"
