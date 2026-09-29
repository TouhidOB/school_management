import re

with open("backend/apps/teachers/api/views.py", "r") as f:
    text = f.read()

# Add action import if missing
if "from rest_framework.decorators import action" not in text:
    text = text.replace("from rest_framework import generics, permissions, viewsets", "from rest_framework import generics, permissions, viewsets\nfrom rest_framework.decorators import action")

old_class = """class TeacherProfileViewSet(SchoolScopedViewSet):
    queryset = TeacherProfile.objects.select_related("designation", "department").all()
    serializer_class = s.TeacherProfileSerializer
    filterset_fields = ["designation", "department", "status", "contract_type"]
    search_fields = ["full_name", "first_name", "last_name", "email", "employee_id"]"""

new_class = """class TeacherProfileViewSet(SchoolScopedViewSet):
    queryset = TeacherProfile.objects.select_related("designation", "department").all()
    serializer_class = s.TeacherProfileSerializer
    filterset_fields = ["designation", "department", "status", "contract_type"]
    search_fields = ["full_name", "first_name", "last_name", "email", "employee_id"]

    @action(detail=False, methods=['get'])
    def next_id(self, request):
        school = getattr(self, "_active_school", None)
        if not school:
            return Response({"employee_id": "Auto-generated"})
            
        import datetime
        year = datetime.date.today().year
        count = TeacherProfile.objects.filter(school=school).count() + 1
        return Response({"employee_id": f"TCH-{year}-{count:03d}"})"""

text = text.replace(old_class, new_class)

old_perform_create = """    def perform_create(self, serializer):
        create_account = serializer.validated_data.pop("create_user_account", False)
        password = serializer.validated_data.pop("password", None)
        instance = serializer.save()
        self._handle_user_creation(instance, create_account, password)"""

new_perform_create = """    def perform_create(self, serializer):
        create_account = serializer.validated_data.pop("create_user_account", False)
        password = serializer.validated_data.pop("password", None)
        
        employee_id = serializer.validated_data.get('employee_id', '')
        if not employee_id or employee_id.lower() == 'auto':
            school = getattr(self, "_active_school", None)
            if school:
                import datetime
                year = datetime.date.today().year
                count = TeacherProfile.objects.filter(school=school).count() + 1
                serializer.validated_data['employee_id'] = f"TCH-{year}-{count:03d}"
                
        instance = serializer.save()
        self._handle_user_creation(instance, create_account, password)"""

text = text.replace(old_perform_create, new_perform_create)

with open("backend/apps/teachers/api/views.py", "w") as f:
    f.write(text)

print("Backend API patched.")
