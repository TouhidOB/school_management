import pytest
from apps.tenants.models import School
from apps.notifications.models import Notification
from apps.accounts.models import User

@pytest.fixture
def school():
    return School.objects.create(name="Notif School", slug="notif")

@pytest.fixture
def user(school):
    return User.objects.create_user(username="test", password="test", school=school)

@pytest.mark.django_db
class TestNotificationsModels:
    def test_notification(self, school, user):
        notif = Notification.objects.create(school=school, recipient=user, title="Hello")
        assert notif.title == "Hello"
