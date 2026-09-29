import pytest
from datetime import date, time
from django.db import IntegrityError
from apps.tenants.models import School
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject, RoutineSlot

@pytest.fixture
def school():
    return School.objects.create(name="Academics School", slug="academics-school")

@pytest.mark.django_db
class TestAcademicsModels:
    def test_academic_year_creation(self, school):
        year = AcademicYear.objects.create(school=school, name="2026-2027", is_current=True)
        assert year.name == "2026-2027"
        assert year.is_current is True

    def test_unique_academic_year_per_school(self, school):
        AcademicYear.objects.create(school=school, name="2026")
        with pytest.raises(IntegrityError):
            AcademicYear.objects.create(school=school, name="2026")

    def test_school_class_creation(self, school):
        cls = SchoolClass.objects.create(school=school, name="Class 10", numeric_level=10)
        assert str(cls) == "Class 10"

    def test_subject_uniqueness(self, school):
        from django.db import transaction
        cls = SchoolClass.objects.create(school=school, name="Class 10", numeric_level=10)
        Subject.objects.create(school=school, school_class=cls, name="Math", code="MTH10")
        with transaction.atomic():
            with pytest.raises(IntegrityError):
                Subject.objects.create(school=school, school_class=cls, name="Math", code="MTH10_ALT")
        with transaction.atomic():
            with pytest.raises(IntegrityError):
                Subject.objects.create(school=school, school_class=cls, name="Physics", code="MTH10")

    def test_routine_slot_creation(self, school):
        year = AcademicYear.objects.create(school=school, name="2026")
        cls = SchoolClass.objects.create(school=school, name="Class 10")
        sec = Section.objects.create(school=school, school_class=cls, academic_year=year, name="A")
        sub = Subject.objects.create(school=school, school_class=cls, name="Math", code="M10")

        slot = RoutineSlot.objects.create(
            school=school, section=sec, day_of_week=0, period=1,
            start_time=time(9, 0), end_time=time(9, 45), subject=sub
        )
        assert str(slot) == "Monday P1 · Math"
