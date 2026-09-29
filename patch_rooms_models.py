import re

with open('backend/apps/rooms/models.py', 'r') as f:
    content = f.read()

content = re.sub(r'    submitted_files = models\.JSONField\(default=list, blank=True\)\n', '', content)

if 'class AssignmentSubmissionFile(' not in content:
    new_model = """
class AssignmentSubmissionFile(models.Model):
    submission = models.ForeignKey(AssignmentSubmission, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to="submissions/")
    file_name = models.CharField(max_length=255)

    def __str__(self):
        return self.file_name
"""
    content += new_model

with open('backend/apps/rooms/models.py', 'w') as f:
    f.write(content)
