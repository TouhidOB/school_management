import pytest
from datetime import date
from django.utils import timezone
from apps.tenants.models import School
from apps.students.models import Student
from apps.academics.models import AcademicYear, SchoolClass, Section
from apps.attendance.models import StudentAttendance

@pytest.fixture
def school():
    return School.objects.create(name="Att School", slug="att")

@pytest.fixture
def student(school):
    return Student.objects.create(school=school, admission_number="A1", full_name="John")

@pytest.mark.django_db
class TestAttendanceModels:
    def test_student_attendance(self, school, student):
        year = AcademicYear.objects.create(school=school, name="2026")
        cls = SchoolClass.objects.create(school=school, name="Class 1")
        sec = Section.objects.create(school=school, school_class=cls, academic_year=year, name="A")
        
        att = StudentAttendance.objects.create(
            school=school, student=student, section=sec, date=date.today(), status="present"
        )
        assert att.status == "present"
