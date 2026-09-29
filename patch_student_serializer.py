import re

with open('backend/apps/students/api/serializers.py', 'r') as f:
    content = f.read()

# Add extra_kwargs to make admission_number and roll_number optional
new_meta = """    class Meta:
        model = Student
        fields = [
            "id", "admission_number", "roll_number", "full_name", "dob",
            "gender", "blood_group", "photo", "current_class", "class_name",
            "current_section", "section_name", "academic_year",
            "admission_date", "admission_type", "address", "emergency_contact",
            "previous_school", "medical_notes", "status", "guardians",
        ]
        extra_kwargs = {
            'admission_number': {'required': False, 'allow_blank': True},
            'roll_number': {'required': False, 'allow_blank': True}
        }
"""
content = re.sub(r'    class Meta:\n        model = Student\n        fields = \[[^\]]+\]\n', new_meta, content)

with open('backend/apps/students/api/serializers.py', 'w') as f:
    f.write(content)
