import re

with open("frontend/components/StudentForm.js", "r") as f:
    text = f.read()

# Update EMPTY object
old_empty = '  permanent_address: "",'
new_empty = """  permanent_address: "",
  present_thana: "",
  present_zilla: "",
  present_postal_code: "",
  permanent_thana: "",
  permanent_zilla: "",
  permanent_postal_code: ","""
text = text.replace(old_empty, new_empty)

old_grid = """            <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>4. Contact Info</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth multiline rows={2} label="Present Address" value={form.address || ""} required onChange={(e) => update("address", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth multiline rows={2} label="Permanent Address" value={form.permanent_address || ""} onChange={(e) => update("permanent_address", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Emergency contact" value={form.emergency_contact} required onChange={(e) => update("emergency_contact", e.target.value)} />
              </Grid>
            </Grid>"""

new_grid = """            <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>4. Contact Info</Typography>
            
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Present Address</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={12}>
                <TextField fullWidth label="Street/House Address" value={form.address || ""} onChange={(e) => update("address", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Thana" value={form.present_thana || ""} onChange={(e) => update("present_thana", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Zilla" value={form.present_zilla || ""} onChange={(e) => update("present_zilla", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Postal Code" value={form.present_postal_code || ""} onChange={(e) => update("present_postal_code", e.target.value)} />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Permanent Address</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={12}>
                <TextField fullWidth label="Street/House Address" value={form.permanent_address || ""} onChange={(e) => update("permanent_address", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Thana" value={form.permanent_thana || ""} onChange={(e) => update("permanent_thana", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Zilla" value={form.permanent_zilla || ""} onChange={(e) => update("permanent_zilla", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Postal Code" value={form.permanent_postal_code || ""} onChange={(e) => update("permanent_postal_code", e.target.value)} />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Other Contacts</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Emergency contact" value={form.emergency_contact || ""} onChange={(e) => update("emergency_contact", e.target.value)} />
              </Grid>
            </Grid>"""

if old_grid in text:
    text = text.replace(old_grid, new_grid)
    with open("frontend/components/StudentForm.js", "w") as f:
        f.write(text)
    print("Patched successfully")
else:
    print("Old grid not found!")
