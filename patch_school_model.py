import re

with open('backend/apps/tenants/models.py', 'r') as f:
    content = f.read()

id_fields = """
    # Dynamic ID Generation Settings
    id_prefix = models.CharField(max_length=10, default="ADM", blank=True, help_text="e.g. ADM")
    id_include_year = models.BooleanField(default=True, help_text="e.g. ADM-2026-...")
    id_digits = models.PositiveSmallIntegerField(default=4, help_text="Number of digits for auto-increment")

"""

content = content.replace(
    '    registration_number = models.CharField(max_length=100, blank=True)',
    '    registration_number = models.CharField(max_length=100, blank=True)\n' + id_fields
)

with open('backend/apps/tenants/models.py', 'w') as f:
    f.write(content)
