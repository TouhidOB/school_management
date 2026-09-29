import re

with open('backend/apps/rooms/api/serializers.py', 'r') as f:
    content = f.read()

content = content.replace(
    "AssignmentSubmission,",
    "AssignmentSubmission,\n    AssignmentSubmissionFile,"
)

new_serializer = """
class AssignmentSubmissionFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentSubmissionFile
        fields = ["id", "file", "file_name"]

"""

content = content.replace("class AssignmentSubmissionSerializer(", new_serializer + "class AssignmentSubmissionSerializer(")

content = content.replace(
    'student_name = serializers.CharField(source="student.full_name", read_only=True)',
    'student_name = serializers.CharField(source="student.full_name", read_only=True)\n    files = AssignmentSubmissionFileSerializer(many=True, read_only=True)'
)

content = content.replace('"submitted_files", ', '"files", ')

with open('backend/apps/rooms/api/serializers.py', 'w') as f:
    f.write(content)
