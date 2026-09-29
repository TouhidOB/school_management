import os
import random
import django
from datetime import date, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.tenants.models import School
from apps.academics.models import SchoolClass, Section, AcademicYear, Subject
from apps.students.models import Student, Guardian
from apps.exams.models import ExamSession, ExamSubject, ExamResult
from apps.teachers.models import TeacherProfile

m_names = [
    "Tahmid", "Arif", "Shakil", "Siam", "Tanvir", "Nafis", "Rifat", "Zubair", "Mahir", "Adnan",
    "Rafi", "Sami", "Alvi", "Nahian", "Rohan", "Tamim", "Fahim", "Rayhan", "Shahriar", "Ahnaf",
    "Hasan", "Farhan", "Muntasir", "Imran", "Kabir", "Nabil", "Wasif", "Jawad", "Abrar", "Saad"
]
f_names = [
    "Sadia", "Nusrat", "Farhana", "Tasnim", "Sumaiya", "Anika", "Fariha", "Jannat", "Lamia", "Nadia",
    "Mehnaz", "Sultana", "Maliha", "Sabiha", "Nabila", "Samia", "Roshni", "Tanzila", "Humaira", "Zarin",
    "Ayesha", "Fatima", "Khadija", "Bushra", "Tahsin", "Marufa", "Sharmin", "Sabrina", "Rumana", "Lubna"
]
l_names = [
    "Rahman", "Islam", "Hossain", "Ahmed", "Khan", "Chowdhury", "Uddin", "Hassan", "Ali", "Mahmood",
    "Akhtar", "Begum", "Qureshi", "Malik", "Sikder", "Miah", "Bhuiyan", "Dewan", "Talukder", "Howlader"
]

