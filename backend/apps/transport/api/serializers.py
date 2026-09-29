from rest_framework import serializers
from apps.transport.models import Vehicle, Route, TransportAllocation

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ["id", "vehicle_number", "model", "capacity", "driver_name", "driver_phone"]


class RouteSerializer(serializers.ModelSerializer):
    vehicle_number = serializers.CharField(source="vehicle.vehicle_number", read_only=True)

    class Meta:
        model = Route
        fields = ["id", "name", "vehicle", "vehicle_number", "start_point", "end_point", "monthly_fare"]


class TransportAllocationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    route_name = serializers.CharField(source="route.name", read_only=True)

    class Meta:
        model = TransportAllocation
        fields = ["id", "student", "student_name", "route", "route_name", "pickup_point"]

    def validate(self, attrs):
        route = attrs.get("route")
        
        if route and route.vehicle:
            # Check if adding this student exceeds vehicle capacity
            current_count = TransportAllocation.objects.filter(route=route).count()
            if self.instance:
                # If editing, and it's the same route, don't count it twice
                if self.instance.route == route:
                    current_count -= 1
            if current_count >= route.vehicle.capacity:
                raise serializers.ValidationError({"route": "This vehicle has reached its maximum capacity."})
        
        return attrs
