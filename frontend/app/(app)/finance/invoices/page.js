"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, TextField, FormControl, InputLabel, Select, MenuItem,
  IconButton, CircularProgress, Alert, Stack, Tooltip, InputAdornment
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReceiptIcon from "@mui/icons-material/Receipt";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all"); // 'all', 'today', 'yesterday', 'this_week', 'this_month', 'specific'
  const [specificDate, setSpecificDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form dependencies
  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // New Invoice State
  const [formData, setFormData] = useState({
    student: "",
    academic_year: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    line_items: [{ description: "", amount: 0 }],
    total_discount: 0,
    late_fine: 0,
  });

  const handleOpen = () => {
    setFormData({
      student: "",
      academic_year: academicYears[0]?.id || "",
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: "",
      line_items: [{ description: "", amount: 0 }],
      total_discount: 0,
      late_fine: 0,
    });
    setErrorMsg("");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/invoices/?page_size=1000");
      setInvoices(res.results || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [studRes, yearRes] = await Promise.all([
        api.get("/students/?page_size=1000&status=active"),
        api.get("/academic-years/?page_size=50")
      ]);
      setStudents(studRes.results || studRes);
      setAcademicYears(yearRes.results || yearRes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadDependencies();
  }, []);

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, { description: "", amount: 0 }]
    }));
  };

  const removeLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.line_items];
      newItems[index][field] = value;
      return { ...prev, line_items: newItems };
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
    const discount = parseFloat(formData.total_discount) || 0;
    const fine = parseFloat(formData.late_fine) || 0;
    const grandTotal = subtotal - discount + fine;
    return { subtotal, grandTotal };
  };

  const handleSubmit = async () => {
    if (!formData.student || !formData.academic_year || !formData.invoice_date) {
      setErrorMsg("Student, Academic Year, and Invoice Date are required.");
      return;
    }
    
    // Ensure all line items have amounts and desc
    for (let item of formData.line_items) {
      if (!item.description || item.amount <= 0) {
        setErrorMsg("All line items must have a description and an amount > 0.");
        return;
      }
    }

    setSaving(true);
    setErrorMsg("");

    const { subtotal, grandTotal } = calculateTotals();
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;

    try {
      await api.post("/invoices/", {
        ...formData,
        invoice_number: invoiceNum,
        subtotal: subtotal.toFixed(2),
        grand_total: grandTotal.toFixed(2),
        status: "draft"
      });
      setOpen(false);
      loadInvoices();
    } catch (err) {
      if (err.data) {
        setErrorMsg(Object.entries(err.data).map(([k, v]) => `${k}: ${v}`).join(', '));
      } else {
        setErrorMsg("Failed to generate invoice.");
      }
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (amount) => {
    return '৳' + parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partially_paid': return 'warning';
      case 'sent': return 'info';
      case 'overdue': return 'error';
      case 'cancelled': return 'default';
      default: return 'primary';
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    let totalCount = invoices.length;
    let totalBilled = 0;
    let totalPaid = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    invoices.forEach(inv => {
      const grand = parseFloat(inv.grand_total) || 0;
      totalBilled += grand;
      const pAmt = (inv.payments || []).reduce((acc, p) => acc + (parseFloat(p.amount_paid) || 0), 0);
      totalPaid += pAmt;
      if (inv.status === 'paid') {
        paidCount++;
      } else {
        unpaidCount++;
      }
    });

    return {
      totalCount,
      totalBilled,
      totalPaid,
      totalDue: Math.max(0, totalBilled - totalPaid),
      paidCount,
      unpaidCount
    };
  }, [invoices]);

  // Filtered invoices with Day-wise filtering
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

    const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    return invoices.filter(inv => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) ||
        (inv.student_name && inv.student_name.toLowerCase().includes(q)) ||
        (inv.student_roll && String(inv.student_roll).toLowerCase().includes(q)) ||
        (inv.student_class && inv.student_class.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

      // Day-wise filter match
      let matchesDay = true;
      const invDate = inv.invoice_date || "";
      if (dayFilter === "today") {
        matchesDay = invDate === todayStr;
      } else if (dayFilter === "yesterday") {
        matchesDay = invDate === yesterdayStr;
      } else if (dayFilter === "this_week") {
        matchesDay = invDate >= startOfWeekStr && invDate <= todayStr;
      } else if (dayFilter === "this_month") {
        matchesDay = invDate >= startOfMonthStr && invDate <= todayStr;
      } else if (dayFilter === "specific" && specificDate) {
        matchesDay = invDate === specificDate;
      }

      return matchesSearch && matchesStatus && matchesDay;
    });
  }, [invoices, searchQuery, statusFilter, dayFilter, specificDate]);

  const { subtotal, grandTotal } = calculateTotals();

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header & Main Action */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: "#1e293b", display: "flex", alignItems: "center", gap: 1 }}>
            <ReceiptIcon color="primary" /> Invoices & Billing Ledger
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage student fee bills, monitor payment clearance, and print official receipts.
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpen} sx={{ textTransform: "none", fontWeight: "bold" }}>
          Create Custom Invoice
        </Button>
      </Box>

      {/* KPI Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Total Invoices
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#dbeafe", color: "#0284c7", display: "flex" }}>
                  <ReceiptIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a" }}>
                {metrics.totalCount} <Typography component="span" variant="body2" color="text.secondary">invoices</Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Across active academic terms
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Total Billed
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#e0e7ff", color: "#4f46e5", display: "flex" }}>
                  <MonetizationOnIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a" }}>
                {formatMoney(metrics.totalBilled)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cumulative invoice grand total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Collected (Paid)
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#dcfce7", color: "#16a34a", display: "flex" }}>
                  <CheckCircleOutlineIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#15803d" }}>
                {formatMoney(metrics.totalPaid)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {metrics.paidCount} fully cleared invoice(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Outstanding Due
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#fee2e2", color: "#dc2626", display: "flex" }}>
                  <WarningAmberIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#dc2626" }}>
                {formatMoney(metrics.totalDue)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {metrics.unpaidCount} unpaid or partial invoice(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Ledger Card */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: "hidden" }}>
        {/* Search & Day-wise Filter Toolbar */}
        <Box sx={{ p: 2, bgcolor: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3.5}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by student, roll, or invoice #..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Day-wise Filter */}
            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Day / Date Filter</InputLabel>
                <Select
                  value={dayFilter}
                  label="Day / Date Filter"
                  onChange={(e) => {
                    setDayFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Dates</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="yesterday">Yesterday</MenuItem>
                  <MenuItem value="this_week">This Week</MenuItem>
                  <MenuItem value="this_month">This Month</MenuItem>
                  <MenuItem value="specific">Specific Day...</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Specific Day Picker (when 'specific' selected) */}
            {dayFilter === "specific" && (
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Pick Date"
                  type="date"
                  value={specificDate}
                  onChange={(e) => {
                    setSpecificDate(e.target.value);
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}

            <Grid item xs={6} sm={3} md={dayFilter === "specific" ? 2.5 : 3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Statuses ({invoices.length})</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="sent">Sent / Pending</MenuItem>
                  <MenuItem value="partially_paid">Partially Paid</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3} md={1} sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Tooltip title="Reset Filters">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setDayFilter("all");
                      setSpecificDate("");
                      setPage(0);
                    }}
                    disabled={!searchQuery && statusFilter === "all" && dayFilter === "all" && !specificDate}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>

        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Invoice Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Due Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Subtotal</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Grand Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "#15803d" }}>Paid Amount</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "#dc2626" }}>Balance Due</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: "#475569", width: 140 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading invoices...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    <Typography variant="body1" fontWeight="bold">No invoices found matching your criteria.</Typography>
                    <Typography variant="body2">Try adjusting your day filter, search query, or status.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((inv) => {
                    const paidAmount = (inv.payments || []).reduce((acc, p) => acc + (parseFloat(p.amount_paid) || 0), 0);
                    const grandTotal = parseFloat(inv.grand_total) || 0;
                    const balanceDue = Math.max(0, grandTotal - paidAmount);

                    return (
                      <TableRow key={inv.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>{inv.invoice_number}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="600" sx={{ color: "#0f172a" }}>
                              {inv.student_name}
                            </Typography>
                            {(inv.student_class || inv.student_roll) && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {inv.student_class ? `Class: ${inv.student_class}` : ''}
                                {inv.student_class && inv.student_roll ? ' · ' : ''}
                                {inv.student_roll ? `Roll: ${inv.student_roll}` : ''}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: "#475569" }}>{inv.invoice_date}</TableCell>
                        <TableCell sx={{ color: new Date(inv.due_date) < new Date() && inv.status !== 'paid' ? 'error.main' : '#475569' }}>
                          {inv.due_date || "—"}
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#475569" }}>{formatMoney(inv.subtotal)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: "#0f172a", fontFamily: "monospace" }}>
                          {formatMoney(inv.grand_total)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: '600', color: "#15803d", fontFamily: "monospace" }}>
                          {formatMoney(paidAmount)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: balanceDue > 0 ? "#dc2626" : "#15803d", fontFamily: "monospace" }}>
                          {formatMoney(balanceDue)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={inv.status.replace('_', ' ').toUpperCase()} 
                            size="small" 
                            color={getStatusColor(inv.status)} 
                            sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            component="a"
                            href={`/print/invoice/${inv.id}/receipt`}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<PrintIcon />}
                            sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem", py: 0.3, px: 1.2 }}
                          >
                            Print Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table Pagination */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredInvoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ borderTop: "1px solid #f1f5f9" }}
        />
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Generate Manual Invoice</Typography>
          <IconButton onClick={() => setOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Student</InputLabel>
                <Select
                  value={formData.student}
                  label="Student"
                  onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                >
                  {students.map(s => <MenuItem key={s.id} value={s.id}>{s.full_name} (Roll: {s.roll_number})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={formData.academic_year}
                  label="Academic Year"
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                >
                  {academicYears.map(y => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth size="small" label="Invoice Date" type="date"
                InputLabelProps={{ shrink: true }} required
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth size="small" label="Due Date" type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Line Items (Fees)</Typography>
              {formData.line_items.map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField 
                    fullWidth size="small" label="Description" placeholder="e.g. Tuition Fee"
                    value={item.description}
                    onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                  />
                  <TextField 
                    size="small" label="Amount (৳)" type="number" sx={{ minWidth: 150 }}
                    value={item.amount}
                    onChange={(e) => updateLineItem(idx, 'amount', e.target.value)}
                  />
                  <IconButton color="error" onClick={() => removeLineItem(idx)} disabled={formData.line_items.length === 1}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button size="small" startIcon={<AddIcon />} onClick={addLineItem}>Add Another Item</Button>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField 
                      fullWidth size="small" label="Total Discount (৳)" type="number"
                      value={formData.total_discount}
                      onChange={(e) => setFormData({ ...formData, total_discount: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField 
                      fullWidth size="small" label="Late Fine (৳)" type="number"
                      value={formData.late_fine}
                      onChange={(e) => setFormData({ ...formData, late_fine: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary">Subtotal: {formatMoney(subtotal)}</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">Grand Total: {formatMoney(grandTotal)}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? "Generating..." : "Generate Invoice"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
