import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.tenants.models import School
from apps.academics.models import SchoolClass, Subject

school = School.all_objects.filter(name__icontains="Famous Academy").first()
if not school:
    school = School.objects.first()

classes = SchoolClass.all_objects.filter(school=school)
if not classes.exists():
    print("No classes found for the school.")

standard_subjects = [
    "English", "Mathematics", "Science", "History", 
    "Geography", "Computer Science", "Art", 
    "Physical Education", "Music", "Social Studies"
]

for cls in classes:
    existing = Subject.all_objects.filter(school=school, school_class=cls).values_list("name", flat=True)
    
    added_count = 0
    for subj_name in standard_subjects:
        if added_count >= 5:
            break
        
        if subj_name not in existing:
            base_code = f"{cls.name[:3].upper().replace(' ', '')}-{subj_name[:3].upper()}"
            code = base_code
            counter = 1
            while Subject.all_objects.filter(school=school, code=code).exists():
                code = f"{base_code}{counter}"
                counter += 1
            
            Subject.all_objects.create(
                school=school,
                school_class=cls,
                name=subj_name,
                code=code
            )
            added_count += 1
            print(f"Added {subj_name} to {cls.name} with code {code}")

print("Completed adding 5 subjects to each class.")
