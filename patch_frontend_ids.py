with open("frontend/components/StudentForm.js", "r") as f:
    text = f.read()

old_effect = """  useEffect(() => {
    if (!id) {
      api.get(`/students/next_ids/?class_id=${form.current_class || ""}`)
        .then(res => setPreviewIds({
          admission_number: res.admission_number || "Auto-generated",
          roll_number: res.roll_number || "Auto-generated"
        }))
        .catch(() => {});
    }
  }, [form.current_class, id]);"""

new_effect = """  useEffect(() => {
    if (!id) {
      const qs = new URLSearchParams();
      if (form.current_class) qs.append("class_id", form.current_class);
      if (form.current_section) qs.append("section_id", form.current_section);
      
      api.get(`/students/next_ids/?${qs.toString()}`)
        .then(res => setPreviewIds({
          admission_number: res.admission_number || "Auto-generated",
          roll_number: res.roll_number || "Auto-generated"
        }))
        .catch(() => {});
    }
  }, [form.current_class, form.current_section, id]);"""

text = text.replace(old_effect, new_effect)
with open("frontend/components/StudentForm.js", "w") as f:
    f.write(text)
print("Patched frontend next_ids fetch")
