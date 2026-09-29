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
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

export default function GeneralSettingsPage() {
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
        default_grading_system: form.default_grading_system,
        default_attendance_system: form.default_attendance_system,
        school_start_time: form.school_start_time || null,
        school_end_time: form.school_end_time || null,
        attendance_late_after: form.attendance_late_after || null,
        device_brand: form.device_brand,
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
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>General Operations</Typography>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 4 }}>
          {saved && <Alert severity="success" sx={{ mb: 3 }}>General settings saved successfully.</Alert>}
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          <form onSubmit={save}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Default Grading System"
                  value={form.default_grading_system || ""}
                  onChange={(e) => set("default_grading_system", e.target.value)}
                  placeholder="e.g. GPA (0.0 - 4.0)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Default Attendance System"
                  value={form.default_attendance_system || ""}
                  onChange={(e) => set("default_attendance_system", e.target.value)}
                  placeholder="e.g. Daily Roll Call"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="time"
                  label="School Start Time"
                  value={form.school_start_time || ""}
                  onChange={(e) => set("school_start_time", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="time"
                  label="School End Time"
                  value={form.school_end_time || ""}
                  onChange={(e) => set("school_end_time", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="time"
                  label="Mark Late After"
                  value={form.attendance_late_after || ""}
                  onChange={(e) => set("attendance_late_after", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <TextField
                  select
                  fullWidth
                  label="Biometric Device Brand"
                  value={form.device_brand || "none"}
                  onChange={(e) => set("device_brand", e.target.value)}
                  helperText="Configuring a device brand will automatically generate an ingestion API token."
                >
                  <MenuItem value="none">No device (manual attendance)</MenuItem>
                  <MenuItem value="zkteco">ZKTeco</MenuItem>
                  <MenuItem value="essl">ESSL</MenuItem>
                  <MenuItem value="suprema">Suprema BioStar</MenuItem>
                  <MenuItem value="hikvision">Hikvision</MenuItem>
                  <MenuItem value="mantra">Mantra</MenuItem>
                  <MenuItem value="generic">Generic JSON Webhook</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large"
                  startIcon={<SaveIcon />}
                >
                  Save Operations
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
