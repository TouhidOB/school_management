import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.tenants.models import School
from apps.accounts.models import User

@pytest.mark.django_db
class TestAuthAPI:
    def setup_method(self):
        self.client = APIClient()
        self.school = School.objects.create(
            name="Test School", slug="test", school_type="high_school"
        )
        self.user = User.objects.create_user(
            username="admin@test", password="password123", email="admin@test",
            school=self.school, role=User.ROLE_SCHOOL_ADMIN
        )

    def test_login_success(self):
        response = self.client.post(reverse("api_login"), {
            "username": "admin@test",
            "password": "password123"
        })
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_failure(self):
        response = self.client.post(reverse("api_login"), {
            "username": "admin@test",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    def test_me_endpoint(self):
        response = self.client.post(reverse("api_login"), {
            "username": "admin@test",
            "password": "password123"
        })
        token = response.data["access"]
        
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        me_response = self.client.get(reverse("api_me"))
        
        assert me_response.status_code == 200
        assert me_response.data["username"] == "admin@test"
        assert me_response.data["school"] == self.school.id
