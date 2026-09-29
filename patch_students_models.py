import re

with open('backend/apps/students/models.py', 'r') as f:
    content = f.read()

# Remove flat parent fields
content = re.sub(r'    guardian_name = models\.CharField\(.*?default=""\)\n', '', content)
content = re.sub(r'    guardian_phone = models\.CharField\(.*?default=""\)\n', '', content)
content = re.sub(r'    guardian_email = models\.EmailField\(.*?default=""\)\n', '', content)
content = re.sub(r'    father_name = models\.CharField\(.*?default=""\)\n', '', content)
content = re.sub(r'    father_occupation = models\.CharField\(.*?default=""\)\n', '', content)
content = re.sub(r'    father_phone = models\.CharField\(.*?default=""\)\n', '', content)
content = re.sub(r'    mother_name = models\.CharField\(.*?default=""\)\n', '', content)
content = re.sub(r'    mother_occupation = models\.CharField\(.*?default=""\)\n', '', content)
content = re.sub(r'    mother_phone = models\.CharField\(.*?default=""\)\n', '', content)
content = re.sub(r'    # Parents\' details \(required on the public form\)\n', '', content)
content = re.sub(r'    applicant_data = models\.JSONField\(default=dict, blank=True\)\n', '', content)

if 'class ApplicationGuardian(' not in content:
    new_model = """
class ApplicationGuardian(models.Model):
    application = models.ForeignKey(AdmissionApplication, on_delete=models.CASCADE, related_name="guardians")
    relation = models.CharField(max_length=50, choices=[('father', 'Father'), ('mother', 'Mother'), ('other', 'Other')])
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.get_relation_display()})"
"""
    content += new_model

with open('backend/apps/students/models.py', 'w') as f:
    f.write(content)
