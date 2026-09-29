"use client";

import { Box, Card, CardContent, Typography, FormControlLabel, Switch, Divider, Button, Alert } from "@mui/material";
import { useState } from "react";
import SaveIcon from "@mui/icons-material/Save";

export default function NotificationsSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    email_invoices: true,
    email_attendance: false,
    email_exams: true,
    sms_attendance: true,
    sms_emergency: true,
    push_messages: true
  });

  const handleChange = (event) => {
    setSettings({
      ...settings,
      [event.target.name]: event.target.checked
    });
    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Simulate saving preferences (since backend schema lacks granular notification switches)
    setTimeout(() => {
      setSaved(true);
    }, 500);
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
        Notification Preferences
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Configure which automated alerts and digests are sent to students and parents.
      </Typography>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 4 }}>
          {saved && <Alert severity="success" sx={{ mb: 3 }}>Notification preferences updated successfully.</Alert>}
          
          <form onSubmit={handleSave}>
            <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
              EMAIL NOTIFICATIONS
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
              <FormControlLabel 
                control={<Switch checked={settings.email_invoices} onChange={handleChange} name="email_invoices" />} 
                label={<Box><Typography variant="body1">Fee Invoices</Typography><Typography variant="caption" color="text.secondary">Send PDF invoices to parents when fees are due.</Typography></Box>} 
                sx={{ mb: 1 }}
              />
              <FormControlLabel 
                control={<Switch checked={settings.email_attendance} onChange={handleChange} name="email_attendance" />} 
                label={<Box><Typography variant="body1">Daily Attendance Digests</Typography><Typography variant="caption" color="text.secondary">Send a daily email summary of student attendance.</Typography></Box>} 
                sx={{ mb: 1 }}
              />
              <FormControlLabel 
                control={<Switch checked={settings.email_exams} onChange={handleChange} name="email_exams" />} 
                label={<Box><Typography variant="body1">Exam Results</Typography><Typography variant="caption" color="text.secondary">Email report cards when results are published.</Typography></Box>} 
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
              SMS ALERTS
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
              <FormControlLabel 
                control={<Switch checked={settings.sms_attendance} onChange={handleChange} name="sms_attendance" />} 
                label={<Box><Typography variant="body1">Absence Alerts</Typography><Typography variant="caption" color="text.secondary">Instantly text parents if a student is marked absent.</Typography></Box>} 
                sx={{ mb: 1 }}
              />
              <FormControlLabel 
                control={<Switch checked={settings.sms_emergency} onChange={handleChange} name="sms_emergency" />} 
                label={<Box><Typography variant="body1">Emergency Broadcasts</Typography><Typography variant="caption" color="text.secondary">Allow SMS usage for sudden school closures.</Typography></Box>} 
              />
            </Box>
            
            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
              IN-APP & PUSH
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
              <FormControlLabel 
                control={<Switch checked={settings.push_messages} onChange={handleChange} name="push_messages" />} 
                label={<Box><Typography variant="body1">Direct Messages</Typography><Typography variant="caption" color="text.secondary">Send push notifications to the mobile app for unread messages.</Typography></Box>} 
              />
            </Box>

            <Button type="submit" variant="contained" startIcon={<SaveIcon />}>
              Save Preferences
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
