with open("frontend/components/StudentForm.js", "r") as f:
    text = f.read()

text = text.replace(
    'const EMPTY = {\n  full_name: "",',
    'const EMPTY = {\n  photo: null,\n  full_name: "",'
)

# And make sure user_email is in EMPTY so it can be loaded for edit view
text = text.replace(
    '  status: "active",\n  father_name: "",',
    '  user_email: "",\n  status: "active",\n  father_name: "",'
)

with open("frontend/components/StudentForm.js", "w") as f:
    f.write(text)
print("Patched StudentForm.js EMPTY successfully")
