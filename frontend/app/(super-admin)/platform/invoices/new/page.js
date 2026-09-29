"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, TextField, Grid, MenuItem, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AddInvoice() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [formData, setFormData] = useState({
    invoice_number: `INV-${Date.now()}`, school: "", subscription: "", total: 0, status: "open",
    due_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    Promise.all([
      api.get("/platform/schools/"),
      api.get("/platform/billing/subscriptions/")
    ]).then(([schoolsRes, subRes]) => {
      setSchools(schoolsRes.results || schoolsRes);
      setSubscriptions(subRes.results || subRes);
      setLoading(false);
    });
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.subscription) payload.subscription = null;
      
      // Auto-calculate missing backend fields required by the Django model
      payload.subtotal = payload.total;
      payload.due_amount = payload.status === "paid" ? 0 : payload.total;
      payload.paid_amount = payload.status === "paid" ? payload.total : 0;
      
      const today = new Date().toISOString();
      payload.billing_period_start = today;
      payload.billing_period_end = payload.due_date ? new Date(payload.due_date).toISOString() : today;

      await api.post("/platform/billing/invoices/", payload);
      router.push('/platform/invoices');
    } catch (err) {
      console.error(err);
      alert("Failed to create invoice.");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Generate Invoice</Typography>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Invoice Number" name="invoice_number" value={formData.invoice_number} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="School" name="school" value={formData.school} onChange={handleChange} required>
                {schools.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Total (BDT)" name="total" value={formData.total} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Due Date" InputLabelProps={{ shrink: true }} name="due_date" value={formData.due_date} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Status" name="status" value={formData.status} onChange={handleChange}>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="void">Void</MenuItem>
                <MenuItem value="uncollectible">Uncollectible</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" type="submit">Save Invoice</Button>
            <Button variant="outlined" onClick={() => router.push('/platform/invoices')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
