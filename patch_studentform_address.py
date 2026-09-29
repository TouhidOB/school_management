with open("frontend/components/StudentForm.js", "r") as f:
    text = f.read()

old_address_grid = """              <Grid item xs={12} md={8}>
                <TextField fullWidth multiline rows={2} label="Address" value={form.address} required onChange={(e) => update("address", e.target.value)} />
              </Grid>"""

new_address_grid = """              <Grid item xs={12} md={6}>
                <TextField fullWidth multiline rows={2} label="Present Address" value={form.address || ""} required onChange={(e) => update("address", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth multiline rows={2} label="Permanent Address" value={form.permanent_address || ""} onChange={(e) => update("permanent_address", e.target.value)} />
              </Grid>"""

if old_address_grid in text:
    text = text.replace(old_address_grid, new_address_grid)
    
    # Also need to add to EMPTY definition if we want it controlled nicely
    text = text.replace('  address: "",\n  emergency_contact:', '  address: "",\n  permanent_address: "",\n  emergency_contact:')
    
    with open("frontend/components/StudentForm.js", "w") as f:
        f.write(text)
    print("Patched successfully")
else:
    print("Old address grid not found!")