def seed():
    # 1. School 4 (Famous Academy)
    school4 = School.all_objects.filter(id=4).first()
    if not school4:
        print("Famous Academy (id=4) not found.")
        return

    year4 = AcademicYear.objects.filter(school=school4, name="2026").first()
    if not year4:
        year4 = AcademicYear.objects.filter(school=school4, is_current=True).first()

    print(f"Target School: {school4.name}, Academic Year: {year4.name}")

    # Check each class and section in School 4
    total_new_students = 0
    new_students_list = []

    for cls in SchoolClass.objects.filter(school=school4).order_by("numeric_level"):
        sections = Section.objects.filter(school_class=cls).order_by("name")
        if not sections.exists():
            sec_a = Section.objects.create(school=school4, school_class=cls, academic_year=year4, name="A")
            sec_b = Section.objects.create(school=school4, school_class=cls, academic_year=year4, name="B")
            sections = [sec_a, sec_b]

        for sec in sections:
            existing = Student.objects.filter(school=school4, current_class=cls, current_section=sec)
            cnt = existing.count()
            needed = max(0, 20 - cnt)
            print(f"Class: {cls.name}, Section: {sec.name} -> Existing: {cnt}, Needed: {needed}")

            if needed == 0:
                continue

            # Existing rolls in this section
            existing_rolls = set()
            for s in existing:
                if s.roll_number and s.roll_number.isdigit():
                    existing_rolls.add(int(s.roll_number))

            roll_seq = 1
            for _ in range(needed):
                while roll_seq in existing_rolls:
                    roll_seq += 1

                gender = random.choice(["male", "female"])
                first = random.choice(m_names) if gender == "male" else random.choice(f_names)
                last = random.choice(l_names)
                full_name = f"{first} {last}"
                blood = random.choice(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"])

                # DOB according to class level
                base_age = 5 + cls.numeric_level
                dob = date(2026 - base_age, random.randint(1, 12), random.randint(1, 28))

                adm_num = f"ADM-2026-{random.randint(100000, 999999)}"
                while Student.objects.filter(school=school4, admission_number=adm_num).exists():
                    adm_num = f"ADM-2026-{random.randint(100000, 999999)}"

                student = Student.objects.create(
                    school=school4,
                    admission_number=adm_num,
                    roll_number=str(roll_seq),
                    full_name=full_name,
                    gender=gender,
                    dob=dob,
                    blood_group=blood,
                    current_class=cls,
                    current_section=sec,
                    academic_year=year4,
                    admission_date=date(2026, 1, 10),
                    status="active",
                    present_thana="Gulshan",
                    present_zilla="Dhaka",
                    present_postal_code="1212",
                    address="House #12, Road #5, Block C"
                )

                Guardian.objects.create(
                    school=school4,
                    student=student,
                    name=f"{last} (Father)",
                    relation="father",
                    phone=f"017{random.randint(10000000, 99999999)}",
                    is_primary_contact=True
                )

                existing_rolls.add(roll_seq)
                roll_seq += 1
                total_new_students += 1
                new_students_list.append(student)

    print(f"Created {total_new_students} new students for Famous Academy.")

    # 2. Seed exam results for any new students that don't have exam results yet
    exam_sessions = ExamSession.objects.filter(school=school4, academic_year=year4)
    results_created = 0
    for sess in exam_sessions:
        for student in new_students_list:
            # Exam subjects for this student's class and this session
            exam_subjects = ExamSubject.objects.filter(
                school=school4,
                exam_session=sess,
                school_class=student.current_class
            )
            for es in exam_subjects:
                # 5% chance of absent
                is_absent = (random.random() < 0.05)
                if is_absent:
                    marks = 0.0
                    grade = "F"
                    point = 0.0
                else:
                    # Realistic marks distribution: mostly pass (40-95), 15% fail (<33)
                    if random.random() < 0.15:
                        marks = float(random.randint(15, 32))
                    else:
                        marks = float(random.randint(35, 95))

                    pct = marks
                    grade = "A+" if pct >= 80 else "A" if pct >= 70 else "A-" if pct >= 60 else "B" if pct >= 50 else "C" if pct >= 40 else "D" if pct >= 33 else "F"
                    point = 5.0 if pct >= 80 else 4.0 if pct >= 70 else 3.5 if pct >= 60 else 3.0 if pct >= 50 else 2.0 if pct >= 40 else 1.0 if pct >= 33 else 0.0

                ExamResult.objects.get_or_create(
                    school=school4,
                    exam_subject=es,
                    student=student,
                    defaults={
                        "marks_obtained": marks,
                        "grade": grade,
                        "grade_point": point,
                        "is_absent": is_absent
                    }
                )
                results_created += 1

    print(f"Created {results_created} exam results for newly added students.")

    # 3. School 1 (Green Valley School) check Class 10
    school1 = School.all_objects.filter(id=1).first()
    if school1:
        year1 = AcademicYear.objects.filter(school=school1, is_current=True).first() or AcademicYear.objects.filter(school=school1).first()
        for cls in SchoolClass.objects.filter(school=school1):
            sections = Section.objects.filter(school_class=cls)
            if not sections.exists() and year1:
                sec_a = Section.objects.create(school=school1, school_class=cls, academic_year=year1, name="A")
                sections = [sec_a]
            for sec in sections:
                cnt = Student.objects.filter(school=school1, current_class=cls, current_section=sec).count()
                if cnt == 0 and year1:
                    for roll in range(1, 21):
                        gender = random.choice(["male", "female"])
                        first = random.choice(m_names) if gender == "male" else random.choice(f_names)
                        last = random.choice(l_names)
                        adm_num = f"ADM-GV-{cls.id}-{roll:03d}"
                        Student.objects.create(
                            school=school1,
                            admission_number=adm_num,
                            roll_number=str(roll),
                            full_name=f"{first} {last}",
                            gender=gender,
                            dob=date(2010, 1, 1),
                            current_class=cls,
                            current_section=sec,
                            academic_year=year1,
                            admission_date=date(2026, 1, 1),
                            status="active"
                        )
                    print(f"Added 20 students to School 1 Class {cls.name} Section {sec.name}.")

if __name__ == "__main__":
    seed()
