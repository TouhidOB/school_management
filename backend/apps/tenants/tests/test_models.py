import pytest
from apps.tenants.models import School
from apps.accounts.models import User

@pytest.mark.django_db
class TestSchoolModel:
    def test_school_creation(self):
        school = School.objects.create(
            name="Test School",
            slug="test-school",
            school_type="high_school",
            admin_email="admin@test.com",
            status=School.STATUS_ACTIVE
        )
        assert school.name == "Test School"
        assert school.slug == "test-school"
        assert school.status == School.STATUS_ACTIVE
        assert school.has_access is True

    def test_inactive_school_access(self):
        school = School.objects.create(
            name="Suspended School",
            slug="suspended-school",
            school_type="high_school",
            admin_email="admin@suspended.com",
            status=School.STATUS_SUSPENDED
        )
        assert school.has_access is False
