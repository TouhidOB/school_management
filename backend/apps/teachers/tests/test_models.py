import pytest
from django.db import IntegrityError
from apps.tenants.models import School
from apps.teachers.models import Designation, TeacherProfile

@pytest.fixture
def school():
    return School.objects.create(name="Teachers School", slug="teachers")

@pytest.mark.django_db
class TestTeachersModels:
    def test_designation_creation(self, school):
        dsg = Designation.objects.create(school=school, name="Senior Teacher", rank_order=10)
        assert dsg.name == "Senior Teacher"

    def test_teacher_creation(self, school):
        dsg = Designation.objects.create(school=school, name="Teacher", rank_order=5)
        teacher = TeacherProfile.objects.create(
            school=school, employee_id="E123", full_name="Alice", designation=dsg
        )
        assert str(teacher) == "Alice"
        
    def test_unique_employee_id(self, school):
        from django.db import transaction
        TeacherProfile.objects.create(school=school, employee_id="E001", full_name="Bob")
        with transaction.atomic():
            with pytest.raises(IntegrityError):
                TeacherProfile.objects.create(school=school, employee_id="E001", full_name="Charlie")
