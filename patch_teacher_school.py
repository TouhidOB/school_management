import re

with open("backend/apps/teachers/api/views.py", "r") as f:
    text = f.read()

old_perform_create = """        employee_id = serializer.validated_data.get('employee_id', '')
        if not employee_id or employee_id.lower() == 'auto':
            school = getattr(self, "_active_school", None)
            if school:
                import datetime
                year = datetime.date.today().year
                count = TeacherProfile.objects.filter(school=school).count() + 1
                serializer.validated_data['employee_id'] = f"TCH-{year}-{count:03d}"
                
        instance = serializer.save()
        self._handle_user_creation(instance, create_account, password)"""

new_perform_create = """        school = getattr(self, "_active_school", None)
        if school is None:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No active school.")
            
        employee_id = serializer.validated_data.get('employee_id', '')
        if not employee_id or employee_id.lower() == 'auto':
            import datetime
            year = datetime.date.today().year
            count = TeacherProfile.objects.filter(school=school).count() + 1
            serializer.validated_data['employee_id'] = f"TCH-{year}-{count:03d}"
                
        instance = serializer.save(school=school)
        self._handle_user_creation(instance, create_account, password)"""

text = text.replace(old_perform_create, new_perform_create)

# perform_update doesn't necessarily need school passed (it's already on the instance)
# but we can do it anyway or leave it. We'll leave perform_update alone as long as it saves.

with open("backend/apps/teachers/api/views.py", "w") as f:
    f.write(text)

print("Teacher API patched with school.")
