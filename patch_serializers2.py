with open("backend/apps/students/api/serializers.py", "r") as f:
    text = f.read()

# For StudentSerializer
old_fields = '"address", "permanent_address", "emergency_contact",'
new_fields = '"address", "permanent_address", "present_thana", "present_zilla", "present_postal_code", "permanent_thana", "permanent_zilla", "permanent_postal_code", "emergency_contact",'
text = text.replace(old_fields, new_fields)

# For AdmissionApplicationSerializer
old_app_fields = '"address", "permanent_address",\n            "previous_school"'
new_app_fields = '"address", "permanent_address", "present_thana", "present_zilla", "present_postal_code", "permanent_thana", "permanent_zilla", "permanent_postal_code",\n            "previous_school"'
text = text.replace(old_app_fields, new_app_fields)

with open("backend/apps/students/api/serializers.py", "w") as f:
    f.write(text)
