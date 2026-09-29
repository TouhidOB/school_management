with open("backend/config/settings.py", "r") as f:
    text = f.read()

text = text.replace(
    '"DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",',
    '"DEFAULT_PAGINATION_CLASS": "apps.core.api.pagination.DynamicPageNumberPagination",'
)

with open("backend/config/settings.py", "w") as f:
    f.write(text)

print("Patched pagination class.")
