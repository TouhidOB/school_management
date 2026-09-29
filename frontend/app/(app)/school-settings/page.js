"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

export default function SchoolProfilePage() {
  const { school } = useAuth();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/school/").then(setForm).catch(() => setError("No active school."));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e) {
    e.preventDefault();
    setSaved(false);
    setError("");
    try {
      const updated = await api.patch("/school/", {
        name: form.name, phone: form.phone, address: form.address,
        country: form.country, primary_color: form.primary_color,
        admin_email: form.admin_email, admission_instructions: form.admission_instructions,
        admissions_open: form.admissions_open, admission_mode: form.admission_mode,
        id_prefix: form.id_prefix, id_include_year: form.id_include_year, id_digits: form.id_digits,
      });
      setForm(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !form) return <Alert severity="warning" sx={{ m: 3 }}>{error}</Alert>;
  if (!form) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>School Profile</Typography>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 4 }}>
          {saved && <Alert severity="success" sx={{ mb: 3 }}>School profile updated successfully.</Alert>}
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          <form onSubmit={save}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="School name"
                  value={form.name || ""}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="color"
                  label="Brand colour"
                  value={form.primary_color || "#2563eb"}
                  onChange={(e) => set("primary_color", e.target.value)}
                  sx={{
                    '& input': { padding: '8px 14px', height: '56px', cursor: 'pointer' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="email"
                  label="Admin email"
                  value={form.admin_email || ""}
                  onChange={(e) => set("admin_email", e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={form.phone || ""}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Address"
                  value={form.address || ""}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Country"
                  value={form.country || ""}
                  onChange={(e) => set("country", e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Admission mode"
                  value={form.admission_mode || "online"}
                  onChange={(e) => set("admission_mode", e.target.value)}
                >
                  <MenuItem value="online">Online form</MenuItem>
                  <MenuItem value="pdf">Downloadable PDF</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!form.admissions_open}
                      onChange={(e) => set("admissions_open", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Admissions open"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Admission instructions"
                  value={form.admission_instructions || ""}
                  onChange={(e) => set("admission_instructions", e.target.value)}
                  helperText="Displayed to students when they apply online."
                />
              </Grid>
              
              <Grid item xs={12}>
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
                  variant="contained" 
                  size="large"
                  startIcon={<SaveIcon />}
                >
                  Save Profile
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
