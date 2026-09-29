import re

# Fix serializers.py
with open("backend/apps/academics/api/serializers.py", "r") as f:
    text = f.read()

text = text.replace("model = models.StudyMaterial", "model = StudyMaterial")
text = text.replace("model = models.OnlineClass", "model = OnlineClass")

if "from apps.academics.models import StudyMaterial" not in text:
    text = text.replace(
        "from apps.academics.models import Event",
        "from apps.academics.models import Event, StudyMaterial, OnlineClass"
    )

with open("backend/apps/academics/api/serializers.py", "w") as f:
    f.write(text)


# Fix views.py
with open("backend/apps/academics/api/views.py", "r") as f:
    text = f.read()

text = text.replace("queryset = models.StudyMaterial", "queryset = StudyMaterial")
text = text.replace("queryset = models.OnlineClass", "queryset = OnlineClass")

if "from apps.academics.models import StudyMaterial" not in text:
    text = text.replace(
        "from apps.academics.models import (",
        "from apps.academics.models import (\n    StudyMaterial,\n    OnlineClass,"
    )
    # If the above replace didn't work because formatting is different:
    if "from apps.academics.models import (\n    StudyMaterial" not in text:
        text = text.replace(
            "from apps.academics.models import Event",
            "from apps.academics.models import Event, StudyMaterial, OnlineClass"
        )

with open("backend/apps/academics/api/views.py", "w") as f:
    f.write(text)

print("Fixed academics files.")
