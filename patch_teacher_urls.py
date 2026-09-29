import re

with open("backend/apps/teachers/api/urls.py", "r") as f:
    text = f.read()

text = text.replace('router.register("designations", v.DesignationViewSet)', 'router.register("designations", v.DesignationViewSet)\nrouter.register("departments", v.DepartmentViewSet)')

with open("backend/apps/teachers/api/urls.py", "w") as f:
    f.write(text)

print("URLs patched successfully.")
