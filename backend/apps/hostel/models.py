from django.db import models
from apps.core.models import SchoolScopedModel
from django.utils import timezone

class Hostel(SchoolScopedModel):
    HOSTEL_TYPES = [
        ("boys", "Boys"),
        ("girls", "Girls"),
        ("coed", "Co-ed")
    ]
    name = models.CharField(max_length=150)
    type = models.CharField(max_length=20, choices=HOSTEL_TYPES, default="boys")
    address = models.TextField(blank=True)
    warden_name = models.CharField(max_length=100)
    warden_phone = models.CharField(max_length=30)
    
    class Meta:
        unique_together = [("school", "name")]
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class HostelRoom(SchoolScopedModel):
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name="rooms")
    room_number = models.CharField(max_length=50)
    capacity = models.PositiveIntegerField(default=2)
    monthly_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    class Meta:
        unique_together = [("school", "hostel", "room_number")]
        ordering = ["room_number"]

    def __str__(self):
        return f"{self.room_number} - {self.hostel.name} (Capacity: {self.capacity})"


class HostelAllocation(SchoolScopedModel):
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="hostel_allocations")
    room = models.ForeignKey(HostelRoom, on_delete=models.CASCADE, related_name="allocations")
    allocation_date = models.DateField(default=timezone.now)
    
    class Meta:
        # A student is only allocated to one bed at a time.
        unique_together = [("school", "student")]

    def __str__(self):
        return f"{self.student.full_name} -> Room {self.room.room_number}"
