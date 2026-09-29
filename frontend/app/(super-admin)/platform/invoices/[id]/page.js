"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, TextField, Grid, MenuItem, CircularProgress } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function EditInvoice() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    invoice_number: "", school: "", total: 0, status: "open", due_date: ""
  });

  useEffect(() => {
    Promise.all([
      api.get("/platform/schools/"),
      api.get(`/platform/billing/invoices/${id}/`)
    ]).then(([schoolsRes, invRes]) => {
      setSchools(schoolsRes.results || schoolsRes);
      setFormData({
        invoice_number: invRes.invoice_number,
        school: invRes.school,
        total: invRes.total,
        status: invRes.status,
        due_date: invRes.due_date ? invRes.due_date.split('T')[0] : ""
      });
      setLoading(false);
    });
  }, [id]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/platform/billing/invoices/${id}/`, formData);
      router.push('/platform/invoices');
    } catch (err) {
      console.error(err);
      alert("Failed to update invoice.");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Edit Invoice</Typography>
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
            <Button variant="contained" type="submit">Update Invoice</Button>
            <Button variant="outlined" onClick={() => router.push('/platform/invoices')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
