import os
import django
import random
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.academics.models import SchoolClass, Section
from apps.students.models import Student, Guardian
from apps.tenants.models import School

first_names_m = ["Ali", "Omar", "Hassan", "Abdullah", "Yusuf", "Tariq", "Bilal", "Ibrahim", "Hamza", "Usman", "Zayed", "Rashid", "Faisal", "Saad", "Musa", "Ismail", "Zain", "Farhan"]
first_names_f = ["Aisha", "Fatima", "Zainab", "Maryam", "Khadija", "Amira", "Safiya", "Hafsa", "Ruqayyah", "Amina", "Nour", "Yasmin", "Salma", "Leila", "Dua"]
last_names = ["Khan", "Ahmed", "Ali", "Rahman", "Malik", "Hussain", "Mahmood", "Chowdhury", "Islam", "Uddin", "Hassan", "Qureshi", "Begum", "Akhtar"]

schools = School.objects.all()
total_added = 0

for school in schools:
    sections = Section.objects.filter(school=school)
    
    for section in sections:
        current_class = section.school_class
        
        existing_students = Student.objects.filter(current_class=current_class, school=school)
        try:
            max_roll = max([int(s.roll_number) for s in existing_students if s.roll_number and s.roll_number.isdigit()] + [0])
        except:
            max_roll = 0
        current_roll = max_roll + 1
        
        # Determine how many to add to reach at least 20 new ones, or just add 20 unconditionally?
        # User requested: "randomly add 20 student on each class and section"
        for i in range(20):
            gender = random.choice(["male", "female"])
            if gender == "male":
                first = random.choice(first_names_m)
            else:
                first = random.choice(first_names_f)
                
            last = random.choice(last_names)
            full_name = f"{first} {last}"
            blood_group = random.choice(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"])
            
            dob = date.today() - timedelta(days=random.randint(365*4, 365*16))
            
            admission_number = f"ADM-2026-{random.randint(100000, 999999)}"
            while Student.objects.filter(school=school, admission_number=admission_number).exists():
                admission_number = f"ADM-2026-{random.randint(100000, 999999)}"
                
            student = Student.objects.create(
                school=school,
                full_name=full_name,
                admission_number=admission_number,
                roll_number=str(current_roll),
                gender=gender,
                dob=dob,
                blood_group=blood_group,
                current_class=current_class,
                current_section=section,
                admission_date=date.today(),
                status="active",
                present_thana="Sample Thana",
                present_zilla="Sample Zilla",
                present_postal_code="1234",
                address="Sample Address"
            )
            
            Guardian.objects.create(
                school=school,
                student=student,
                name=f"{last} (Father)",
                relation="father",
                phone=f"017{random.randint(10000000, 99999999)}",
                is_primary_contact=True
            )
            
            current_roll += 1
            total_added += 1

print(f"Successfully added {total_added} students across all schools and sections.")
