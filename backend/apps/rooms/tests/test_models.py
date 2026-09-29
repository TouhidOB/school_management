import pytest
from apps.tenants.models import School
from apps.rooms.models import ClassRoom
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject

@pytest.fixture
def school():
    return School.objects.create(name="Room School", slug="room")

@pytest.mark.django_db
class TestRoomsModels:
    def test_classroom(self, school):
        year = AcademicYear.objects.create(school=school, name="2026")
        cls = SchoolClass.objects.create(school=school, name="Class 1")
        sec = Section.objects.create(school=school, school_class=cls, academic_year=year, name="A")
        sub = Subject.objects.create(school=school, school_class=cls, name="Math", code="M1")
        room = ClassRoom.objects.create(
            school=school, name="Room 101", room_code="R101",
            subject=sub, section=sec, academic_year=year
        )
        assert room.name == "Room 101"
