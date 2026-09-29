with open("backend/apps/students/api/serializers.py", "r") as f:
    text = f.read()

text = text.replace(
    'section_name = serializers.CharField(source="current_section.name", read_only=True, default=None)',
    'section_name = serializers.CharField(source="current_section.name", read_only=True, default=None)\n    user_email = serializers.EmailField(source="user.email", read_only=True, default=None)\n    user_id = serializers.IntegerField(source="user.id", read_only=True, default=None)'
)
text = text.replace(
    '"status", "guardians",',
    '"status", "guardians", "user_email", "user_id",'
)

with open("backend/apps/students/api/serializers.py", "w") as f:
    f.write(text)
