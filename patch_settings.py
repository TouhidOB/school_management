with open("backend/config/settings.py", "r") as f:
    text = f.read()

text = text.replace(
    '"PAGE_SIZE": 25,',
    '"PAGE_SIZE": 25,\n    "PAGE_SIZE_QUERY_PARAM": "page_size",\n    "MAX_PAGE_SIZE": 1000,'
)

with open("backend/config/settings.py", "w") as f:
    f.write(text)

print("Patched REST_FRAMEWORK settings.")
