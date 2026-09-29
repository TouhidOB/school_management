"use client";
import { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Grid, TextField, Button, MenuItem 
} from "@mui/material";
import { api } from "@/lib/api";

export default function EmailSettingsPage() {
  const [formData, setFormData] = useState({
    smtp_host: "", smtp_port: 587, smtp_username: "", smtp_password: "",
    encryption: "TLS", from_name: "", from_email: "", reply_to_email: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/core/settings/email/");
      setFormData(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch("/core/settings/email/", formData);
      alert("Settings saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ color: '#0f172a', mb: 1 }}>
        Email SMTP Settings
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        Configure the global platform email server for sending transactional emails.
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 2, maxWidth: 800 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="SMTP Host" name="smtp_host" value={formData.smtp_host} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="SMTP Port" name="smtp_port" type="number" value={formData.smtp_port} onChange={handleChange} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="SMTP Username" name="smtp_username" value={formData.smtp_username} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="SMTP Password" name="smtp_password" type="password" value={formData.smtp_password} onChange={handleChange} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField fullWidth select label="Encryption" name="encryption" value={formData.encryption} onChange={handleChange}>
                <MenuItem value="TLS">TLS</MenuItem>
                <MenuItem value="SSL">SSL</MenuItem>
                <MenuItem value="NONE">None</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={8}></Grid>

            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="From Name" name="from_name" value={formData.from_name} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="From Email" name="from_email" type="email" value={formData.from_email} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Reply-To Email" name="reply_to_email" type="email" value={formData.reply_to_email} onChange={handleChange} />
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
