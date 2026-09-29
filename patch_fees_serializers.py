import re

with open('backend/apps/fees/api/serializers.py', 'r') as f:
    content = f.read()

# Add InvoiceLineItem to imports
content = content.replace(
    "Invoice,",
    "Invoice,\n    InvoiceLineItem,"
)

# Insert InvoiceLineItemSerializer
new_serializer = """
class InvoiceLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLineItem
        fields = ["id", "fee_type", "description", "amount", "discount"]

"""
content = content.replace("class InvoiceSerializer(", new_serializer + "class InvoiceSerializer(")

# Update InvoiceSerializer
content = content.replace('    payments = PaymentSerializer(many=True, read_only=True)', 
                          '    payments = PaymentSerializer(many=True, read_only=True)\n    line_items = InvoiceLineItemSerializer(many=True, required=False)')

# Add create/update methods to handle nested line_items
methods = """
    def create(self, validated_data):
        line_items_data = validated_data.pop('line_items', [])
        invoice = super().create(validated_data)
        for item_data in line_items_data:
            InvoiceLineItem.objects.create(invoice=invoice, **item_data)
        return invoice

    def update(self, instance, validated_data):
        line_items_data = validated_data.pop('line_items', None)
        invoice = super().update(instance, validated_data)
        
        if line_items_data is not None:
            instance.line_items.all().delete()
            for item_data in line_items_data:
                InvoiceLineItem.objects.create(invoice=invoice, **item_data)
                
        return invoice
"""
content = content.replace('        fields = [', methods + '\n        fields = [')


with open('backend/apps/fees/api/serializers.py', 'w') as f:
    f.write(content)
