"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, TextField, Grid, MenuItem, CircularProgress } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function EditTransaction() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [formData, setFormData] = useState({
    transaction_id: "", school: "", invoice: "", amount: 0, currency: "BDT",
    payment_method: "", status: "pending", gateway_transaction_id: ""
  });

  useEffect(() => {
    Promise.all([
      api.get("/platform/schools/"),
      api.get("/platform/billing/invoices/"),
      api.get(`/platform/billing/transactions/${id}/`)
    ]).then(([schoolsRes, invRes, trxRes]) => {
      setSchools(schoolsRes.results || schoolsRes);
      setInvoices(invRes.results || invRes);
      setFormData({
        transaction_id: trxRes.transaction_id,
        school: trxRes.school,
        invoice: trxRes.invoice,
        amount: trxRes.amount,
        currency: trxRes.currency,
        payment_method: trxRes.payment_method,
        gateway_transaction_id: trxRes.gateway_transaction_id,
        status: trxRes.status
      });
      setLoading(false);
    });
  }, [id]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/platform/billing/transactions/${id}/`, formData);
      router.push('/platform/transactions');
    } catch (err) {
      console.error(err);
      alert("Failed to update transaction.");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Edit Transaction</Typography>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Transaction ID" name="transaction_id" value={formData.transaction_id} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="School" name="school" value={formData.school} onChange={handleChange} required>
                {schools.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Invoice" name="invoice" value={formData.invoice} onChange={handleChange} required>
                {invoices.map(i => <MenuItem key={i.id} value={i.id}>{i.invoice_number}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Amount" name="amount" value={formData.amount} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Currency" name="currency" value={formData.currency} onChange={handleChange}>
                <MenuItem value="BDT">BDT</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Payment Method" name="payment_method" value={formData.payment_method} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Gateway Transaction ID" name="gateway_transaction_id" value={formData.gateway_transaction_id} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Status" name="status" value={formData.status} onChange={handleChange}>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="succeeded">Succeeded</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" type="submit">Update</Button>
            <Button variant="outlined" onClick={() => router.push('/platform/transactions')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
