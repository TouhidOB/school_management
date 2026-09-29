"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, TextField, Grid, MenuItem, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AddSubscription() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    school: "", plan: "", billing_cycle: "monthly", status: "active"
  });

  useEffect(() => {
    Promise.all([
      api.get("/platform/schools/"),
      api.get("/platform/billing/plans/")
    ]).then(([schoolsRes, plansRes]) => {
      setSchools(schoolsRes.results || schoolsRes);
      setPlans(plansRes.results || plansRes);
      setLoading(false);
    });
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/platform/billing/subscriptions/", formData);
      router.push('/platform/subscriptions');
    } catch (err) {
      console.error(err);
      alert("Failed to create subscription.");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Add Subscription</Typography>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="School" name="school" value={formData.school} onChange={handleChange} required>
                {schools.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Plan" name="plan" value={formData.plan} onChange={handleChange} required>
                {plans.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Billing Cycle" name="billing_cycle" value={formData.billing_cycle} onChange={handleChange}>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Status" name="status" value={formData.status} onChange={handleChange}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="past_due">Past Due</MenuItem>
                <MenuItem value="canceled">Canceled</MenuItem>
                <MenuItem value="unpaid">Unpaid</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" type="submit">Save</Button>
            <Button variant="outlined" onClick={() => router.push('/platform/subscriptions')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
