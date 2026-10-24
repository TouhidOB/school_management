from apps.core.api import SchoolScopedViewSet
from apps.hostel.models import Hostel, HostelRoom, HostelAllocation
from . import serializers as s

class HostelViewSet(SchoolScopedViewSet):
    required_module = "hostel"
    queryset = Hostel.objects.all()
    serializer_class = s.HostelSerializer
    search_fields = ["name", "warden_name"]


class HostelRoomViewSet(SchoolScopedViewSet):
    required_module = "hostel"
    queryset = HostelRoom.objects.select_related("hostel").all()
    serializer_class = s.HostelRoomSerializer
    filterset_fields = ["hostel"]
    search_fields = ["room_number"]


class HostelAllocationViewSet(SchoolScopedViewSet):
    required_module = "hostel"
    queryset = HostelAllocation.objects.select_related("student", "room", "room__hostel").all()
    serializer_class = s.HostelAllocationSerializer
    filterset_fields = ["room", "room__hostel", "student"]
    search_fields = ["student__full_name", "room__room_number"]
