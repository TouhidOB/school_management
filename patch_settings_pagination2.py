with open("backend/config/settings.py", "r") as f:
    text = f.read()

text = text.replace(
    '"DEFAULT_PAGINATION_CLASS": "apps.core.api.pagination.DynamicPageNumberPagination",',
    '"DEFAULT_PAGINATION_CLASS": "apps.core.api.mixins.DynamicPageNumberPagination",'
)

with open("backend/config/settings.py", "w") as f:
    f.write(text)

print("Patched pagination class to mixins.")
