from django.db import models
from apps.core.models import SchoolScopedModel

class BookCategory(SchoolScopedModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Book categories"
        unique_together = [("school", "name")]
        ordering = ["name"]

    def __str__(self):
        return self.name


class Book(SchoolScopedModel):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200, blank=True)
    isbn = models.CharField(max_length=50, blank=True, verbose_name="ISBN")
    publisher = models.CharField(max_length=200, blank=True)
    category = models.ForeignKey(BookCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="books")
    total_quantity = models.PositiveIntegerField(default=1)
    available_quantity = models.PositiveIntegerField(default=1)
    shelf_number = models.CharField(max_length=50, blank=True)

    class Meta:
        unique_together = [("school", "isbn")]
        ordering = ["title"]

    def __str__(self):
        return f"{self.title} by {self.author or 'Unknown'}"


class BookIssue(SchoolScopedModel):
    STATUS_CHOICES = [
        ("issued", "Issued"),
        ("returned", "Returned"),
        ("lost", "Lost"),
    ]

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="issues")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="book_issues")
    issue_date = models.DateField()
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="issued")
    fine_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    class Meta:
        ordering = ["-issue_date"]

    def __str__(self):
        return f"{self.book.title} -> {self.student.full_name} ({self.get_status_display()})"
