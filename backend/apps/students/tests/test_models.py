import pytest
from datetime import date
from django.db import IntegrityError
from apps.tenants.models import School
from apps.students.models import Student, AdmissionApplication, Guardian

@pytest.fixture
def school():
    return School.objects.create(name="Students School", slug="students-school")

@pytest.mark.django_db
class TestStudentsModels:
    def test_student_creation(self, school):
        student = Student.objects.create(
            school=school, admission_number="A001", full_name="John Doe", status="active"
        )
        assert student.full_name == "John Doe"
        assert str(student) == "John Doe (A001)"

    def test_unique_admission_number_per_school(self, school):
        from django.db import transaction
        Student.objects.create(school=school, admission_number="A001", full_name="John Doe")
        with transaction.atomic():
            with pytest.raises(IntegrityError):
                Student.objects.create(school=school, admission_number="A001", full_name="Jane Doe")
        
        # Another school can use the same admission number
        other_school = School.objects.create(name="Other", slug="other")
        other_student = Student.objects.create(school=other_school, admission_number="A001", full_name="Jane Doe")
        assert other_student.id is not None

    def test_guardian_creation(self, school):
        student = Student.objects.create(school=school, admission_number="A002", full_name="Jane")
        guardian = Guardian.objects.create(
            school=school, student=student, name="Mom", relation="mother", is_primary_contact=True
        )
        assert str(guardian) == "Mom (Mother)"

    def test_admission_application(self, school):
        app = AdmissionApplication.objects.create(
            school=school, full_name="New Kid", status="pending", track_token="xyz"
        )
        assert app.status == "pending"
        assert str(app) == "New Kid — Pending"
