"use client";

// Invoice list + a simple create form + record-payment action. The backend
// `pay` action re-totals and flips status to paid/partial automatically.
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import PaymentsIcon from '@mui/icons-material/Payments';

const STATUS_COLOR = {
  paid: "success",
  partial: "info",
  sent: "primary",
  draft: "default",
  overdue: "error",
  cancelled: "default",
};

export default function InvoicesTab() {
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ student: "", invoice_number: "", invoice_date: new Date().toISOString().slice(0, 10), due_date: "", amount: "", label: "Tuition fee" });
  const [error, setError] = useState("");

  function load() {
    api.get("/invoices/?page_size=200").then((d) => setRows(d.results || d)).catch(() => setRows([]));
  }
  useEffect(() => {
    load();
    api.get("/students/?page_size=500").then((d) => setStudents(d.results || d)).catch(() => {});
  }, []);

  async function create(e) {
    e.preventDefault();
    setError("");
    const amount = Number(form.amount) || 0;
    const payload = {
      student: form.student,
      invoice_number: form.invoice_number || `INV-${Date.now()}`,
      invoice_date: form.invoice_date,
      due_date: form.due_date || null,
      line_items: [{ label: form.label, amount }],
      subtotal: amount,
      grand_total: amount,
      status: "sent",
    };
    try {
      await api.post("/invoices/", payload);
      setCreating(false);
      setForm({ ...form, student: "", invoice_number: "", amount: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function pay(inv) {
    const amt = prompt(`Payment amount for ${inv.invoice_number} (due ৳${inv.grand_total}):`);
    if (!amt) return;
    await api.post(`/invoices/${inv.id}/pay/`, { amount_paid: Number(amt), payment_method: "cash" });
    load();
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">Invoices</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setCreating((c) => !c)}
          size="small"
        >
          New invoice
        </Button>
      </Box>

      {creating && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <CardContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={create}>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Student"
                    value={form.student}
                    onChange={(e) => setForm({ ...form, student: e.target.value })}
                    required
                  >
                    <MenuItem value=""><em>—</em></MenuItem>
                    {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.full_name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Invoice #"
                    value={form.invoice_number}
                    onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                    placeholder="auto"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Item label"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    label="Amount ৳"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button type="submit" variant="contained" fullWidth>Create</Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small" hover>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No invoices.</TableCell></TableRow>
              ) : rows.map((inv) => (
                <TableRow key={inv.id} hover>
                  <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{inv.invoice_number}</Typography></TableCell>
                  <TableCell>{inv.student_name}</TableCell>
                  <TableCell>৳{inv.grand_total}</TableCell>
                  <TableCell>
                    <Chip 
                      label={inv.status_display || inv.status} 
                      color={STATUS_COLOR[inv.status] || "default"} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      component="a" 
                      href={`/print/invoice/${inv.id}/receipt`} 
                      target="_blank" 
                      rel="noreferrer" 
                      size="small" 
                      color="primary" 
                      title="Receipt"
                    >
                      <PrintIcon fontSize="small" />
                    </IconButton>
                    {inv.status !== "paid" && inv.status !== "cancelled" && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="success" 
                        onClick={() => pay(inv)}
                        startIcon={<PaymentsIcon />}
                        sx={{ ml: 1 }}
                      >
                        Record payment
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
