import re

with open("backend/apps/teachers/api/views.py", "r") as f:
    text = f.read()

# Replace imports
text = text.replace("from apps.teachers.models import Designation, TeacherProfile", "from apps.teachers.models import Designation, TeacherProfile, Department")

dept_viewset = """class DepartmentViewSet(SchoolScopedViewSet):
    queryset = Department.objects.all()
    serializer_class = s.DepartmentSerializer
    search_fields = ["name"]

class DesignationViewSet"""
text = text.replace("class DesignationViewSet", dept_viewset)

old_teacher_view = """class TeacherProfileViewSet(SchoolScopedViewSet):
    queryset = TeacherProfile.objects.select_related("designation").all()
    serializer_class = s.TeacherProfileSerializer
    filterset_fields = ["designation", "status", "contract_type"]
    search_fields = ["full_name", "email", "employee_id"]"""

new_teacher_view = """class TeacherProfileViewSet(SchoolScopedViewSet):
    queryset = TeacherProfile.objects.select_related("designation", "department").all()
    serializer_class = s.TeacherProfileSerializer
    filterset_fields = ["designation", "department", "status", "contract_type"]
    search_fields = ["full_name", "first_name", "last_name", "email", "employee_id"]

    def _handle_user_creation(self, instance, create_account, password):
        if not create_account or not instance.email:
            return
        if getattr(instance, 'user', None):
            return
        
        email = instance.email.lower()
        if User.objects.filter(email=email).exists():
            return
            
        user = User.objects.create_user(
            email=email,
            password=password or get_random_string(10),
            role="teacher"
        )
        instance.user = user
        instance.save(update_fields=['user'])

    def perform_create(self, serializer):
        create_account = serializer.validated_data.pop("create_user_account", False)
        password = serializer.validated_data.pop("password", None)
        instance = serializer.save()
        self._handle_user_creation(instance, create_account, password)

    def perform_update(self, serializer):
        create_account = serializer.validated_data.pop("create_user_account", False)
        password = serializer.validated_data.pop("password", None)
        instance = serializer.save()
        self._handle_user_creation(instance, create_account, password)"""

text = text.replace(old_teacher_view, new_teacher_view)

with open("backend/apps/teachers/api/views.py", "w") as f:
    f.write(text)

print("Views patched successfully.")
