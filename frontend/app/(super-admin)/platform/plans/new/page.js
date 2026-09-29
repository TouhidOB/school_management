"use client";
import { useState } from "react";
import { 
  Box, Typography, Paper, Button, TextField, Grid, MenuItem, Switch, FormControlLabel
} from "@mui/material";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AddPlan() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "", plan_code: "", description: "", tier: "basic", currency: "USD",
    price_monthly: 0, price_yearly: 0, trial_days: 14,
    student_limit: "", teacher_limit: "", storage_limit_gb: 10, sms_limit: 1000,
    is_active: true, is_per_student: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (payload.student_limit === "") payload.student_limit = null;
    if (payload.teacher_limit === "") payload.teacher_limit = null;
    
    try {
      await api.post("/platform/billing/plans/", payload);
      router.push('/platform/plans');
    } catch (err) {
      console.error(err);
      alert("Failed to create plan.");
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Add Subscription Plan
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>General Info</Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Plan Name" name="name" value={formData.name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Plan Code" name="plan_code" value={formData.plan_code} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Description" name="description" value={formData.description} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Tier" name="tier" value={formData.tier} onChange={handleChange}>
                <MenuItem value="trial">Free Trial</MenuItem>
                <MenuItem value="basic">Basic</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="premium">Premium</MenuItem>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel 
                control={<Switch checked={formData.is_active} onChange={handleChange} name="is_active" />} 
                label="Is Active" 
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel 
                control={<Switch checked={formData.is_per_student} onChange={handleChange} name="is_per_student" />} 
                label="Per-Student Pricing" 
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Pricing</Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Currency" name="currency" value={formData.currency} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Monthly Price" name="price_monthly" value={formData.price_monthly} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Yearly Price" name="price_yearly" value={formData.price_yearly} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Trial Days" name="trial_days" value={formData.trial_days} onChange={handleChange} />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Limits (Leave blank for unlimited)</Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Student Limit" name="student_limit" value={formData.student_limit} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Teacher Limit" name="teacher_limit" value={formData.teacher_limit} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Storage Limit (GB)" name="storage_limit_gb" value={formData.storage_limit_gb} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="SMS Limit" name="sms_limit" value={formData.sms_limit} onChange={handleChange} />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" type="submit">Save Plan</Button>
            <Button variant="outlined" onClick={() => router.push('/platform/plans')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
