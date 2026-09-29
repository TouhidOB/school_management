with open("frontend/components/StudentForm.js", "r") as f:
    text = f.read()

# Add state for photo preview and file
text = text.replace('const [previewIds, setPreviewIds] = useState({ admission_number: "Auto-generated", roll_number: "Auto-generated" });',
                    'const [previewIds, setPreviewIds] = useState({ admission_number: "Auto-generated", roll_number: "Auto-generated" });\n  const [photoFile, setPhotoFile] = useState(null);\n  const [photoPreview, setPhotoPreview] = useState(null);')

# Load photo if editing
text = text.replace('setForm(fData);', 'setForm(fData);\n          if (fData.photo) setPhotoPreview(fData.photo);')

# Submit logic
old_submit = """    try {
      if (id) await api.patch(`/students/${id}/`, payload);
      else await api.post("/students/", payload);
      router.push("/students");
    }"""
new_submit = """    try {
      let studentId = id;
      if (id) {
        await api.patch(`/students/${id}/`, payload);
      } else {
        const res = await api.post("/students/", payload);
        studentId = res.id;
      }
      
      // Upload photo if selected
      if (photoFile) {
        const fd = new FormData();
        fd.append("photo", photoFile);
        await api.patch(`/students/${studentId}/`, fd, { isForm: true });
      }
      
      router.push("/students");
    }"""
text = text.replace(old_submit, new_submit)

# Add UI for photo
old_ui = '<Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>1. Basic Details</Typography>'
new_ui = """<Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>1. Basic Details</Typography>
            <Grid container spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
              <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
                <Box sx={{ width: 120, height: 120, borderRadius: '50%', bgcolor: 'grey.200', mx: 'auto', mb: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">No Photo</Typography>
                  )}
                </Box>
                <Button variant="outlined" component="label" size="small">
                  Upload Photo
                  <input type="file" hidden accept="image/*" onChange={(e) => {
                    if (e.target.files[0]) {
                      setPhotoFile(e.target.files[0]);
                      setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </Button>
              </Grid>
              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth label="Full name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Admission ID" value={id ? form.admission_number : previewIds.admission_number} disabled={!id} helperText="Platform generated format" />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Roll #" value={id ? form.roll_number : previewIds.roll_number} disabled={!id} helperText="Auto-increments by class" />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField select fullWidth label="Gender" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                      <MenuItem value=""><em>—</em></MenuItem>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth type="date" label="Date of birth" value={form.dob || ""} onChange={(e) => update("dob", e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField select fullWidth label="Blood group" value={form.blood_group || ""} onChange={(e) => update("blood_group", e.target.value)}>
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
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField select fullWidth label="Status" value={form.status} onChange={(e) => update("status", e.target.value)}>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="transferred">Transferred</MenuItem>
                      <MenuItem value="alumni">Alumni</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>"""

old_ui_block = """<Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>1. Basic Details</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Full name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Admission ID" value={id ? form.admission_number : previewIds.admission_number} disabled={!id} helperText="Platform generated format" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Roll #" value={id ? form.roll_number : previewIds.roll_number} disabled={!id} helperText="Auto-increments by class" />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField select fullWidth label="Gender" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                  <MenuItem value=""><em>—</em></MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="date" label="Date of birth" value={form.dob || ""} onChange={(e) => update("dob", e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select fullWidth label="Blood group" value={form.blood_group || ""} onChange={(e) => update("blood_group", e.target.value)}>
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
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select fullWidth label="Status" value={form.status} onChange={(e) => update("status", e.target.value)}>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="transferred">Transferred</MenuItem>
                  <MenuItem value="alumni">Alumni</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
            </Grid>"""

if old_ui_block in text:
    text = text.replace(old_ui_block, new_ui)
    with open("frontend/components/StudentForm.js", "w") as f:
        f.write(text)
    print("Patched successfully")
else:
    print("Old UI block not found!")
