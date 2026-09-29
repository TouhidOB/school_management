import re

with open('frontend/app/(app)/school-settings/page.js', 'r') as f:
    content = f.read()

# Update payload to include ID settings
old_payload = """      const updated = await api.patch("/school/", {
        name: form.name, phone: form.phone, address: form.address,
        country: form.country, primary_color: form.primary_color,
        admin_email: form.admin_email, admission_instructions: form.admission_instructions,
        admissions_open: form.admissions_open, admission_mode: form.admission_mode,
      });"""

new_payload = """      const updated = await api.patch("/school/", {
        name: form.name, phone: form.phone, address: form.address,
        country: form.country, primary_color: form.primary_color,
        admin_email: form.admin_email, admission_instructions: form.admission_instructions,
        admissions_open: form.admissions_open, admission_mode: form.admission_mode,
        id_prefix: form.id_prefix, id_include_year: form.id_include_year, id_digits: form.id_digits,
      });"""

content = content.replace(old_payload, new_payload)

# Add ID Settings UI before the Save button
old_submit = """              <Grid item xs={12} sx={{ mt: 1 }}>
                <Button 
                  type="submit" 
                  variant="contained" """

new_fields = """              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mt: 2, mb: 1 }}>
                  Student ID Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configure the auto-generated format for Admission IDs. (Example output: <strong>{form.id_prefix || "ADM"}-{form.id_include_year ? new Date().getFullYear() + "-" : ""}{String(1).padStart(form.id_digits || 4, "0")}</strong>)
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="ID Prefix"
                  value={form.id_prefix || ""}
                  onChange={(e) => set("id_prefix", e.target.value)}
                  helperText="e.g. ADM or STU"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Number of Digits"
                  value={form.id_digits || 4}
                  onChange={(e) => set("id_digits", parseInt(e.target.value) || 4)}
                  inputProps={{ min: 2, max: 8 }}
                  helperText="Length of the numeric part"
                />
              </Grid>
              <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!form.id_include_year}
                      onChange={(e) => set("id_include_year", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Include Year"
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 1 }}>
                <Button 
                  type="submit" 
                  variant="contained" """

content = content.replace(old_submit, new_fields)

# Include Divider
if 'Divider' not in content:
    content = content.replace('Checkbox,\n} from "@mui/material";', 'Checkbox,\n  Divider,\n} from "@mui/material";')

with open('frontend/app/(app)/school-settings/page.js', 'w') as f:
    f.write(content)
