from django.db import models
from apps.core.models import SchoolScopedModel

class Vehicle(SchoolScopedModel):
    vehicle_number = models.CharField(max_length=50)
    model = models.CharField(max_length=100, blank=True)
    capacity = models.PositiveIntegerField(default=40)
    driver_name = models.CharField(max_length=100)
    driver_phone = models.CharField(max_length=30)
    
    class Meta:
        unique_together = [("school", "vehicle_number")]
        ordering = ["vehicle_number"]

    def __str__(self):
        return f"{self.vehicle_number} (Capacity: {self.capacity})"


class Route(SchoolScopedModel):
    name = models.CharField(max_length=150)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, related_name="routes")
    start_point = models.CharField(max_length=200)
    end_point = models.CharField(max_length=200)
    monthly_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    class Meta:
        unique_together = [("school", "name")]
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} - {self.vehicle.vehicle_number if self.vehicle else 'Unassigned'}"


class TransportAllocation(SchoolScopedModel):
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="transport_allocations")
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="allocations")
    pickup_point = models.CharField(max_length=200)
    
    class Meta:
        # A student is only allocated to one route at a time.
        unique_together = [("school", "student")]

    def __str__(self):
        return f"{self.student.full_name} -> {self.route.name}"
