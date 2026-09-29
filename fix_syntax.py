import os

files = [
    "frontend/app/(super-admin)/platform/plans/new/page.js",
    "frontend/app/(super-admin)/platform/plans/[id]/page.js"
]

for file in files:
    with open(file, "r") as f:
        content = f.read()
    
    # Let's fix the broken XML syntax
    bad_syntax = """              <FormControlLabel 
                control={<Switch checked={formData.is_active} onChange={handleChange} name="is_active" />} 
                label="Is Active" 
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel 
                  control={<Switch checked={formData.is_per_student} onChange={handleChange} name="is_per_student" />} 
                  label="Per-Student Pricing" 
                />
              />"""
              
    good_syntax = """              <FormControlLabel 
                control={<Switch checked={formData.is_active} onChange={handleChange} name="is_active" />} 
                label="Is Active" 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel 
                control={<Switch checked={formData.is_per_student} onChange={handleChange} name="is_per_student" />} 
                label="Per-Student Pricing" 
              />
            </Grid>"""
            
    # Or just replace the whole switch block to be safe
    # Let's use regex to replace everything between 'control={<Switch checked={formData.is_active}' and the Pricing subtitle.
    
    import re
    # Find the entire block from 'Is Active' grid item to the end of the container
    new_content = re.sub(
        r'<FormControlLabel\s*control=\{<Switch checked=\{formData\.is_active\}.*?label="Is Active"\s*.*?\/>',
        r'''<FormControlLabel 
                control={<Switch checked={formData.is_active} onChange={handleChange} name="is_active" />} 
                label="Is Active" 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel 
                control={<Switch checked={formData.is_per_student} onChange={handleChange} name="is_per_student" />} 
                label="Per-Student Pricing" 
              />''',
        content,
        flags=re.DOTALL
    )
    with open(file, "w") as f:
        f.write(new_content)
print("Files patched")
