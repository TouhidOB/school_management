with open("frontend/components/StudentForm.js", "r") as f:
    text = f.read()

text = text.replace("<Alert,\n  Divider severity", "<Alert severity")
text = text.replace("</Alert,\n  Divider>", "</Alert>")

with open("frontend/components/StudentForm.js", "w") as f:
    f.write(text)
