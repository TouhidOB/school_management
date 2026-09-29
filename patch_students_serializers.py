import re

with open('backend/apps/students/api/serializers.py', 'r') as f:
    content = f.read()

content = content.replace(
    "AdmissionApplication,",
    "AdmissionApplication,\n    ApplicationGuardian,"
)

new_serializer = """
class ApplicationGuardianSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationGuardian
        fields = ["id", "relation", "name", "phone", "occupation", "email"]

"""

content = content.replace("class AdmissionApplicationSerializer(", new_serializer + "class AdmissionApplicationSerializer(")

# Update AdmissionApplicationSerializer
content = content.replace(
    'status_display = serializers.CharField(source="get_status_display", read_only=True)',
    'status_display = serializers.CharField(source="get_status_display", read_only=True)\n    guardians = ApplicationGuardianSerializer(many=True, required=False)'
)

fields_to_remove = [
    '"guardian_name", ', '"guardian_phone", ', '"guardian_email", ',
    '"father_name", ', '"father_occupation", ', '"father_phone", ',
    '"mother_name", ', '"mother_occupation", ', '"mother_phone", '
]

for field in fields_to_remove:
    content = content.replace(field, '')

content = content.replace('"rejection_reason", ', '"guardians", "rejection_reason", ')

# Also update PublicAdmissionApplicationSerializer
content = content.replace(
    'class PublicAdmissionApplicationSerializer(serializers.ModelSerializer):',
    'class PublicAdmissionApplicationSerializer(serializers.ModelSerializer):\n    guardians = ApplicationGuardianSerializer(many=True, required=False)'
)

# And inject create methods for both 
create_methods = """
    def create(self, validated_data):
        guardians_data = validated_data.pop('guardians', [])
        application = super().create(validated_data)
        for g_data in guardians_data:
            ApplicationGuardian.objects.create(application=application, **g_data)
        return application

    def update(self, instance, validated_data):
        guardians_data = validated_data.pop('guardians', None)
        application = super().update(instance, validated_data)
        if guardians_data is not None:
            instance.guardians.all().delete()
            for g_data in guardians_data:
                ApplicationGuardian.objects.create(application=application, **g_data)
        return application
"""
content = content.replace('        read_only_fields = ["status", "tracking_code"]', '        read_only_fields = ["status", "tracking_code"]\n' + create_methods)

# Also add to public
content = content.replace(
    '        fields = [\n            "full_name", "dob", "gender", "class_applied", "phone", "email",\n            "address", "previous_school",\n        ]',
    '        fields = [\n            "full_name", "dob", "gender", "class_applied", "phone", "email",\n            "address", "previous_school", "guardians"\n        ]\n' + create_methods
)


with open('backend/apps/students/api/serializers.py', 'w') as f:
    f.write(content)
