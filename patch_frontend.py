import re

with open("frontend/components/StudentForm.js", "r") as f:
    text = f.read()

# Add state for previews
state_inject = """  const [form, setForm] = useState(EMPTY);
  const [previewIds, setPreviewIds] = useState({ admission_number: "Auto-generated", roll_number: "Auto-generated" });"""
text = text.replace("  const [form, setForm] = useState(EMPTY);", state_inject)

# Add effect to fetch previews
effect_inject = """  useEffect(() => {
    if (!id) {
      api.get(`/students/next_ids/?class_id=${form.current_class || ""}`)
        .then(res => setPreviewIds({
          admission_number: res.admission_number || "Auto-generated",
          roll_number: res.roll_number || "Auto-generated"
        }))
        .catch(() => {});
    }
  }, [form.current_class, id]);"""
text = text.replace("  const sectionsForClass =", effect_inject + "\n\n  const sectionsForClass =")

# Update inputs
text = text.replace('value={id ? form.admission_number : "Auto-generated"}', 'value={id ? form.admission_number : previewIds.admission_number}')
text = text.replace('value={id ? form.roll_number : "Auto-generated"}', 'value={id ? form.roll_number : previewIds.roll_number}')

with open("frontend/components/StudentForm.js", "w") as f:
    f.write(text)
