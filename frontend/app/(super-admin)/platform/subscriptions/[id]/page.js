"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, TextField, Grid, MenuItem, CircularProgress } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function EditSubscription() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    school: "", plan: "", billing_cycle: "monthly", status: "active"
  });

  useEffect(() => {
    Promise.all([
      api.get("/platform/schools/"),
      api.get("/platform/billing/plans/"),
      api.get(`/platform/billing/subscriptions/${id}/`)
    ]).then(([schoolsRes, plansRes, subRes]) => {
      setSchools(schoolsRes.results || schoolsRes);
      setPlans(plansRes.results || plansRes);
      setFormData({
        school: subRes.school,
        plan: subRes.plan,
        billing_cycle: subRes.billing_cycle,
        status: subRes.status
      });
      setLoading(false);
    });
  }, [id]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/platform/billing/subscriptions/${id}/`, formData);
      router.push('/platform/subscriptions');
    } catch (err) {
      console.error(err);
      alert("Failed to update subscription.");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Edit Subscription</Typography>
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
            <Button variant="contained" type="submit">Update</Button>
            <Button variant="outlined" onClick={() => router.push('/platform/subscriptions')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
