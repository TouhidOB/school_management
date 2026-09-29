from rest_framework import serializers
from apps.inventory.models import ItemCategory, Supplier, Item, ItemIssue

class ItemCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemCategory
        fields = ["id", "name", "description"]


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "contact_person", "phone", "email", "address"]


class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Item
        fields = ["id", "name", "category", "category_name", "total_quantity", "available_quantity"]


class ItemIssueSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)

    class Meta:
        model = ItemIssue
        fields = ["id", "item", "item_name", "issued_to", "quantity", "issue_date", "return_date", "status"]
        read_only_fields = ["status", "return_date"]

    def validate(self, attrs):
        item = attrs.get("item")
        quantity = attrs.get("quantity", 1)
        
        if not self.instance and item: # Only check on create
            if quantity > item.available_quantity:
                raise serializers.ValidationError({"quantity": "Not enough items in stock."})
        return attrs
