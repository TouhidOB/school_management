from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import SchoolScopedModel

SCORE = dict(validators=[MinValueValidator(1), MaxValueValidator(5)])


class RatingPeriod(SchoolScopedModel):
    name = models.CharField(max_length=100, help_text="e.g. Term 1 - 2026")
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    eligible_classes = models.ManyToManyField("academics.SchoolClass", blank=True)

    def __str__(self):
        return self.name


class TeacherRating(SchoolScopedModel):
    """One student's rating of one teacher in a period. Anonymous to teacher."""

    teacher = models.ForeignKey(
        "teachers.TeacherProfile", on_delete=models.CASCADE, related_name="ratings"
    )
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="given_ratings"
    )
    rating_period = models.ForeignKey(
        RatingPeriod, on_delete=models.CASCADE, related_name="ratings"
    )
    room = models.ForeignKey(
        "rooms.ClassRoom", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    score_teaching_quality = models.PositiveSmallIntegerField(**SCORE)
    score_punctuality = models.PositiveSmallIntegerField(**SCORE)
    score_helpfulness = models.PositiveSmallIntegerField(**SCORE)
    score_assignment_feedback = models.PositiveSmallIntegerField(**SCORE)
    score_communication = models.PositiveSmallIntegerField(**SCORE)
    score_overall = models.PositiveSmallIntegerField(**SCORE)
    text_comment = models.TextField(blank=True, help_text="Admin-visible only")
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # One rating per student per teacher per period (anti-spam).
        unique_together = [("teacher", "student", "rating_period")]


class TeacherRatingAggregate(SchoolScopedModel):
    """Denormalized per-teacher per-period averages for fast dashboards."""

    teacher = models.ForeignKey(
        "teachers.TeacherProfile", on_delete=models.CASCADE, related_name="rating_aggregates"
    )
    rating_period = models.ForeignKey(
        RatingPeriod, on_delete=models.CASCADE, related_name="aggregates"
    )
    avg_teaching_quality = models.FloatField(default=0)
    avg_punctuality = models.FloatField(default=0)
    avg_helpfulness = models.FloatField(default=0)
    avg_assignment_feedback = models.FloatField(default=0)
    avg_communication = models.FloatField(default=0)
    avg_overall = models.FloatField(default=0)
    total_ratings_count = models.PositiveIntegerField(default=0)
    last_calculated_at = models.DateTimeField(auto_now=True)

    MIN_RATINGS_TO_PUBLISH = 5

    class Meta:
        unique_together = [("teacher", "rating_period")]

    @property
    def is_publicly_visible(self):
        return self.total_ratings_count >= self.MIN_RATINGS_TO_PUBLISH
