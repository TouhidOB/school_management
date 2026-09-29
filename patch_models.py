import re

with open("backend/apps/students/models.py", "r") as f:
    text = f.read()

# For Student (line 75 approx)
text = text.replace(
    'address = models.TextField(blank=True)',
    'address = models.TextField(blank=True, verbose_name="Present Address")\n    permanent_address = models.TextField(blank=True)'
)

# For AdmissionApplication (line 143 approx)
text = text.replace(
    'address = models.TextField(blank=True, default="")',
    'address = models.TextField(blank=True, default="", verbose_name="Present Address")\n    permanent_address = models.TextField(blank=True, default="")'
)

with open("backend/apps/students/models.py", "w") as f:
    f.write(text)
