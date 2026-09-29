from django.db import models

from apps.core.models import SchoolScopedModel


class ClassRoom(SchoolScopedModel):
    """Collaborative space: Subject + Section + Year (PRD Requirement 3)."""

    name = models.CharField(max_length=200)
    room_code = models.CharField(max_length=12, help_text="Students join with this")
    subject = models.ForeignKey(
        "academics.Subject", on_delete=models.CASCADE, related_name="rooms"
    )
    section = models.ForeignKey(
        "academics.Section", on_delete=models.CASCADE, related_name="rooms"
    )
    academic_year = models.ForeignKey(
        "academics.AcademicYear", on_delete=models.CASCADE, related_name="rooms"
    )
    teachers = models.ManyToManyField(
        "teachers.TeacherProfile", related_name="rooms", blank=True
    )
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    cover_image = models.ImageField(upload_to="room_covers/", blank=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = [("school", "room_code")]

    def __str__(self):
        return self.name


class RoomMembership(SchoolScopedModel):
    """Student enrollment in a room (auto from section, editable on transfer)."""

    room = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name="memberships")
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="room_memberships"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = [("room", "student")]


class RoomPost(SchoolScopedModel):
    TYPE_ANNOUNCEMENT = "announcement"
    TYPE_NOTE = "note"
    TYPE_RESULT = "result"
    TYPE_CHOICES = [
        (TYPE_ANNOUNCEMENT, "Announcement"),
        (TYPE_NOTE, "Note"),
        (TYPE_RESULT, "Result"),
    ]

    room = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name="posts")
    author = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    content = models.TextField()
    attachment = models.FileField(upload_to="room_posts/", blank=True, null=True)
    post_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_ANNOUNCEMENT)
    is_pinned = models.BooleanField(default=False)
    published_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_pinned", "-published_at"]


class RoomPostComment(SchoolScopedModel):
    post = models.ForeignKey(RoomPost, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    content = models.TextField()

    class Meta:
        ordering = ["created_at"]


class RoomPostReaction(SchoolScopedModel):
    LIKE = "like"
    QUESTION = "question"
    KIND_CHOICES = [(LIKE, "👍 Like"), (QUESTION, "❓ Question")]

    post = models.ForeignKey(RoomPost, on_delete=models.CASCADE, related_name="reactions")
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="+")
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default=LIKE)

    class Meta:
        unique_together = [("post", "user")]


class Note(SchoolScopedModel):
    room = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name="notes")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to="room_notes/", blank=True, null=True)
    link = models.URLField(blank=True, help_text="Video/YouTube link")
    topic = models.CharField(max_length=100, blank=True)
    chapter = models.CharField(max_length=100, blank=True)
    is_important = models.BooleanField(default=False)
    uploaded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="+"
    )

    class Meta:
        ordering = ["-is_important", "-created_at"]


class Assignment(SchoolScopedModel):
    room = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name="assignments")
    title = models.CharField(max_length=200)
    instructions = models.TextField(blank=True)
    attachment = models.FileField(upload_to="assignments/", blank=True, null=True)
    due_datetime = models.DateTimeField()
    total_marks = models.PositiveIntegerField(default=100)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["-due_datetime"]

    def __str__(self):
        return self.title


class AssignmentSubmission(SchoolScopedModel):
    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name="submissions"
    )
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="submissions"
    )
    text_answer = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    is_late = models.BooleanField(default=False)
    marks_obtained = models.PositiveIntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    graded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        unique_together = [("assignment", "student")]

class AssignmentSubmissionFile(models.Model):
    submission = models.ForeignKey(AssignmentSubmission, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to="submissions/")
    file_name = models.CharField(max_length=255)

    def __str__(self):
        return self.file_name
