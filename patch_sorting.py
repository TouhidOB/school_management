import re

with open("backend/apps/students/api/views.py", "r") as f:
    text = f.read()

# Add imports
imports_to_add = "from django.db.models.functions import LPad\nfrom django.db.models import Value, CharField\n"
text = text.replace("from django.db.models import Count, Sum\n", "from django.db.models import Count, Sum, Value, CharField\nfrom django.db.models.functions import LPad\n")


# Patch StudentViewSet queryset
old_qs = """class StudentViewSet(SchoolScopedViewSet):
    queryset = Student.objects.select_related(
        "current_class", "current_section").prefetch_related("guardians").all()"""

new_qs = """class StudentViewSet(SchoolScopedViewSet):
    queryset = Student.objects.select_related(
        "current_class", "current_section"
    ).prefetch_related("guardians").annotate(
        roll_padded=LPad('roll_number', 10, Value('0'))
    ).order_by('current_class', 'current_section', 'roll_padded')"""

text = text.replace(old_qs, new_qs)

with open("backend/apps/students/api/views.py", "w") as f:
    f.write(text)
print("Patched StudentViewSet sorting")
