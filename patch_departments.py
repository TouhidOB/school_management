import re

paths = [
    "frontend/app/(app)/academics/departments/page.js",
    "frontend/app/(app)/academics/designations/page.js"
]

for path in paths:
    with open(path, "r") as f:
        text = f.read()
        
    text = text.replace('field: "name"', 'key: "name"')
    text = text.replace('name: "name"', 'key: "name"')
    
    with open(path, "w") as f:
        f.write(text)

print("Patched pages.")
