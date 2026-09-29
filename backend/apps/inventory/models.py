from django.db import models
from apps.core.models import SchoolScopedModel
from django.utils import timezone

class ItemCategory(SchoolScopedModel):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    
    class Meta:
        unique_together = [("school", "name")]
        ordering = ["name"]

    def __str__(self):
        return self.name


class Supplier(SchoolScopedModel):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    
    class Meta:
        unique_together = [("school", "name")]
        ordering = ["name"]

    def __str__(self):
        return self.name


class Item(SchoolScopedModel):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(ItemCategory, on_delete=models.CASCADE, related_name="items")
    total_quantity = models.PositiveIntegerField(default=0)
    available_quantity = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = [("school", "name")]
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} (Avail: {self.available_quantity})"


class ItemIssue(SchoolScopedModel):
    STATUS_CHOICES = [
        ("issued", "Issued"),
        ("returned", "Returned")
    ]
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="issues")
    issued_to = models.CharField(max_length=150, help_text="Person or Department")
    quantity = models.PositiveIntegerField(default=1)
    issue_date = models.DateField(default=timezone.now)
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="issued")
    
    class Meta:
        ordering = ["-issue_date"]

    def __str__(self):
        return f"{self.quantity} x {self.item.name} -> {self.issued_to}"
