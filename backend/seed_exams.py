import os
import django
from datetime import date, time

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.tenants.models import School
from apps.academics.models import AcademicYear, SchoolClass, Subject
from apps.exams.models import ExamSession, ExamSubject
from apps.teachers.models import TeacherProfile

def seed():
    # Famous Academy
    school = School.all_objects.filter(id=4).first()
    if not school:
        print("School ID 4 not found.")
        return

    year = AcademicYear.objects.filter(school=school, is_current=True).first()
    if not year:
        year = AcademicYear.objects.filter(school=school).first()
        
    if not year:
        print("No academic year found for school 4.")
        return

    # Clear old exams if we run multiple times? No, just create them if they don't exist.
    session1, _ = ExamSession.objects.get_or_create(
        school=school,
        name="Half-Yearly 2026",
        academic_year=year,
        defaults={
            "start_date": date(2026, 6, 1),
            "end_date": date(2026, 6, 15),
            "is_published": True,
            "is_final": False,
        }
    )

    session2, _ = ExamSession.objects.get_or_create(
        school=school,
        name="Final Exams 2026",
        academic_year=year,
        defaults={
            "start_date": date(2026, 12, 1),
            "end_date": date(2026, 12, 15),
            "is_published": False,
            "is_final": True,
        }
    )

    classes = SchoolClass.objects.filter(school=school)
    teachers = TeacherProfile.objects.filter(school=school)
    
    # Add some exam subjects for Half-Yearly
    count = 0
    for cls in classes[:3]: # just first 3 classes to not spam too much
        subjects = Subject.objects.filter(school_class=cls)
        for idx, subj in enumerate(subjects[:2]): # 2 subjects per class
            invig = teachers[idx % len(teachers)] if teachers.exists() else None
            ExamSubject.objects.get_or_create(
                school=school,
                exam_session=session1,
                subject=subj,
                school_class=cls,
                defaults={
                    "exam_date": date(2026, 6, 1 + idx*2),
                    "start_time": time(10, 0),
                    "end_time": time(13, 0),
                    "exam_room": f"Hall {idx+1}",
                    "invigilator": invig,
                    "total_marks": 100,
                    "pass_marks": 33
                }
            )
            count += 1
            
    print(f"Created 2 Exam Sessions and {count} Exam Subjects for Famous Academy.")

if __name__ == "__main__":
    seed()
