from apps.core.api import SchoolScopedViewSet
from apps.transport.models import Vehicle, Route, TransportAllocation
from . import serializers as s

class VehicleViewSet(SchoolScopedViewSet):
    required_module = "transport"
    queryset = Vehicle.objects.all()
    serializer_class = s.VehicleSerializer
    search_fields = ["vehicle_number", "driver_name"]


class RouteViewSet(SchoolScopedViewSet):
    required_module = "transport"
    queryset = Route.objects.select_related("vehicle").all()
    serializer_class = s.RouteSerializer
    search_fields = ["name", "start_point", "end_point"]


class TransportAllocationViewSet(SchoolScopedViewSet):
    required_module = "transport"
    queryset = TransportAllocation.objects.select_related("student", "route").all()
    serializer_class = s.TransportAllocationSerializer
    filterset_fields = ["route", "student"]
    search_fields = ["student__full_name", "pickup_point"]
