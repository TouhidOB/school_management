import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient
from django.utils import timezone
from apps.tenants.models import School
from apps.accounts.models import User
from apps.students.models import Student
from apps.fees.models import Invoice

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
    client.default_headers = {"HTTP_X_ACTIVE_SCHOOL": str(school.id)}
    return client

@pytest.mark.django_db
class TestFeesAPI:
    def test_invoice_pay_partial(self, school, admin_client):
        student = Student.objects.create(school=school, admission_number="F001", full_name="Fee Student")
        inv = Invoice.objects.create(
            school=school, student=student, invoice_number="INV-001",
            invoice_date=timezone.now().date(), grand_total=Decimal("1500.00"), status="draft"
        )
        url = reverse("invoice-pay", kwargs={"pk": inv.pk})
        response = admin_client.post(url, {
            "amount_paid": "500.00",
            "payment_method": "cash"
        }, format="json")
        
        assert response.status_code == 200, response.data
        assert response.data["status"] == "partially_paid" # Should be partially_paid, not partial
