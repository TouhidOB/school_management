import re

with open("backend/apps/students/models.py", "r") as f:
    text = f.read()

# For Student
student_search = 'permanent_address = models.TextField(blank=True)'
student_replace = """permanent_address = models.TextField(blank=True)
    present_thana = models.CharField(max_length=100, blank=True)
    present_zilla = models.CharField(max_length=100, blank=True)
    present_postal_code = models.CharField(max_length=20, blank=True)
    permanent_thana = models.CharField(max_length=100, blank=True)
    permanent_zilla = models.CharField(max_length=100, blank=True)
    permanent_postal_code = models.CharField(max_length=20, blank=True)"""
text = text.replace(student_search, student_replace)

# For AdmissionApplication
app_search = 'permanent_address = models.TextField(blank=True, default="")'
app_replace = """permanent_address = models.TextField(blank=True, default="")
    present_thana = models.CharField(max_length=100, blank=True, default="")
    present_zilla = models.CharField(max_length=100, blank=True, default="")
    present_postal_code = models.CharField(max_length=20, blank=True, default="")
    permanent_thana = models.CharField(max_length=100, blank=True, default="")
    permanent_zilla = models.CharField(max_length=100, blank=True, default="")
    permanent_postal_code = models.CharField(max_length=20, blank=True, default="")"""
text = text.replace(app_search, app_replace)

with open("backend/apps/students/models.py", "w") as f:
    f.write(text)
