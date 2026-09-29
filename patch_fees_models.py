import re

with open('backend/apps/fees/models.py', 'r') as f:
    content = f.read()

# Remove line_items from Invoice
content = re.sub(r'    line_items = models\.JSONField\(\n\s*default=list.*?help_text=".*?"\n\s*\)\n', '', content, flags=re.DOTALL)

# Check if InvoiceLineItem already exists
if 'class InvoiceLineItem(' not in content:
    # Add InvoiceLineItem at the bottom
    new_model = """
class InvoiceLineItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="line_items")
    fee_type = models.ForeignKey(FeeType, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.description} - {self.amount}"
"""
    content += new_model

with open('backend/apps/fees/models.py', 'w') as f:
    f.write(content)
