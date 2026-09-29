"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, TextField, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, Grid, FormControl, InputLabel, Select, MenuItem, InputAdornment, IconButton, Stack, 
  Tooltip, CircularProgress, Alert
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PaidIcon from "@mui/icons-material/Paid";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";

export default function StudentDuesPage() {
  const router = useRouter();

  const [studentsData, setStudentsData] = useState([]);
  const [summary, setSummary] = useState({
    total_students: 0,
    pending_count: 0,
    paid_count: 0,
    total_billed: 0,
    total_paid: 0,
    total_due: 0
  });

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'paid'
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Pay Now Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  // Load Classes
  useEffect(() => {
    api.get("/classes/?page_size=200").then(res => setClasses(res.results || res || [])).catch(() => {});
  }, []);

  // Load Sections when class changes
  useEffect(() => {
    if (selectedClass && selectedClass !== "all") {
      api.get(`/sections/?school_class=${selectedClass}&page_size=200`)
        .then(res => setSections(res.results || res || []))
        .catch(() => setSections([]));
    } else {
      setSections([]);
      setSelectedSection("all");
    }
  }, [selectedClass]);

  // Load Student Dues
  const loadStudentDues = async () => {
    setLoading(true);
    try {
      let url = `/student-dues/?`;
      const params = [];
      if (selectedClass && selectedClass !== "all") params.push(`class=${selectedClass}`);
      if (selectedSection && selectedSection !== "all") params.push(`section=${selectedSection}`);
      if (statusFilter && statusFilter !== "all") params.push(`status=${statusFilter}`);
      if (searchQuery.trim()) params.push(`search=${encodeURIComponent(searchQuery.trim())}`);

      url += params.join("&");
      const res = await api.get(url);
      setStudentsData(res.results || []);
      if (res.summary) setSummary(res.summary);
    } catch (err) {
      console.error("Failed to load student dues", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentDues();
  }, [selectedClass, selectedSection, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    loadStudentDues();
  };

  const openPayNow = (stud) => {
    setActiveStudent(stud);
    setAmountPaid(stud.due_amount?.toString() || "");
    setPaymentMethod("cash");
    setTransactionId("");
    setPaidAt(new Date().toISOString().split("T")[0]);
    setPayError("");
    setPayModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!activeStudent || !amountPaid || parseFloat(amountPaid) <= 0) {
      setPayError("Please enter a valid payment amount greater than 0.");
      return;
    }

    setPaying(true);
    setPayError("");

    try {
      const res = await api.post(`/student-dues/${activeStudent.id}/pay_due/`, {
        amount_paid: parseFloat(amountPaid),
        payment_method: paymentMethod,
        transaction_id: transactionId,
        paid_at: paidAt
      });

      setPayModalOpen(false);

      // Redirect immediately to the printable payment slip as requested
      const targetStudentId = res.student_id || activeStudent?.id;
      if (targetStudentId) {
        window.open(`/print/student/${targetStudentId}/due-slip`, "_blank");
      }

      loadStudentDues();
    } catch (err) {
      setPayError(err.data?.error || "Failed to process payment. Please check your inputs.");
    } finally {
      setPaying(false);
    }
  };

  const formatMoney = (val) => {
    return '৳' + parseFloat(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <Box>
      {/* Title & Description */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a" }}>
          Student Overall Pending Amount & Fee Collection
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track outstanding dues per student roll and ID. Click &apos;Pay Now&apos; to collect dues and instantly print the official payment slip.
        </Typography>
      </Box>

      {/* 4 Financial Summary KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                  Active Students
                </Typography>
                <PeopleAltIcon fontSize="small" sx={{ color: "#4f46e5" }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a" }}>
                {summary.total_students}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {summary.pending_count} with pending dues
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                  Total Invoiced
                </Typography>
                <MonetizationOnIcon fontSize="small" sx={{ color: "#0284c7" }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a" }}>
                {formatMoney(summary.total_billed)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total fees billed to date
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                  Total Collected
                </Typography>
                <CheckCircleOutlineIcon fontSize="small" sx={{ color: "#16a34a" }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#15803d" }}>
                {formatMoney(summary.total_paid)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {summary.paid_count} students fully cleared
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                  Total Pending Due
                </Typography>
                <WarningAmberIcon fontSize="small" sx={{ color: "#dc2626" }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#dc2626" }}>
                {formatMoney(summary.total_due)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Outstanding balance to collect
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table Card */}
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, overflow: "hidden" }}>
        {/* Filters Toolbar */}
        <Box sx={{ p: 2.5, bgcolor: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search Input */}
            <Grid item xs={12} sm={6} md={4}>
              <form onSubmit={handleSearchSubmit}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by Roll, Student ID, or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    )
                  }}
                />
              </form>
            </Grid>

            {/* Class Filter */}
            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  label="Class"
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Classes</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Section Filter */}
            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small" disabled={!selectedClass || selectedClass === "all"}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={selectedSection}
                  label="Section"
                  onChange={(e) => {
                    setSelectedSection(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Sections</MenuItem>
                  {sections.map((sec) => (
                    <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Status Filter */}
            <Grid item xs={8} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Students</MenuItem>
                  <MenuItem value="pending">Pending Dues</MenuItem>
                  <MenuItem value="paid">Fully Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Refresh Button */}
            <Grid item xs={4} sm={2} md={1} sx={{ textAlign: "right" }}>
              <IconButton onClick={loadStudentDues} color="primary" title="Refresh Table">
                <RefreshIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Box>

        {/* Student Dues Ledger Table */}
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 80 }}>Roll #</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 140 }}>Student ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Class & Section</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Due Amount (BDT)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, width: 120 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, width: 220 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading student dues records...</Typography>
                  </TableCell>
                </TableRow>
              ) : studentsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    <Typography variant="body1" fontWeight="bold">No students found matching your criteria.</Typography>
                    <Typography variant="body2">Try adjusting your filters or search query.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                studentsData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((stud) => {
                    const hasDue = stud.due_amount > 0;
                    return (
                      <TableRow key={stud.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: "#1e293b" }}>
                          {stud.roll_number}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontWeight: 600, color: "#4f46e5" }}>
                          {stud.student_id}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#0f172a" }}>
                          {stud.full_name}
                        </TableCell>
                        <TableCell sx={{ color: "#475569" }}>
                          {stud.class_name} {stud.section_name !== "—" ? `(${stud.section_name})` : ""}
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            fontWeight: "bold", 
                            fontFamily: "monospace", 
                            fontSize: "0.95rem",
                            color: hasDue ? "#dc2626" : "#15803d" 
                          }}
                        >
                          {formatMoney(stud.due_amount)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={hasDue ? "PENDING" : "PAID"}
                            size="small"
                            color={hasDue ? "error" : "success"}
                            sx={{ fontWeight: "bold", fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<PaidIcon />}
                              disabled={!hasDue}
                              onClick={() => openPayNow(stud)}
                              sx={{ 
                                textTransform: "none", 
                                fontWeight: "bold", 
                                fontSize: "0.75rem", 
                                py: 0.4, 
                                px: 1.5 
                              }}
                            >
                              Pay Now
                            </Button>

                            <Button
                              component="a"
                              href={`/print/student/${stud.id}/due-slip`}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<PrintIcon />}
                              sx={{ 
                                textTransform: "none", 
                                fontWeight: 600, 
                                fontSize: "0.75rem", 
                                py: 0.4 
                              }}
                            >
                              Slip
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={studentsData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Pay Now Modal */}
      <Dialog open={payModalOpen} onClose={() => setPayModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Collect Fee Payment</span>
          <IconButton size="small" onClick={() => setPayModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {payError && <Alert severity="error" sx={{ mb: 2 }}>{payError}</Alert>}

          {activeStudent && (
            <Stack spacing={2.5}>
              {/* Student Details Summary Box */}
              <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Student Name</Typography>
                    <Typography variant="body2" fontWeight="bold">{activeStudent.full_name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Student ID & Roll</Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: "monospace" }}>
                      {activeStudent.student_id} · Roll: {activeStudent.roll_number}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Class & Section</Typography>
                    <Typography variant="body2">{activeStudent.class_name} {activeStudent.section_name !== "—" ? `(${activeStudent.section_name})` : ""}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Total Outstanding Due</Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ color: "#dc2626", fontFamily: "monospace" }}>
                      {formatMoney(activeStudent.due_amount)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Pending Invoices List */}
              {activeStudent.pending_invoices && activeStudent.pending_invoices.length > 0 && (
                <Box>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Pending Invoice Breakdown ({activeStudent.pending_invoices.length})
                  </Typography>
                  <Box sx={{ mt: 1, border: "1px solid #e2e8f0", borderRadius: 1.5, overflow: "hidden" }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                        <TableRow>
                          <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Invoice #</TableCell>
                          <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Date</TableCell>
                          <TableCell align="right" sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Total</TableCell>
                          <TableCell align="right" sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Due</TableCell>
                          <TableCell align="center" sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Print</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeStudent.pending_invoices.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600 }}>{inv.invoice_number}</TableCell>
                            <TableCell sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{inv.invoice_date}</TableCell>
                            <TableCell align="right" sx={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{formatMoney(inv.grand_total)}</TableCell>
                            <TableCell align="right" sx={{ fontSize: "0.75rem", fontWeight: "bold", color: "#dc2626", fontFamily: "monospace" }}>
                              {formatMoney(inv.due_amount)}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                component="a"
                                href={`/print/invoice/${inv.id}/receipt`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Print Single Invoice Slip"
                                sx={{ p: 0.3 }}
                              >
                                <PrintIcon sx={{ fontSize: "1.1rem", color: "#64748b" }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              )}

              {/* Payment Fields */}
              <TextField
                fullWidth
                autoFocus
                size="small"
                label="Amount to Pay (BDT ৳) *"
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !paying) {
                    e.preventDefault();
                    handleConfirmPayment();
                  }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">৳</InputAdornment>
                }}
                helperText="Accept full or partial payment. Press Enter to confirm."
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Payment Method *</InputLabel>
                    <Select
                      value={paymentMethod}
                      label="Payment Method *"
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="bank">Bank Transfer</MenuItem>
                      <MenuItem value="online">Online / Gateway</MenuItem>
                      <MenuItem value="bkash">bKash</MenuItem>
                      <MenuItem value="nagad">Nagad</MenuItem>
                      <MenuItem value="rocket">Rocket</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Payment Date *"
                    type="date"
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                size="small"
                label="Transaction ID / Reference (Optional)"
                placeholder="e.g. TRX-90214 or Cash Receipt #"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPayModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmPayment}
            variant="contained"
            color="success"
            disabled={paying}
            startIcon={<PaidIcon />}
            sx={{ fontWeight: "bold", textTransform: "none" }}
          >
            {paying ? "Processing..." : "Confirm & Print Receipt Slip"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
