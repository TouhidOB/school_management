"use client";
import { useState } from "react";
import { Box, Typography, Paper, Button, TextField, Grid, MenuItem, Switch, FormControlLabel } from "@mui/material";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AddPlatformUser() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "", email: "", first_name: "", last_name: "", role: "super_admin",
    password: "", is_active: true, requires_2fa: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/platform/users/", formData);
      router.push('/platform/users');
    } catch (err) {
      console.error(err);
      alert("Failed to create user. Ensure username/email are unique.");
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Add Platform User</Typography>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Username" name="username" value={formData.username} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="email" label="Email" name="email" value={formData.email} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="password" label="Password (Leave blank for default: defaultpassword123)" name="password" value={formData.password} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Role" name="role" value={formData.role} onChange={handleChange}>
                <MenuItem value="super_admin">Super Admin</MenuItem>
                <MenuItem value="staff">Platform Staff</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel control={<Switch checked={formData.is_active} onChange={handleChange} name="is_active" />} label="Active" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel control={<Switch checked={formData.requires_2fa} onChange={handleChange} name="requires_2fa" />} label="Require 2FA" />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" type="submit">Save User</Button>
            <Button variant="outlined" onClick={() => router.push('/platform/users')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
