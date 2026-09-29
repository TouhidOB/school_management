with open("backend/config/settings.py", "r") as f:
    text = f.read()

text = text.replace(
    '"DEFAULT_PAGINATION_CLASS": "apps.core.api.mixins.DynamicPageNumberPagination",',
    '"DEFAULT_PAGINATION_CLASS": "config.pagination.DynamicPageNumberPagination",'
)

with open("backend/config/settings.py", "w") as f:
    f.write(text)

print("Patched pagination class to config.pagination.")
