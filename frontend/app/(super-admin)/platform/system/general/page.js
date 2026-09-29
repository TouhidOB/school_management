"use client";
import { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Grid, TextField, Button, Switch, FormControlLabel
} from "@mui/material";
import { api } from "@/lib/api";

export default function GeneralSettingsPage() {
  const [formData, setFormData] = useState({
    platform_name: "", support_email: "", support_phone: "", website_url: "",
    maintenance_mode: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/core/settings/general/");
      setFormData(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch("/core/settings/general/", formData);
      alert("Settings saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ color: '#0f172a', mb: 1 }}>
        General Settings
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        Configure the core platform branding and global switches.
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 2, maxWidth: 800 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth label="Platform Name" name="platform_name" value={formData.platform_name} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Support Email" name="support_email" type="email" value={formData.support_email} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Support Phone" name="support_phone" value={formData.support_phone} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Public Website URL" name="website_url" type="url" value={formData.website_url} onChange={handleChange} />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel 
                control={<Switch checked={formData.maintenance_mode} onChange={handleChange} name="maintenance_mode" color="error" />} 
                label="Enable Maintenance Mode (Platform-wide downtime)" 
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button variant="contained" type="submit" sx={{ mt: 2 }}>Save Settings</Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
