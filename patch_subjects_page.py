with open("frontend/app/(app)/academics/subjects/page.js", "r") as f:
    text = f.read()

text = text.replace(
    "fields={[",
    "filters={[\"school_class\"]}\n      fields={["
)

with open("frontend/app/(app)/academics/subjects/page.js", "w") as f:
    f.write(text)

print("Patched subjects page")
