"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, TextField, Grid, MenuItem, Switch, FormControlLabel, CircularProgress } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function EditPlatformUser() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: "", email: "", first_name: "", last_name: "", role: "",
    password: "", is_active: true, requires_2fa: false
  });

  useEffect(() => {
    api.get(`/platform/users/${id}/`).then(res => {
      setFormData({
        username: res.username || "",
        email: res.email || "",
        first_name: res.first_name || "",
        last_name: res.last_name || "",
        role: res.role || "super_admin",
        password: "", // Never fetch password
        is_active: res.is_active !== undefined ? res.is_active : true,
        requires_2fa: res.requires_2fa || false
      });
      setLoading(false);
    }).catch(err => {
      console.error(err);
      alert("Failed to load user");
      router.push('/platform/users');
    });
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password; // Don't send empty password
      await api.patch(`/platform/users/${id}/`, payload);
      router.push('/platform/users');
    } catch (err) {
      console.error(err);
      alert("Failed to update user.");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Edit Platform User</Typography>
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
              <TextField fullWidth type="password" label="New Password (Leave blank to keep unchanged)" name="password" value={formData.password} onChange={handleChange} />
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
            <Button variant="contained" type="submit">Update User</Button>
            <Button variant="outlined" onClick={() => router.push('/platform/users')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
