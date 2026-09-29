import pytest
from datetime import date
from apps.tenants.models import School
from apps.ratings.models import RatingPeriod

@pytest.fixture
def school():
    return School.objects.create(name="Rating School", slug="rating")

@pytest.mark.django_db
class TestRatingsModels:
    def test_rating_period(self, school):
        period = RatingPeriod.objects.create(
            school=school, name="Spring 2026", start_date=date(2026, 1, 1), end_date=date(2026, 6, 1)
        )
        assert period.name == "Spring 2026"
