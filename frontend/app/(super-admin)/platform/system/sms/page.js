"use client";
import { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Grid, TextField, Button, MenuItem 
} from "@mui/material";
import { api } from "@/lib/api";

export default function SMSSettingsPage() {
  const [formData, setFormData] = useState({
    provider: "", api_url: "", api_key: "", api_secret: "",
    sender_id: "", default_country_code: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/core/settings/sms/");
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
      await api.patch("/core/settings/sms/", formData);
      alert("Settings saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ color: '#0f172a', mb: 1 }}>
        SMS Gateway Settings
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        Configure the global platform SMS provider.
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 2, maxWidth: 800 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Provider" name="provider" value={formData.provider} onChange={handleChange}>
                <MenuItem value="twilio">Twilio</MenuItem>
                <MenuItem value="nexmo">Nexmo / Vonage</MenuItem>
                <MenuItem value="msg91">Msg91</MenuItem>
                <MenuItem value="custom">Custom API</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Sender ID" name="sender_id" value={formData.sender_id} onChange={handleChange} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField fullWidth label="API URL (For custom)" name="api_url" value={formData.api_url} onChange={handleChange} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="API Key / SID" name="api_key" value={formData.api_key} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="API Secret / Token" name="api_secret" type="password" value={formData.api_secret} onChange={handleChange} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Default Country Code" name="default_country_code" value={formData.default_country_code} onChange={handleChange} placeholder="+1" />
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
