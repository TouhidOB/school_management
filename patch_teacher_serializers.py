import re

with open("backend/apps/teachers/api/serializers.py", "r") as f:
    text = f.read()

dept_serializer = """class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name"]

class DesignationSerializer"""
text = text.replace("class DesignationSerializer", dept_serializer)

# Add Department to imports
text = text.replace("from apps.teachers.models import Designation, TeacherProfile", "from apps.teachers.models import Designation, TeacherProfile, Department")

old_teacher_serializer = """class TeacherProfileSerializer(serializers.ModelSerializer):
    designation_name = serializers.CharField(
        source="designation.name", read_only=True, default=None)
    display_name = serializers.CharField(source="__str__", read_only=True)

    class Meta:
        model = TeacherProfile
        fields = [
            "id", "full_name", "display_name", "email", "phone", "employee_id",
            "designation", "designation_name", "joining_date", "contract_type",
            "subjects", "sections", "photo", "salary_basic", "status",
        ]"""

new_teacher_serializer = """class TeacherProfileSerializer(serializers.ModelSerializer):
    designation_name = serializers.CharField(source="designation.name", read_only=True, default=None)
    department_name = serializers.CharField(source="department.name", read_only=True, default=None)
    display_name = serializers.CharField(source="__str__", read_only=True)
    
    # Optional fields for user account creation
    create_user_account = serializers.BooleanField(write_only=True, required=False, default=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = TeacherProfile
        fields = [
            "id", "first_name", "last_name", "full_name", "display_name",
            "dob", "gender", "blood_group", "photo",
            "email", "phone", "alternate_phone", "current_address", "permanent_address",
            "highest_qualification", "years_of_experience", "resume", "subjects",
            "employee_id", "joining_date", "department", "department_name", "designation", "designation_name", 
            "salary_basic", "contract_type", "sections",
            "status",
            "emergency_contact_name", "emergency_contact_relation", "emergency_contact_phone",
            "create_user_account", "password", "user_email", "user_id"
        ]
        read_only_fields = ["full_name"]"""

text = text.replace(old_teacher_serializer, new_teacher_serializer)

with open("backend/apps/teachers/api/serializers.py", "w") as f:
    f.write(text)

print("Serializers patched successfully.")
