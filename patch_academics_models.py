with open("backend/apps/academics/models.py", "a") as f:
    f.write("""

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
""")

print("Added StudyMaterial and OnlineClass to academics/models.py")
