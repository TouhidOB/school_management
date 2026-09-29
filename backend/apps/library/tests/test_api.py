import pytest
from datetime import date, timedelta
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APIClient
from apps.tenants.models import School
from apps.accounts.models import User
from apps.students.models import Student
from apps.library.models import BookCategory, Book, BookIssue

@pytest.fixture
def school():
    return School.objects.create(name="Lib School", slug="lib")

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
class TestLibraryAPI:
    def test_book_creation(self, school, admin_client):
        cat = BookCategory.objects.create(school=school, name="Fiction")
        url = reverse("book-list")
        
        response = admin_client.post(url, {
            "title": "Harry Potter",
            "category": cat.id,
            "total_quantity": 5
        }, format="json")
        
        assert response.status_code == 201
        book = Book.objects.get(title="Harry Potter")
        assert book.total_quantity == 5
        assert book.available_quantity == 5
        
    def test_book_issue_and_return(self, school, admin_client):
        cat = BookCategory.objects.create(school=school, name="Science")
        book = Book.objects.create(school=school, title="Physics", category=cat, total_quantity=3, available_quantity=3)
        student = Student.objects.create(school=school, admission_number="S1", full_name="Alice")
        
        # Issue book
        issue_url = reverse("bookissue-list")
        today = timezone.now().date()
        due_date = today - timedelta(days=5) # Make it overdue for fine test
        
        response = admin_client.post(issue_url, {
            "book": book.id,
            "student": student.id,
            "issue_date": str(today - timedelta(days=10)),
            "due_date": str(due_date)
        }, format="json")
        
        assert response.status_code == 201, response.data
        issue_id = response.data["id"]
        
        # Verify available_quantity decreased
        book.refresh_from_db()
        assert book.available_quantity == 2
        
        # Return book
        return_url = reverse("bookissue-return-book", kwargs={"pk": issue_id})
        response = admin_client.post(return_url, {}, format="json")
        
        assert response.status_code == 200, response.data
        
        # Verify fine and quantity
        issue = BookIssue.objects.get(id=issue_id)
        assert issue.status == "returned"
        assert issue.fine_amount == 5.00 # 5 days overdue * $1
        
        book.refresh_from_db()
        assert book.available_quantity == 3
