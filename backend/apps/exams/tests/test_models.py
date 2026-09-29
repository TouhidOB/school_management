import pytest
from apps.tenants.models import School
from apps.exams.models import ExamSession
from apps.academics.models import AcademicYear

@pytest.fixture
def school():
    return School.objects.create(name="Exam School", slug="exam")

@pytest.mark.django_db
class TestExamsModels:
    def test_exam_session(self, school):
        year = AcademicYear.objects.create(school=school, name="2026")
        exam = ExamSession.objects.create(school=school, academic_year=year, name="Midterm 2026")
        assert exam.name == "Midterm 2026"
