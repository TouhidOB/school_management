from rest_framework import serializers
from apps.hostel.models import Hostel, HostelRoom, HostelAllocation

class HostelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hostel
        fields = ["id", "name", "type", "address", "warden_name", "warden_phone"]


class HostelRoomSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source="hostel.name", read_only=True)

    class Meta:
        model = HostelRoom
        fields = ["id", "hostel", "hostel_name", "room_number", "capacity", "monthly_cost"]


class HostelAllocationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    room_number = serializers.CharField(source="room.room_number", read_only=True)
    hostel_name = serializers.CharField(source="room.hostel.name", read_only=True)

    class Meta:
        model = HostelAllocation
        fields = ["id", "student", "student_name", "room", "room_number", "hostel_name", "allocation_date"]

    def validate(self, attrs):
        room = attrs.get("room")
        
        if room:
            # Check if adding this student exceeds room capacity
            current_count = HostelAllocation.objects.filter(room=room).count()
            if self.instance:
                # If editing, and it's the same room, don't count it twice
                if self.instance.room == room:
                    current_count -= 1
            if current_count >= room.capacity:
                raise serializers.ValidationError({"room": "This room has reached its maximum capacity."})
        
        return attrs
