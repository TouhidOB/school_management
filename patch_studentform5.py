with open("frontend/components/StudentForm.js", "r") as f:
    text = f.read()

# Add user account generation logic
new_state = """  const [busy, setBusy] = useState(false);

  async function generateAccount() {
    setBusy(true);
    try {
      const res = await api.post(`/students/${id}/create_user_account/`, {});
      setForm(f => ({ ...f, user_email: res.email }));
      alert(`Account created! Email: ${res.email}, Password: student123`);
    } catch (e) {
      setError(e.message || "Failed to create account");
    } finally {
      setBusy(false);
    }
  }"""
text = text.replace('  const [busy, setBusy] = useState(false);', new_state)

# Add User Account section
old_ui = """            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Other Contacts</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Emergency contact" value={form.emergency_contact || ""} onChange={(e) => update("emergency_contact", e.target.value)} />
              </Grid>
            </Grid>"""

new_ui = """            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Other Contacts</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Emergency contact" value={form.emergency_contact || ""} onChange={(e) => update("emergency_contact", e.target.value)} />
              </Grid>
            </Grid>

            {id && (
              <>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>5. User Account</Typography>
                <Grid container spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Login Email" value={form.user_email || "No account generated yet"} disabled />
                  </Grid>
                  {!form.user_email && (
                    <Grid item xs={12} md={6}>
                      <Button variant="outlined" onClick={generateAccount} disabled={busy}>Generate Account</Button>
                    </Grid>
                  )}
                </Grid>
              </>
            )}"""

if old_ui in text:
    text = text.replace(old_ui, new_ui)
    
# Fix image objectFit
text = text.replace("objectFit: 'cover'", "objectFit: 'contain'")

with open("frontend/components/StudentForm.js", "w") as f:
    f.write(text)
print("Patched StudentForm.js successfully!")
