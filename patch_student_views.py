import re

with open('backend/apps/students/api/views.py', 'r') as f:
    content = f.read()

# Make sure we have datetime imported
if 'import datetime' not in content:
    content = 'import datetime\n' + content

new_perform_create = """
    def perform_create(self, serializer):
        school = getattr(self, "_active_school", None)
        if school is None:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No active school.")
            
        data = serializer.validated_data
        
        admission_number = data.get('admission_number', '')
        roll_number = data.get('roll_number', '')
        
        if not admission_number or admission_number.lower() == 'auto':
            year = datetime.date.today().year
            count = Student.objects.filter(school=school, admission_date__year=year).count() + 1
            admission_number = f"ADM-{year}-{count:04d}"
            
        if not roll_number or roll_number.lower() == 'auto':
            current_class = data.get('current_class')
            if current_class:
                students_in_class = Student.objects.filter(school=school, current_class=current_class)
                max_r = 0
                for st in students_in_class:
                    try:
                        r = int(st.roll_number)
                        if r > max_r: max_r = r
                    except Exception:
                        pass
                roll_number = str(max_r + 1)
            else:
                roll_number = "1"
                
        serializer.save(school=school, admission_number=admission_number, roll_number=roll_number)
"""

if 'def perform_create(self, serializer):' not in content:
    content = content.replace('    search_fields = ["full_name", "admission_number", "roll_number"]\n', '    search_fields = ["full_name", "admission_number", "roll_number"]\n' + new_perform_create)

with open('backend/apps/students/api/views.py', 'w') as f:
    f.write(content)
