"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, TextField, Grid, CircularProgress, MenuItem } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function EditTenant() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "", slug: "", admin_email: "", school_type: "k12",
    contact_phone: "", address: "", status: "active"
  });

  useEffect(() => {
    api.get(`/platform/schools/${id}/`).then(res => {
      setFormData({
        name: res.name || "",
        slug: res.slug || "",
        admin_email: res.admin_email || "",
        school_type: res.school_type || "k12",
        contact_phone: res.contact_phone || "",
        address: res.address || "",
        status: res.status || "active"
      });
      setLoading(false);
    }).catch(err => {
      console.error(err);
      alert("Failed to load school data");
      router.push(`/platform/tenants/${id}`);
    });
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/platform/schools/${id}/`, formData);
      router.push(`/platform/tenants/${id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update school. Ensure slug is unique.");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Edit School / Tenant</Typography>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="School Name" name="name" value={formData.name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Tenant Slug (Code)" name="slug" value={formData.slug} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="email" label="Admin Email" name="admin_email" value={formData.admin_email} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="School Type" name="school_type" value={formData.school_type} onChange={handleChange}>
                <MenuItem value="k12">K-12 School</MenuItem>
                <MenuItem value="college">College</MenuItem>
                <MenuItem value="university">University</MenuItem>
                <MenuItem value="vocational">Vocational</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Contact Phone" name="contact_phone" value={formData.contact_phone} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Status" name="status" value={formData.status} onChange={handleChange}>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="trial">Trial</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Address" name="address" value={formData.address} onChange={handleChange} />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" type="submit">Save Changes</Button>
            <Button variant="outlined" onClick={() => router.push(`/platform/tenants/${id}`)}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
