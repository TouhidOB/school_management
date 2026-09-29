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
        return
        
    year = AcademicYear.objects.filter(school=school).first()
    session2 = ExamSession.objects.filter(school=school, name="Final Exams 2026").first()
    if not session2:
        return

    classes = SchoolClass.objects.filter(school=school)
    teachers = TeacherProfile.objects.filter(school=school)
    
    count = 0
    result_count = 0
    for cls in classes: # Add for all classes
        subjects = Subject.objects.filter(school_class=cls)
        students = Student.objects.filter(current_class=cls)
        for idx, subj in enumerate(subjects):
            invig = teachers[idx % len(teachers)] if teachers.exists() else None
            es, created = ExamSubject.objects.get_or_create(
                school=school,
                exam_session=session2,
                subject=subj,
                school_class=cls,
                defaults={
                    "exam_date": date(2026, 12, 1 + idx*2),
                    "start_time": time(10, 0),
                    "end_time": time(13, 0),
                    "exam_room": f"Hall {idx+1}",
                    "invigilator": invig,
                    "total_marks": 100,
                    "pass_marks": 33
                }
            )
            count += 1
            
            # Generate random marks for each student for this subject
            for student in students:
                marks = random.randint(20, 100)
                pct = marks
                grade = "A+" if pct >= 80 else "A" if pct >= 70 else "A-" if pct >= 60 else "B" if pct >= 50 else "C" if pct >= 40 else "D" if pct >= 33 else "F"
                point = 5.0 if pct >= 80 else 4.0 if pct >= 70 else 3.5 if pct >= 60 else 3.0 if pct >= 50 else 2.0 if pct >= 40 else 1.0 if pct >= 33 else 0.0
                
                ExamResult.objects.get_or_create(
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
                result_count += 1

    print(f"Created {count} Exam Subjects and {result_count} Exam Results for Final Exams 2026.")

if __name__ == "__main__":
    seed()
