import re

with open('backend/apps/fees/api/serializers.py', 'r') as f:
    content = f.read()

# Replace the top one
content = content.replace(
"""    class Meta:
        model = Invoice

    def create""",
"""    class Meta:
        model = Invoice
        fields = [
            "id", "student", "student_name", "academic_year", "month",
            "invoice_number", "invoice_date", "due_date", "line_items",
            "subtotal", "total_discount", "late_fine", "grand_total",
            "status", "status_display", "payments",
        ]

    def create"""
)

# Remove the broken bottom one
content = content.replace(
"""        return invoice

        fields = [
            "id", "student", "student_name", "academic_year", "month",
            "invoice_number", "invoice_date", "due_date", "line_items",
            "subtotal", "total_discount", "late_fine", "grand_total",
            "status", "status_display", "payments",
        ]""",
"""        return invoice"""
)

with open('backend/apps/fees/api/serializers.py', 'w') as f:
    f.write(content)
