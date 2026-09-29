import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.students.models import Student
from apps.tenants.models import School
from apps.academics.models import Section

schools = School.objects.all()

for school in schools:
    sections = Section.objects.filter(school=school)
    for section in sections:
        current_class = section.school_class
        
        students = Student.objects.filter(
            school=school, 
            current_class=current_class, 
            current_section=section
        ).order_by('created_at')
        
        r = 1
        for s in students:
            s.roll_number = str(r)
            s.save(update_fields=['roll_number'])
            r += 1

print("Fixed roll numbers for all students.")
