import re

with open("frontend/components/TeacherForm.js", "r") as f:
    text = f.read()

# 1. Remove the Dialog imports (not strictly necessary but good practice)
text = text.replace(", Dialog, DialogTitle, DialogContent, DialogActions", "")

# 2. Remove quickAdd state and functions
state_pattern = re.compile(r"  const \[quickAdd.*?setQuickAdd\(\{ open: false, type: \"\", name: \"\", loading: false, error: \"\" \}\);\n    \} catch \(err\) \{\n      setQuickAdd\(p => \(\{ \.\.\.p, loading: false, error: err\.data\?\.name\?\.\[0\] \|\| err\.message \|\| \"Error\" \}\)\);\n    \}\n  \};\n", re.DOTALL)
text = state_pattern.sub("", text)

# 3. Replace the fields with standard ones
field_dept_search = """<TextField select fullWidth label="Department" value={form.department} onChange={(e) => set("department", e.target.value)} helperText={<span style={{cursor:'pointer', color:'#1976d2'}} onClick={() => openQuickAdd('department')}>+ Add Department</span>}>
                <MenuItem value=""><em>None</em></MenuItem>
                {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>"""
field_dept_replace = """<TextField select fullWidth label="Department" value={form.department} onChange={(e) => set("department", e.target.value)}>
                <MenuItem value=""><em>None</em></MenuItem>
                {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>"""
text = text.replace(field_dept_search, field_dept_replace)

field_desig_search = """<TextField select fullWidth label="Designation" value={form.designation} onChange={(e) => set("designation", e.target.value)} helperText={<span style={{cursor:'pointer', color:'#1976d2'}} onClick={() => openQuickAdd('designation')}>+ Add Designation</span>}>
                <MenuItem value=""><em>None</em></MenuItem>
                {designations.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>"""
field_desig_replace = """<TextField select fullWidth label="Designation" value={form.designation} onChange={(e) => set("designation", e.target.value)}>
                <MenuItem value=""><em>None</em></MenuItem>
                {designations.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>"""
text = text.replace(field_desig_search, field_desig_replace)

# 4. Remove Dialog JSX at bottom
dialog_pattern = re.compile(r"      <Dialog open=\{quickAdd\.open\}.*?</Dialog>\n", re.DOTALL)
text = dialog_pattern.sub("", text)

with open("frontend/components/TeacherForm.js", "w") as f:
    f.write(text)

print("Removed inline Quick Add.")
