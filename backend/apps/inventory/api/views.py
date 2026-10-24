from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from apps.core.api import SchoolScopedViewSet
from apps.inventory.models import ItemCategory, Supplier, Item, ItemIssue
from . import serializers as s

class ItemCategoryViewSet(SchoolScopedViewSet):
    required_module = "inventory"
    queryset = ItemCategory.objects.all()
    serializer_class = s.ItemCategorySerializer
    search_fields = ["name"]


class SupplierViewSet(SchoolScopedViewSet):
    required_module = "inventory"
    queryset = Supplier.objects.all()
    serializer_class = s.SupplierSerializer
    search_fields = ["name", "contact_person"]


class ItemViewSet(SchoolScopedViewSet):
    required_module = "inventory"
    queryset = Item.objects.select_related("category").all()
    serializer_class = s.ItemSerializer
    filterset_fields = ["category"]
    search_fields = ["name"]


class ItemIssueViewSet(SchoolScopedViewSet):
    required_module = "inventory"
    queryset = ItemIssue.objects.select_related("item").all()
    serializer_class = s.ItemIssueSerializer
    filterset_fields = ["item", "status"]
    search_fields = ["issued_to", "item__name"]

    def perform_create(self, serializer):
        issue = serializer.save(status="issued", school=self._active_school)
        item = issue.item
        item.available_quantity -= issue.quantity
        item.save()

    @action(detail=True, methods=["post"])
    def return_item(self, request, pk=None):
        issue = self.get_object()
        if issue.status == "returned":
            return Response({"detail": "Item already returned."}, status=400)
        
        issue.status = "returned"
        issue.return_date = timezone.now().date()
        issue.save()
        
        item = issue.item
        item.available_quantity += issue.quantity
        item.save()
        
        return Response({"status": "returned"})
