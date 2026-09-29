import os
import random
import django
from datetime import date, time

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.tenants.models import School
from apps.academics.models import AcademicYear, SchoolClass, Subject
from apps.exams.models import ExamSession, ExamSubject, ExamResult
from apps.teachers.models import TeacherProfile
from apps.students.models import Student

def seed():
    school = School.all_objects.filter(id=4).first()
    if not school:
        print("School not found")
        return
        
    session = ExamSession.objects.filter(id=3, school=school).first()
    if not session:
        session = ExamSession.objects.filter(school=school, name="Half-Yearly 2026").first()
    if not session:
        print("Half-yearly session not found")
        return

    classes = SchoolClass.objects.filter(school=school)
    teachers = TeacherProfile.objects.filter(school=school)
    
    count = 0
    result_count = 0
    for cls in classes:
        subjects = Subject.objects.filter(school_class=cls)
        students = Student.objects.filter(current_class=cls)
        for idx, subj in enumerate(subjects):
            invig = teachers[idx % len(teachers)] if teachers.exists() else None
            es, created = ExamSubject.objects.get_or_create(
                school=school,
                exam_session=session,
                subject=subj,
                school_class=cls,
                defaults={
                    "exam_date": date(2026, 6, 1 + (idx % 14)),
                    "start_time": time(10, 0),
                    "end_time": time(13, 0),
                    "exam_room": f"Room {101 + (idx % 10)}",
                    "invigilator": invig,
                    "total_marks": 100,
                    "pass_marks": 33
                }
            )
            if created:
                count += 1
            
            # Generate marks for each student if not already present
            for student in students:
                marks = random.randint(35, 98)
                pct = marks
                grade = "A+" if pct >= 80 else "A" if pct >= 70 else "A-" if pct >= 60 else "B" if pct >= 50 else "C" if pct >= 40 else "D" if pct >= 33 else "F"
                point = 5.0 if pct >= 80 else 4.0 if pct >= 70 else 3.5 if pct >= 60 else 3.0 if pct >= 50 else 2.0 if pct >= 40 else 1.0 if pct >= 33 else 0.0
                
                _, r_created = ExamResult.objects.get_or_create(
                    school=school,
                    exam_subject=es,
                    student=student,
                    defaults={
                        "marks_obtained": marks,
                        "grade": grade,
                        "grade_point": point,
                        "is_absent": False
                    }
                )
                if r_created:
                    result_count += 1

    print(f"Added {count} new Exam Subjects and {result_count} new Exam Results for {session.name}.")

if __name__ == "__main__":
    seed()
