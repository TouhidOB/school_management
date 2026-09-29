import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.tenants.models import School
from apps.accounts.models import User
from apps.students.models import AdmissionApplication, Student, Guardian

@pytest.fixture
def school():
    return School.objects.create(name="Test School", slug="test")

@pytest.fixture
def admin_client(school):
    user = User.objects.create_user(
        username="admin", password="password", school=school, role=User.ROLE_SCHOOL_ADMIN
    )
    client = APIClient()
    response = client.post(reverse("api_login"), {"username": "admin", "password": "password"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    # Required for SchoolScopedViewSet
    client.default_headers = {"HTTP_X_ACTIVE_SCHOOL": str(school.id)}
    return client

@pytest.mark.django_db
class TestStudentsAPI:
    def test_approve_admission_application(self, school, admin_client):
        app = AdmissionApplication.objects.create(
            school=school, full_name="New Student", tracking_code="TRK123", status="pending",
            father_name="John Senior"
        )
        url = reverse("admissionapplication-approve", kwargs={"pk": app.pk})
        
        # We need to make sure the endpoint is in the router
        # Let's verify the URL is correct
        response = admin_client.post(url, {
            "admission_number": "A001",
            "roll_number": "10"
        }, format="json")
        
        assert response.status_code == 200, response.data
        assert response.data["status"] == "approved"
        
        student = Student.objects.get(admission_number="A001")
        assert student.full_name == "New Student"
        
        guardian = Guardian.objects.get(student=student)
        assert guardian.name == "John Senior"
        assert guardian.relation == "father"

    def test_reject_admission_application(self, school, admin_client):
        app = AdmissionApplication.objects.create(
            school=school, full_name="Bad Student", tracking_code="TRK456", status="pending"
        )
        url = reverse("admissionapplication-reject", kwargs={"pk": app.pk})
        
        response = admin_client.post(url, {"reason": "Not a good fit"}, format="json")
        
        assert response.status_code == 200
        app.refresh_from_db()
        assert app.status == "rejected"
        assert app.rejection_reason == "Not a good fit"
