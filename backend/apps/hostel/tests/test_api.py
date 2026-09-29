import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.tenants.models import School
from apps.accounts.models import User
from apps.students.models import Student
from apps.hostel.models import Hostel, HostelRoom, HostelAllocation

@pytest.fixture
def school():
    return School.objects.create(name="Hostel School", slug="hostel")

@pytest.fixture
def admin_client(school):
    user = User.objects.create_user(
        username="admin", password="password", school=school, role=User.ROLE_SCHOOL_ADMIN
    )
    client = APIClient()
    response = client.post(reverse("api_login"), {"username": "admin", "password": "password"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    client.default_headers = {"HTTP_X_ACTIVE_SCHOOL": str(school.id)}
    return client

@pytest.mark.django_db
class TestHostelAPI:
    def test_hostel_creation(self, school, admin_client):
        url = reverse("hostel-list")
        response = admin_client.post(url, {
            "name": "Boys Hostel A",
            "type": "boys",
            "warden_name": "John Doe",
            "warden_phone": "1234567890"
        }, format="json")
        assert response.status_code == 201
        
    def test_hostel_allocation_capacity(self, school, admin_client):
        # Create room with capacity 1
        hostel = Hostel.objects.create(school=school, name="H1", warden_name="W1", warden_phone="123")
        room = HostelRoom.objects.create(school=school, hostel=hostel, room_number="101", capacity=1)
        
        student1 = Student.objects.create(school=school, admission_number="H1", full_name="Alice")
        student2 = Student.objects.create(school=school, admission_number="H2", full_name="Bob")
        
        url = reverse("hostelallocation-list")
        
        # First allocation should succeed
        res1 = admin_client.post(url, {
            "student": student1.id,
            "room": room.id,
            "allocation_date": "2026-01-01"
        }, format="json")
        assert res1.status_code == 201, res1.data
        
        # Second allocation should fail due to capacity
        res2 = admin_client.post(url, {
            "student": student2.id,
            "room": room.id,
            "allocation_date": "2026-01-01"
        }, format="json")
        assert res2.status_code == 400
        assert "room" in res2.data
        assert "maximum capacity" in str(res2.data["room"][0])
