import re

with open("frontend/components/TeacherForm.js", "r") as f:
    text = f.read()

# Add previewId state
state_search = "const [busy, setBusy] = useState(false);"
state_replace = "const [busy, setBusy] = useState(false);\n  const [previewId, setPreviewId] = useState(\"Auto-generated\");"
text = text.replace(state_search, state_replace)

# Add useEffect for next_id
effect_search = """  useEffect(() => {
    api.get("/designations/?page_size=200").then(d => setDesignations(d.results)).catch(() => {});
    api.get("/departments/?page_size=200").then(d => setDepartments(d.results)).catch(() => {});
    api.get("/subjects/?page_size=500").then(d => setSubjects(d.results)).catch(() => {});
  }, []);"""
effect_replace = """  useEffect(() => {
    api.get("/designations/?page_size=200").then(d => setDesignations(d.results)).catch(() => {});
    api.get("/departments/?page_size=200").then(d => setDepartments(d.results)).catch(() => {});
    api.get("/subjects/?page_size=500").then(d => setSubjects(d.results)).catch(() => {});
    if (!id) {
        api.get("/teachers/next_id/").then(d => setPreviewId(d.employee_id || "Auto-generated")).catch(() => {});
    }
  }, [id]);"""
text = text.replace(effect_search, effect_replace)

# Modify Employee ID field
field_search = """<TextField fullWidth label="Employee ID" required value={form.employee_id} onChange={(e) => set("employee_id", e.target.value)} helperText="e.g., TCH-2026-001" />"""
field_replace = """<TextField fullWidth label="Employee ID" value={id ? form.employee_id : previewId} disabled={!id} onChange={(e) => set("employee_id", e.target.value)} helperText="Platform generated format" />"""
text = text.replace(field_search, field_replace)

with open("frontend/components/TeacherForm.js", "w") as f:
    f.write(text)

print("TeacherForm patched.")
