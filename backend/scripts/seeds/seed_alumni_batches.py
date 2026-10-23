import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_dir))

import django
from datetime import date

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.tenants.models import School
from apps.academics.models import AcademicYear, SchoolClass
from apps.students.models import Student, PassingBatch, AlumniProfile

def seed():
    # Target all schools or school 4 (Famous Academy demo school)
    schools = School.all_objects.all()
    if not schools.exists():
        print("No schools found.")
        return

    for school in schools:
        print(f"\nSeeding Alumni Batches for school: {school.name} (ID: {school.id})...")
        acad_year = AcademicYear.objects.filter(school=school).first()
        grad_class = SchoolClass.objects.filter(school=school).order_by("-numeric_level").first()

        # 1. Batch 2023
        batch_2023, _ = PassingBatch.objects.get_or_create(
            school=school,
            name=f"Batch 2023 - SSC",
            defaults={
                "passing_year": 2023,
                "academic_year": acad_year,
                "graduating_class": grad_class,
                "graduation_date": date(2023, 12, 28),
                "description": "Outstanding academic performance with 100% board passing rate and 15 scholarships.",
            }
        )

        # 2. Batch 2024
        batch_2024, _ = PassingBatch.objects.get_or_create(
            school=school,
            name=f"Batch 2024 - SSC (Golden Cohort)",
            defaults={
                "passing_year": 2024,
                "academic_year": acad_year,
                "graduating_class": grad_class,
                "graduation_date": date(2024, 12, 30),
                "description": "Graduating cohort with stellar science and humanities results. Active in inter-school Olympiads.",
            }
        )

        # Demo Students for Batch 2023
        students_2023_data = [
            {
                "name": "Tanvir Ahmed", "adm": f"ALM-2023-{school.id}-001", "roll": "1",
                "result": "GPA 5.00 (Golden A+)", "status": "higher_study",
                "inst": "Dhaka College", "occ": "HSC Science (Pre-Engineering)",
                "phone": "+880 1711-234567", "city": "Dhaka", "ach": "National Science Fair 1st Prize"
            },
            {
                "name": "Nafisa Tabassum", "adm": f"ALM-2023-{school.id}-002", "roll": "2",
                "result": "GPA 5.00", "status": "higher_study",
                "inst": "Viqarunnisa Noon College", "occ": "HSC Science (Pre-Medical)",
                "phone": "+880 1819-345678", "city": "Dhaka", "ach": "Math Olympiad Regional Champion"
            },
            {
                "name": "Mahmudul Hasan", "adm": f"ALM-2023-{school.id}-003", "roll": "3",
                "result": "GPA 4.85", "status": "higher_study",
                "inst": "Notre Dame College", "occ": "HSC Business Studies",
                "phone": "+880 1912-456789", "city": "Dhaka", "ach": "Debate Club President"
            },
            {
                "name": "Farhana Yasmin", "adm": f"ALM-2023-{school.id}-004", "roll": "4",
                "result": "GPA 5.00", "status": "higher_study",
                "inst": "Holy Cross College", "occ": "HSC Humanities",
                "phone": "+880 1613-567890", "city": "Dhaka", "ach": "Literature Festival Gold Medal"
            },
            {
                "name": "Zubair Rahman", "adm": f"ALM-2023-{school.id}-005", "roll": "5",
                "result": "GPA 4.60", "status": "employed",
                "inst": "Creative IT Institute", "occ": "Junior UI/UX Designer",
                "phone": "+880 1714-678901", "city": "Chittagong", "ach": "Freelance Web Development"
            },
        ]

        # Demo Students for Batch 2024
        students_2024_data = [
            {
                "name": "Arif Chowdhury", "adm": f"ALM-2024-{school.id}-001", "roll": "1",
                "result": "GPA 5.00 (Golden A+)", "status": "higher_study",
                "inst": "Notre Dame College", "occ": "HSC Science",
                "phone": "+880 1722-111222", "city": "Dhaka", "ach": "Informatics Olympiad Finalist"
            },
            {
                "name": "Sumaiya Akter", "adm": f"ALM-2024-{school.id}-002", "roll": "2",
                "result": "GPA 5.00", "status": "higher_study",
                "inst": "Rajuk Uttara Model College", "occ": "HSC Science",
                "phone": "+880 1823-333444", "city": "Dhaka", "ach": "School Head Girl 2024"
            },
            {
                "name": "Saifuddin Kazi", "adm": f"ALM-2024-{school.id}-003", "roll": "3",
                "result": "GPA 4.90", "status": "higher_study",
                "inst": "Dhaka City College", "occ": "HSC Commerce",
                "phone": "+880 1924-555666", "city": "Dhaka", "ach": "Inter-School Cricket Captain"
            },
            {
                "name": "Rukhsana Begum", "adm": f"ALM-2024-{school.id}-004", "roll": "4",
                "result": "GPA 5.00", "status": "higher_study",
                "inst": "Adamjee Cantonment College", "occ": "HSC Science",
                "phone": "+880 1525-777888", "city": "Dhaka", "ach": "Scouts President's Award"
            },
            {
                "name": "Shahriar Kabir", "adm": f"ALM-2024-{school.id}-005", "roll": "5",
                "result": "GPA 4.75", "status": "preparing",
                "inst": "UCC Admission Coaching", "occ": "Medical Admission Prep",
                "phone": "+880 1626-999000", "city": "Sylhet", "ach": "Physics Excellence Award"
            },
            {
                "name": "Nusrat Jahan", "adm": f"ALM-2024-{school.id}-006", "roll": "6",
                "result": "GPA 5.00", "status": "higher_study",
                "inst": "Dhaka Residential Model College", "occ": "HSC Science",
                "phone": "+880 1727-222333", "city": "Dhaka", "ach": "Junior Chess Champion"
            },
        ]

        for s_data in students_2023_data:
            st, _ = Student.objects.get_or_create(
                school=school,
                admission_number=s_data["adm"],
                defaults={
                    "full_name": s_data["name"],
                    "roll_number": s_data["roll"],
                    "gender": "male" if "Ahmed" in s_data["name"] or "Hasan" in s_data["name"] or "Rahman" in s_data["name"] else "female",
                    "status": "alumni",
                    "current_class": grad_class,
                    "academic_year": acad_year,
                    "admission_date": date(2021, 1, 10),
                    "emergency_contact": s_data["phone"],
                    "present_zilla": s_data["city"],
                }
            )
            # Ensure status is alumni
            if st.status != "alumni":
                st.status = "alumni"
                st.save(update_fields=["status"])

            AlumniProfile.objects.update_or_create(
                school=school,
                student=st,
                defaults={
                    "batch": batch_2023,
                    "passing_roll": s_data["roll"],
                    "passing_result": s_data["result"],
                    "current_status": s_data["status"],
                    "current_institution": s_data["inst"],
                    "current_occupation": s_data["occ"],
                    "contact_phone": s_data["phone"],
                    "current_city": s_data["city"],
                    "achievements": s_data["ach"],
                }
            )

        for s_data in students_2024_data:
            st, _ = Student.objects.get_or_create(
                school=school,
                admission_number=s_data["adm"],
                defaults={
                    "full_name": s_data["name"],
                    "roll_number": s_data["roll"],
                    "gender": "female" if "Akter" in s_data["name"] or "Begum" in s_data["name"] or "Jahan" in s_data["name"] else "male",
                    "status": "alumni",
                    "current_class": grad_class,
                    "academic_year": acad_year,
                    "admission_date": date(2022, 1, 10),
                    "emergency_contact": s_data["phone"],
                    "present_zilla": s_data["city"],
                }
            )
            if st.status != "alumni":
                st.status = "alumni"
                st.save(update_fields=["status"])

            AlumniProfile.objects.update_or_create(
                school=school,
                student=st,
                defaults={
                    "batch": batch_2024,
                    "passing_roll": s_data["roll"],
                    "passing_result": s_data["result"],
                    "current_status": s_data["status"],
                    "current_institution": s_data["inst"],
                    "current_occupation": s_data["occ"],
                    "contact_phone": s_data["phone"],
                    "current_city": s_data["city"],
                    "achievements": s_data["ach"],
                }
            )

        print(f"✓ Seeded 2 Batches and {len(students_2023_data) + len(students_2024_data)} Alumni Profiles for {school.name}.")

if __name__ == "__main__":
    seed()
