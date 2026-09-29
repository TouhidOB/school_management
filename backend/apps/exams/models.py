from django.db import models

from apps.core.models import SchoolScopedModel


class ExamSession(SchoolScopedModel):
    """e.g. 'Half-Yearly Exam 2026'."""

    name = models.CharField(max_length=150)
    academic_year = models.ForeignKey(
        "academics.AcademicYear", on_delete=models.CASCADE, related_name="exam_sessions"
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    is_final = models.BooleanField(
        default=False,
        help_text="Final exam of the year — unlocks class promotion.")

    def __str__(self):
        return self.name


class ExamSubject(SchoolScopedModel):
    """One paper in an exam session — also a row of the exam routine."""

    exam_session = models.ForeignKey(
        ExamSession, on_delete=models.CASCADE, related_name="exam_subjects"
    )
    subject = models.ForeignKey(
        "academics.Subject", on_delete=models.CASCADE, related_name="exam_subjects"
    )
    school_class = models.ForeignKey(
        "academics.SchoolClass", on_delete=models.CASCADE, related_name="exam_subjects"
    )
    exam_date = models.DateField(null=True, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    exam_room = models.CharField(
        max_length=50, blank=True, help_text="Exam hall / room number")
    invigilator = models.ForeignKey(
        "teachers.TeacherProfile", on_delete=models.SET_NULL, null=True,
        blank=True, related_name="invigilations",
        help_text="Guard teacher on duty for this paper")
    total_marks = models.PositiveIntegerField(default=100)
    pass_marks = models.PositiveIntegerField(default=33)

    class Meta:
        unique_together = [("exam_session", "subject", "school_class")]
        ordering = ["exam_date", "start_time"]


class StudentPromotion(SchoolScopedModel):
    """Audit row: one student promoted (or retained) after a final exam."""

    exam_session = models.ForeignKey(
        ExamSession, on_delete=models.CASCADE, related_name="promotions")
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="promotions")
    from_class = models.ForeignKey(
        "academics.SchoolClass", on_delete=models.SET_NULL, null=True,
        related_name="+")
    to_class = models.ForeignKey(
        "academics.SchoolClass", on_delete=models.SET_NULL, null=True,
        related_name="+")
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    rank = models.PositiveIntegerField(default=0)
    promoted = models.BooleanField(default=True)
    promoted_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="+")

    class Meta:
        unique_together = [("exam_session", "student")]
        ordering = ["rank"]


class ExamResult(SchoolScopedModel):
    exam_subject = models.ForeignKey(
        ExamSubject, on_delete=models.CASCADE, related_name="results"
    )
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="exam_results"
    )
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2)
    grade = models.CharField(max_length=5, blank=True)
    grade_point = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    is_absent = models.BooleanField(default=False)
    entered_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="+"
    )

    class Meta:
        unique_together = [("exam_subject", "student")]
