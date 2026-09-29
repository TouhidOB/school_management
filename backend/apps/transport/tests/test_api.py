import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.tenants.models import School
from apps.accounts.models import User
from apps.students.models import Student
from apps.transport.models import Vehicle, Route, TransportAllocation

@pytest.fixture
def school():
    return School.objects.create(name="Trans School", slug="trans")

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
class TestTransportAPI:
    def test_vehicle_creation(self, school, admin_client):
        url = reverse("vehicle-list")
        response = admin_client.post(url, {
            "vehicle_number": "BUS-101",
            "capacity": 40,
            "driver_name": "John Doe",
            "driver_phone": "1234567890"
        }, format="json")
        assert response.status_code == 201
        
    def test_transport_allocation_capacity(self, school, admin_client):
        # Create vehicle with capacity 1
        vehicle = Vehicle.objects.create(school=school, vehicle_number="BUS-01", capacity=1, driver_name="Bob", driver_phone="000")
        route = Route.objects.create(school=school, name="Route A", vehicle=vehicle)
        
        student1 = Student.objects.create(school=school, admission_number="T1", full_name="Alice")
        student2 = Student.objects.create(school=school, admission_number="T2", full_name="Bob")
        
        url = reverse("transportallocation-list")
        
        # First allocation should succeed
        res1 = admin_client.post(url, {
            "student": student1.id,
            "route": route.id,
            "pickup_point": "Station 1"
        }, format="json")
        assert res1.status_code == 201
        
        # Second allocation should fail due to capacity
        res2 = admin_client.post(url, {
            "student": student2.id,
            "route": route.id,
            "pickup_point": "Station 2"
        }, format="json")
        assert res2.status_code == 400
        assert "route" in res2.data
        assert "maximum capacity" in str(res2.data["route"][0])
