with open("frontend/components/StudentForm.js", "r") as f:
    text = f.read()

text = text.replace(
    'const payload = { ...form };',
    'const payload = { ...form };\n    delete payload.photo;\n    delete payload.user_email;\n    delete payload.user_id;'
)

with open("frontend/components/StudentForm.js", "w") as f:
    f.write(text)
