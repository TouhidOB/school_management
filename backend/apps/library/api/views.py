from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.api import SchoolScopedViewSet
from apps.library.models import BookCategory, Book, BookIssue
from . import serializers as s

class BookCategoryViewSet(SchoolScopedViewSet):
    required_module = "library"
    queryset = BookCategory.objects.all()
    serializer_class = s.BookCategorySerializer
    search_fields = ["name"]


class BookViewSet(SchoolScopedViewSet):
    required_module = "library"
    queryset = Book.objects.select_related("category").all()
    serializer_class = s.BookSerializer
    filterset_fields = ["category"]
    search_fields = ["title", "author", "isbn"]


class BookIssueViewSet(SchoolScopedViewSet):
    required_module = "library"
    queryset = BookIssue.objects.select_related("book", "student").all()
    serializer_class = s.BookIssueSerializer
    filterset_fields = ["status", "student", "book"]
    search_fields = ["book__title", "student__full_name"]

    def perform_create(self, serializer):
        # Automatically decrement available quantity
        issue = serializer.save(school=self._active_school)
        issue.book.available_quantity -= 1
        issue.book.save(update_fields=["available_quantity"])

    @action(detail=True, methods=["post"])
    def return_book(self, request, pk=None):
        issue = self.get_object()
        
        if issue.status != "issued":
            return Response({"detail": "Book already returned or lost."}, status=400)
            
        today = timezone.now().date()
        issue.return_date = today
        issue.status = "returned"
        
        # Calculate fine if overdue (e.g., $1 per day)
        if today > issue.due_date:
            days_late = (today - issue.due_date).days
            issue.fine_amount = days_late * 1.00 # Flat $1 per day fine
            
        issue.save()
        
        # Increment available quantity
        issue.book.available_quantity += 1
        issue.book.save(update_fields=["available_quantity"])
        
        return Response(self.get_serializer(issue).data)
