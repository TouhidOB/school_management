with open("frontend/app/(app)/attendance/page.js", "r") as f:
    text = f.read()

text = text.replace(
    'const STATUSES = ["present", "absent", "late", "leave"];',
    'const STATUSES = ["present", "absent"];'
)

with open("frontend/app/(app)/attendance/page.js", "w") as f:
    f.write(text)

print("Fixed STATUSES in attendance.")
