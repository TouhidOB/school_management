import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.tenants.models import School
from apps.accounts.models import User
from apps.inventory.models import ItemCategory, Item, ItemIssue

@pytest.fixture
def school():
    return School.objects.create(name="Inventory School", slug="inv")

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
class TestInventoryAPI:
    def test_item_issue_and_return(self, school, admin_client):
        cat = ItemCategory.objects.create(school=school, name="Lab")
        item = Item.objects.create(school=school, name="Microscope", category=cat, total_quantity=10, available_quantity=10)
        
        url = reverse("itemissue-list")
        
        # Issue 2 items
        res1 = admin_client.post(url, {
            "item": item.id,
            "issued_to": "Science Dept",
            "quantity": 2,
            "issue_date": "2026-01-01"
        }, format="json")
        assert res1.status_code == 201
        
        item.refresh_from_db()
        assert item.available_quantity == 8
        
        # Try to issue more than available
        res2 = admin_client.post(url, {
            "item": item.id,
            "issued_to": "Biology Lab",
            "quantity": 9,
            "issue_date": "2026-01-01"
        }, format="json")
        assert res2.status_code == 400
        assert "quantity" in res2.data
        
        # Return the items
        issue_id = res1.data["id"]
        return_url = reverse("itemissue-return-item", args=[issue_id])
        res3 = admin_client.post(return_url)
        assert res3.status_code == 200
        
        item.refresh_from_db()
        assert item.available_quantity == 10
