import re

with open("frontend/components/TeacherForm.js", "r") as f:
    text = f.read()

# Add Dialog imports
import_search = "Alert, Checkbox, ListItemText, FormControlLabel, Avatar, IconButton, Divider"
import_replace = "Alert, Checkbox, ListItemText, FormControlLabel, Avatar, IconButton, Divider, Dialog, DialogTitle, DialogContent, DialogActions"
text = text.replace(import_search, import_replace)

# Add State for Dialog
state_search = "const [resumeFile, setResumeFile] = useState(null);"
state_replace = """const [resumeFile, setResumeFile] = useState(null);

  const [quickAdd, setQuickAdd] = useState({ open: false, type: "", name: "", loading: false, error: "" });
  const openQuickAdd = (type) => setQuickAdd({ open: true, type, name: "", loading: false, error: "" });
  const handleQuickAdd = async () => {
    if (!quickAdd.name.trim()) return;
    setQuickAdd(p => ({ ...p, loading: true, error: "" }));
    try {
      const endpoint = quickAdd.type === "department" ? "/departments/" : "/designations/";
      const res = await api.post(endpoint, { name: quickAdd.name });
      if (quickAdd.type === "department") {
        setDepartments(prev => [...prev, res]);
        setForm(f => ({ ...f, department: res.id }));
      } else {
        setDesignations(prev => [...prev, res]);
        setForm(f => ({ ...f, designation: res.id }));
      }
      setQuickAdd({ open: false, type: "", name: "", loading: false, error: "" });
    } catch (err) {
      setQuickAdd(p => ({ ...p, loading: false, error: err.data?.name?.[0] || err.message || "Error" }));
    }
  };"""
text = text.replace(state_search, state_replace)

# Update fields
field_dept_search = """<TextField select fullWidth label="Department" required value={form.department} onChange={(e) => set("department", e.target.value)}>
                <MenuItem value=""><em>None</em></MenuItem>
                {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>"""
field_dept_replace = """<TextField select fullWidth label="Department" value={form.department} onChange={(e) => set("department", e.target.value)} helperText={<span style={{cursor:'pointer', color:'#1976d2'}} onClick={() => openQuickAdd('department')}>+ Add Department</span>}>
                <MenuItem value=""><em>None</em></MenuItem>
                {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>"""
text = text.replace(field_dept_search, field_dept_replace)

field_desig_search = """<TextField select fullWidth label="Designation" required value={form.designation} onChange={(e) => set("designation", e.target.value)}>
                <MenuItem value=""><em>None</em></MenuItem>
                {designations.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>"""
field_desig_replace = """<TextField select fullWidth label="Designation" value={form.designation} onChange={(e) => set("designation", e.target.value)} helperText={<span style={{cursor:'pointer', color:'#1976d2'}} onClick={() => openQuickAdd('designation')}>+ Add Designation</span>}>
                <MenuItem value=""><em>None</em></MenuItem>
                {designations.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>"""
text = text.replace(field_desig_search, field_desig_replace)

# Add Dialog component at the end
dialog_code = """          <Box sx={{ mt: 5, display: 'flex', gap: 2, borderTop: '1px solid', borderColor: 'divider', pt: 3 }}>
            <Button type="submit" variant="contained" size="large" disabled={busy}>
              {busy ? "Saving…" : "Save Teacher"}
            </Button>
            <Button variant="outlined" size="large" onClick={() => router.push("/teachers")}>
              Cancel
            </Button>
          </Box>
        </form>
      </CardContent>

      <Dialog open={quickAdd.open} onClose={() => !quickAdd.loading && setQuickAdd(p => ({ ...p, open: false }))}>
        <DialogTitle>Add New {quickAdd.type === 'department' ? 'Department' : 'Designation'}</DialogTitle>
        <DialogContent>
          {quickAdd.error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{quickAdd.error}</Alert>}
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Name"
            value={quickAdd.name}
            onChange={e => setQuickAdd(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickAdd(p => ({ ...p, open: false }))} disabled={quickAdd.loading}>Cancel</Button>
          <Button onClick={handleQuickAdd} variant="contained" disabled={quickAdd.loading || !quickAdd.name.trim()}>Save</Button>
        </DialogActions>
      </Dialog>
    </Card>"""

text = text.replace("""          <Box sx={{ mt: 5, display: 'flex', gap: 2, borderTop: '1px solid', borderColor: 'divider', pt: 3 }}>
            <Button type="submit" variant="contained" size="large" disabled={busy}>
              {busy ? "Saving…" : "Save Teacher"}
            </Button>
            <Button variant="outlined" size="large" onClick={() => router.push("/teachers")}>
              Cancel
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>""", dialog_code)

with open("frontend/components/TeacherForm.js", "w") as f:
    f.write(text)

print("TeacherForm inline add patched.")
