with open("frontend/components/StudentForm.js", "r") as f:
    text = f.read()

old_field = '<TextField fullWidth label="Blood group" value={form.blood_group} onChange={(e) => update("blood_group", e.target.value)} />'
new_field = """<TextField select fullWidth label="Blood group" value={form.blood_group || ""} onChange={(e) => update("blood_group", e.target.value)}>
                  <MenuItem value=""><em>—</em></MenuItem>
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="AB+">AB+</MenuItem>
                  <MenuItem value="AB-">AB-</MenuItem>
                  <MenuItem value="O+">O+</MenuItem>
                  <MenuItem value="O-">O-</MenuItem>
                  <MenuItem value="Not K">Not K</MenuItem>
                </TextField>"""

if old_field in text:
    text = text.replace(old_field, new_field)
    with open("frontend/components/StudentForm.js", "w") as f:
        f.write(text)
    print("Patched successfully")
else:
    print("Old field not found!")
