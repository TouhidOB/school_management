with open("backend/apps/students/api/serializers.py", "r") as f:
    text = f.read()

text = text.replace('"address", "emergency_contact",', '"address", "permanent_address", "emergency_contact",')
text = text.replace('"address",\n            "previous_school"', '"address", "permanent_address",\n            "previous_school"')

with open("backend/apps/students/api/serializers.py", "w") as f:
    f.write(text)
