"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  FormControl, InputLabel, Select, MenuItem, InputAdornment, Alert,
  Stack, Tooltip, CircularProgress, Autocomplete, Divider, Tabs, Tab, Avatar, Paper
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PrintIcon from "@mui/icons-material/Print";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import WorkIcon from "@mui/icons-material/Work";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import PaidIcon from "@mui/icons-material/Paid";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BadgeIcon from "@mui/icons-material/Badge";
import PhoneIcon from "@mui/icons-material/Phone";
import HistoryIcon from "@mui/icons-material/History";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
];

export default function SalariesPage() {
  const currentActualMonth = new Date().getMonth() + 1;
  const currentActualYear = 2026;

  // Tabs: 0 = Teachers & Staff Roster, 1 = Disbursement History
  const [activeTab, setActiveTab] = useState(0);

  // Data state
  const [salaries, setSalaries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rosterList, setRosterList] = useState([]);
  const [rosterSummary, setRosterSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Roster Filters
  const [selectedMonth, setSelectedMonth] = useState(currentActualMonth);
  const [selectedYear, setSelectedYear] = useState(currentActualYear);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterStatus, setRosterStatus] = useState("all");
  const [rosterPage, setRosterPage] = useState(0);
  const [rosterRowsPerPage, setRosterRowsPerPage] = useState(10);

  // History Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [basisFilter, setBasisFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Disburse Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isCustomStaff, setIsCustomStaff] = useState(false);

  const [formData, setFormData] = useState({
    employee_name: "",
    employee_id: "",
    employee_type: "teacher", // 'teacher', 'staff', 'daily_worker'
    designation: "",
    payment_basis: "monthly", // 'monthly', 'yearly', 'daily'
    period_month: currentActualMonth,
    period_year: currentActualYear,
    period_date: new Date().toISOString().split("T")[0],
    basic_salary: "",
    daily_days: "1",
    allowance: "0",
    deduction: "0",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    transaction_id: "",
    notes: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [salRes, teachRes, rosterRes] = await Promise.all([
        api.get("/salary-payments/?page_size=1000"),
        api.get("/teachers/?page_size=200&status=active"),
        api.get(`/salary-payments/roster/?month=${selectedMonth}&year=${selectedYear}`)
      ]);
      setSalaries(salRes.results || salRes || []);
      setTeachers(teachRes.results || teachRes || []);
      setRosterList(rosterRes.results || []);
      setRosterSummary(rosterRes.summary || {});
    } catch (err) {
      console.error("Failed to load salary records", err);
      setErrorMsg("Failed to load salary disbursements and teacher roster.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const openDisburseModal = () => {
    setSelectedTeacher(null);
    setIsCustomStaff(false);
    setFormData({
      employee_name: "",
      employee_id: "",
      employee_type: "teacher",
      designation: "",
      payment_basis: "monthly",
      period_month: selectedMonth,
      period_year: selectedYear,
      period_date: new Date().toISOString().split("T")[0],
      basic_salary: "",
      daily_days: "1",
      allowance: "0",
      deduction: "0",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      transaction_id: "",
      notes: ""
    });
    setModalOpen(true);
  };

  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher(teacher);
    if (teacher) {
      setFormData(prev => ({
        ...prev,
        employee_name: teacher.full_name || "",
        employee_id: teacher.employee_id || `TCH-${teacher.id}`,
        employee_type: "teacher",
        designation: teacher.designation_name || (typeof teacher.designation === 'object' ? teacher.designation?.name : teacher.designation) || "Teacher",
        basic_salary: teacher.salary_basic ? teacher.salary_basic.toString() : ""
      }));
    }
  };

  // Direct Pay Teacher from Roster Row
  const handlePayTeacherRow = (row) => {
    const matchedTeacher = teachers.find(t => t.id === row.teacher_id) || {
      id: row.teacher_id,
      full_name: row.employee_name,
      employee_id: row.employee_id,
      designation_name: row.designation,
      salary_basic: row.basic_salary
    };

    setSelectedTeacher(matchedTeacher);
    setIsCustomStaff(false);
    const monthObj = MONTHS.find(m => m.value === selectedMonth);
    const monthName = monthObj ? monthObj.label : `Month ${selectedMonth}`;

    setFormData({
      employee_name: row.employee_name,
      employee_id: row.employee_id,
      employee_type: "teacher",
      designation: row.designation,
      payment_basis: "monthly",
      period_month: selectedMonth,
      period_year: selectedYear,
      period_date: new Date().toISOString().split("T")[0],
      basic_salary: (row.basic_salary || 0).toString(),
      daily_days: "1",
      allowance: "0",
      deduction: "0",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      transaction_id: "",
      notes: `Salary for ${monthName} ${selectedYear}`
    });
    setModalOpen(true);
  };

  // Calculate Net Paid
  const calculateNetPaid = () => {
    let base = parseFloat(formData.basic_salary) || 0;
    if (formData.payment_basis === "daily") {
      const days = parseFloat(formData.daily_days) || 1;
      base = base * days;
    }
    const allow = parseFloat(formData.allowance) || 0;
    const ded = parseFloat(formData.deduction) || 0;
    return Math.max(0, base + allow - ded);
  };

  const handleDisburseSubmit = async () => {
    if (!formData.employee_name.trim()) {
      alert("Employee Name is required.");
      return;
    }

    const netPaid = calculateNetPaid();
    if (netPaid <= 0) {
      alert("Net Paid Amount must be greater than 0.");
      return;
    }

    setSaving(true);

    let periodLabel = "";
    if (formData.payment_basis === "monthly") {
      const monthObj = MONTHS.find(m => m.value === parseInt(formData.period_month, 10));
      const monthName = monthObj ? monthObj.label : `Month ${formData.period_month}`;
      periodLabel = `${monthName} ${formData.period_year}`;
    } else if (formData.payment_basis === "yearly") {
      periodLabel = `Year ${formData.period_year} (Annual)`;
    } else {
      periodLabel = `Daily: ${formData.period_date} (${formData.daily_days || 1} day(s))`;
    }

    try {
      const createdPayment = await api.post("/salary-payments/", {
        teacher: selectedTeacher ? selectedTeacher.id : null,
        employee_id: formData.employee_id,
        employee_name: formData.employee_name,
        employee_type: formData.employee_type,
        designation: formData.designation,
        payment_basis: formData.payment_basis,
        period_month: formData.payment_basis === "monthly" ? formData.period_month : null,
        period_year: formData.period_year,
        period_date: formData.payment_basis === "daily" ? formData.period_date : null,
        period_label: periodLabel,
        basic_salary: parseFloat(formData.basic_salary) || 0,
        allowance: parseFloat(formData.allowance) || 0,
        deduction: parseFloat(formData.deduction) || 0,
        amount_paid: netPaid,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        transaction_id: formData.transaction_id,
        status: "paid",
        notes: formData.notes
      });

      setModalOpen(false);
      setSuccessMsg(`Salary of ${formatMoney(netPaid)} disbursed successfully for ${formData.employee_name}. Central School Wallet debited.`);
      
      if (createdPayment && createdPayment.id) {
        window.open(`/print/salary/${createdPayment.id}/voucher`, "_blank");
      }

      loadData();
    } catch (err) {
      alert("Failed to disburse salary payment. Please check wallet balance or verify inputs.");
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (val) => {
    return '৳' + parseFloat(val || 0).toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Filtered Roster
  const filteredRoster = rosterList.filter(row => {
    const q = rosterSearch.toLowerCase();
    const matchSearch = !rosterSearch ||
      (row.employee_name && row.employee_name.toLowerCase().includes(q)) ||
      (row.employee_id && row.employee_id.toLowerCase().includes(q)) ||
      (row.designation && row.designation.toLowerCase().includes(q)) ||
      (row.department && row.department.toLowerCase().includes(q)) ||
      (row.phone && row.phone.toLowerCase().includes(q));

    const matchStatus = rosterStatus === "all" || row.current_month_status === rosterStatus;
    return matchSearch && matchStatus;
  });

  // Filtered Salaries History
  const filteredSalaries = salaries.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery ||
      (s.employee_name && s.employee_name.toLowerCase().includes(q)) ||
      (s.employee_id && s.employee_id.toLowerCase().includes(q)) ||
      (s.designation && s.designation.toLowerCase().includes(q));

    const matchType = typeFilter === "all" || s.employee_type === typeFilter;
    const matchBasis = basisFilter === "all" || s.payment_basis === basisFilter;

    return matchSearch && matchType && matchBasis;
  });

  const selectedMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || `Month ${selectedMonth}`;

  return (
    <Box>
      {successMsg && (
        <Alert severity="success" onClose={() => setSuccessMsg("")} sx={{ mb: 2 }}>
          {successMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg("")} sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Header and Action */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a" }}>
            Teacher & Staff Salary Management (Payroll)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage teacher payroll roster, disburse monthly salaries, track pending dues, and maintain central school wallet disbursements.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={openDisburseModal}
          startIcon={<PaidIcon />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 2.5 }}
        >
          Disburse Salary / Pay Staff
        </Button>
      </Box>

      {/* 4 KPI Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                  Monthly Commitment
                </Typography>
                <MonetizationOnIcon fontSize="small" sx={{ color: "#2563eb" }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#1e3a8a" }}>
                {formatMoney(rosterSummary.monthly_budget ?? 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                For {selectedMonthLabel} {selectedYear} ({rosterSummary.total_employees ?? teachers.length} Teachers)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                  Disbursed This Month
                </Typography>
                <CheckCircleOutlineIcon fontSize="small" sx={{ color: "#16a34a" }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#16a34a" }}>
                {formatMoney(rosterSummary.disbursed_month ?? 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {rosterSummary.paid_count ?? 0} teacher(s) paid for this period
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                  Pending Disbursement
                </Typography>
                <WarningAmberIcon fontSize="small" sx={{ color: "#d97706" }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#d97706" }}>
                {formatMoney(rosterSummary.pending_amount ?? (rosterSummary.monthly_budget ?? 0))}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {rosterSummary.pending_count ?? teachers.length} teacher(s) awaiting salary
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                  Total Staff & Teachers
                </Typography>
                <PeopleAltIcon fontSize="small" sx={{ color: "#8b5cf6" }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#6d28d9" }}>
                {rosterSummary.total_employees ?? teachers.length} Active
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Connected to Teachers profile records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Switcher */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            px: 2,
            borderBottom: "1px solid #f1f5f9",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              py: 2
            }
          }}
        >
          <Tab
            icon={<PeopleAltIcon fontSize="small" />}
            iconPosition="start"
            label={`Teachers & Staff Salary Roster (${rosterList.length})`}
          />
          <Tab
            icon={<HistoryIcon fontSize="small" />}
            iconPosition="start"
            label={`Salary Disbursement History (${salaries.length})`}
          />
        </Tabs>

        {/* TAB 0: TEACHERS & STAFF SALARY ROSTER */}
        {activeTab === 0 && (
          <Box>
            {/* Filter Toolbar for Roster */}
            <Box sx={{ p: 2, bgcolor: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4} md={3.5}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by Name, Employee ID, Designation, Phone..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={6} sm={2.5} md={2.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Payroll Month</InputLabel>
                    <Select
                      value={selectedMonth}
                      label="Payroll Month"
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      {MONTHS.map((m) => (
                        <MenuItem key={m.value} value={m.value}>
                          {m.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} sm={2} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={selectedYear}
                      label="Year"
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      <MenuItem value={2025}>2025</MenuItem>
                      <MenuItem value={2026}>2026</MenuItem>
                      <MenuItem value={2027}>2027</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} sm={2.5} md={2.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Payment Status</InputLabel>
                    <Select
                      value={rosterStatus}
                      label="Payment Status"
                      onChange={(e) => {
                        setRosterStatus(e.target.value);
                        setRosterPage(0);
                      }}
                    >
                      <MenuItem value="all">All Statuses ({rosterList.length})</MenuItem>
                      <MenuItem value="unpaid">Unpaid / Pending ({rosterSummary.pending_count ?? 0})</MenuItem>
                      <MenuItem value="paid">Paid ({rosterSummary.paid_count ?? 0})</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} sm={1} md={1.5} sx={{ textAlign: "right" }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={loadData}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Refresh
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Roster Table */}
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 130 }}>Employee ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Employee Name & Contact</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Designation & Dept</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Contract</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Monthly Basic (BDT)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Status ({selectedMonthLabel})</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, width: 170 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={28} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Loading employee salary roster...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredRoster.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                        <Typography variant="body1" fontWeight="bold">No staff or teachers found.</Typography>
                        <Typography variant="body2">
                          Ensure teachers are added to the Teachers table and active.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRoster
                      .slice(rosterPage * rosterRowsPerPage, rosterPage * rosterRowsPerPage + rosterRowsPerPage)
                      .map((row) => {
                        const isPaid = row.current_month_status === "paid";
                        return (
                          <TableRow key={row.teacher_id} hover>
                            <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <BadgeIcon sx={{ fontSize: 18, color: "#3b82f6" }} />
                                {row.employee_id}
                              </Box>
                            </TableCell>

                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Avatar
                                  sx={{
                                    bgcolor: isPaid ? "#dcfce7" : "#eff6ff",
                                    color: isPaid ? "#15803d" : "#1d4ed8",
                                    width: 34,
                                    height: 34,
                                    fontSize: "0.85rem",
                                    fontWeight: 700
                                  }}
                                >
                                  {row.employee_name ? row.employee_name.charAt(0).toUpperCase() : "T"}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="bold" sx={{ color: "#0f172a" }}>
                                    {row.employee_name}
                                  </Typography>
                                  {row.phone && row.phone !== "—" && (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.2 }}>
                                      <PhoneIcon sx={{ fontSize: 13, color: "#64748b" }} />
                                      <Typography variant="caption" color="text.secondary">
                                        {row.phone}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" fontWeight={600} sx={{ color: "#1e293b" }}>
                                {row.designation}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {row.department}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={row.contract_type ? row.contract_type.toUpperCase() : "REGULAR"}
                                size="small"
                                sx={{
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  bgcolor: "#f1f5f9",
                                  color: "#475569"
                                }}
                              />
                            </TableCell>

                            <TableCell align="right" sx={{ fontWeight: 800, fontFamily: "monospace", fontSize: "0.95rem", color: "#0f172a" }}>
                              {formatMoney(row.basic_salary)}
                            </TableCell>

                            <TableCell align="center">
                              {isPaid ? (
                                <Box sx={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                                  <Chip
                                    icon={<CheckCircleOutlineIcon sx={{ fontSize: "16px !important" }} />}
                                    label="PAID"
                                    size="small"
                                    color="success"
                                    sx={{ fontWeight: 700, fontSize: "0.7rem", px: 0.5 }}
                                  />
                                  {row.last_payment_date && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem", mt: 0.4 }}>
                                      {row.last_payment_date}
                                    </Typography>
                                  )}
                                </Box>
                              ) : (
                                <Chip
                                  icon={<WarningAmberIcon sx={{ fontSize: "16px !important" }} />}
                                  label="UNPAID (PENDING)"
                                  size="small"
                                  sx={{
                                    bgcolor: "#fef3c7",
                                    color: "#92400e",
                                    fontWeight: 700,
                                    fontSize: "0.7rem",
                                    px: 0.5
                                  }}
                                />
                              )}
                            </TableCell>

                            <TableCell align="center">
                              {isPaid ? (
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  {row.last_payment_id && (
                                    <Button
                                      component="a"
                                      href={`/print/salary/${row.last_payment_id}/voucher`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      startIcon={<PrintIcon />}
                                      sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem", py: 0.4 }}
                                    >
                                      Voucher
                                    </Button>
                                  )}
                                </Stack>
                              ) : (
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  onClick={() => handlePayTeacherRow(row)}
                                  startIcon={<PaidIcon />}
                                  sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: "0.78rem",
                                    bgcolor: "#16a34a",
                                    "&:hover": { bgcolor: "#15803d" },
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    py: 0.4,
                                    px: 1.5
                                  }}
                                >
                                  Pay Salary
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={filteredRoster.length}
              rowsPerPage={rosterRowsPerPage}
              page={rosterPage}
              onPageChange={(e, newPage) => setRosterPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRosterRowsPerPage(parseInt(e.target.value, 10));
                setRosterPage(0);
              }}
            />
          </Box>
        )}

        {/* TAB 1: SALARY DISBURSEMENT HISTORY */}
        {activeTab === 1 && (
          <Box>
            {/* Filters Toolbar for History */}
            <Box sx={{ p: 2, bgcolor: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by Employee Name, ID, or Designation..."
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
                </Grid>

                <Grid item xs={6} sm={3} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Employee Type</InputLabel>
                    <Select
                      value={typeFilter}
                      label="Employee Type"
                      onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="all">All Roles ({salaries.length})</MenuItem>
                      <MenuItem value="teacher">Teachers</MenuItem>
                      <MenuItem value="staff">Admin & General Staff</MenuItem>
                      <MenuItem value="daily_worker">Daily Wage Workers</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} sm={3} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Frequency / Basis</InputLabel>
                    <Select
                      value={basisFilter}
                      label="Frequency / Basis"
                      onChange={(e) => {
                        setBasisFilter(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="all">All Frequencies</MenuItem>
                      <MenuItem value="monthly">Monthly Salary</MenuItem>
                      <MenuItem value="yearly">Yearly / Annual</MenuItem>
                      <MenuItem value="daily">Daily Wage</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={12} md={2} sx={{ textAlign: "right" }}>
                  <IconButton onClick={loadData} color="primary" title="Refresh Payroll">
                    <RefreshIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>

            {/* Salaries Table */}
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Employee ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Employee & Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Frequency / Basis</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Disbursed Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Net Paid (BDT)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={28} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading salary disbursements...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredSalaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                        <Typography variant="body1" fontWeight="bold">No salary disbursements found.</Typography>
                        <Typography variant="body2">Click &apos;Disburse Salary / Pay Staff&apos; or pay from the Roster tab.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSalaries
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((sal) => (
                        <TableRow key={sal.id} hover>
                          <TableCell sx={{ fontFamily: "monospace", fontWeight: 600, color: "#475569" }}>
                            {sal.employee_id || `EMP-${sal.id}`}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: "#0f172a" }}>
                              {sal.employee_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {sal.designation || "Staff Member"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={sal.employee_type_display?.toUpperCase() || sal.employee_type?.toUpperCase()}
                              size="small"
                              sx={{ 
                                fontWeight: "bold", 
                                fontSize: "0.65rem",
                                bgcolor: sal.employee_type === "teacher" ? "#eff6ff" : sal.employee_type === "staff" ? "#f5f3ff" : "#fef3c7",
                                color: sal.employee_type === "teacher" ? "#1d4ed8" : sal.employee_type === "staff" ? "#6d28d9" : "#b45309"
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ textTransform: "capitalize", fontWeight: 500 }}>
                            {sal.payment_basis_display || sal.payment_basis}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>
                            {sal.period_label || sal.payment_date}
                          </TableCell>
                          <TableCell sx={{ color: "#475569" }}>
                            {sal.payment_date}
                            <Typography variant="caption" color="text.secondary" display="block">
                              via {sal.payment_method_display || sal.payment_method}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: "monospace", fontSize: "0.95rem", color: "#dc2626" }}>
                            {formatMoney(sal.amount_paid)}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              component="a"
                              href={`/print/salary/${sal.id}/voucher`}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<PrintIcon />}
                              sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem", py: 0.3 }}
                            >
                              Voucher
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={filteredSalaries.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Disburse Salary Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Disburse Salary / Pay Staff</span>
          <IconButton size="small" onClick={() => setModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5}>
            {/* Choose Employee Source */}
            <Box>
              <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }} display="block">
                Employee Selection
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <Button
                  size="small"
                  variant={!isCustomStaff ? "contained" : "outlined"}
                  onClick={() => setIsCustomStaff(false)}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Select Registered Teacher
                </Button>
                <Button
                  size="small"
                  variant={isCustomStaff ? "contained" : "outlined"}
                  onClick={() => {
                    setIsCustomStaff(true);
                    setSelectedTeacher(null);
                    setFormData(prev => ({ ...prev, employee_type: "staff" }));
                  }}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Custom Staff / Daily Worker
                </Button>
              </Stack>

              {!isCustomStaff ? (
                <Autocomplete
                  size="small"
                  options={teachers}
                  getOptionLabel={(t) => `${t.full_name} (${t.designation_name || (typeof t.designation === 'object' ? t.designation?.name : t.designation) || 'Teacher'}) - ID: ${t.employee_id || t.id}`}
                  value={selectedTeacher}
                  onChange={(e, val) => handleTeacherSelect(val)}
                  renderInput={(params) => (
                    <TextField {...params} label="Choose Teacher *" />
                  )}
                />
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Staff Full Name *"
                      value={formData.employee_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, employee_name: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Staff / Employee ID"
                      placeholder="e.g. STF-102"
                      value={formData.employee_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Employee Category</InputLabel>
                      <Select
                        value={formData.employee_type}
                        label="Employee Category"
                        onChange={(e) => setFormData(prev => ({ ...prev, employee_type: e.target.value }))}
                      >
                        <MenuItem value="staff">General / Administrative Staff</MenuItem>
                        <MenuItem value="daily_worker">Daily Wage Staff / Worker</MenuItem>
                        <MenuItem value="teacher">Teacher</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Designation / Role"
                      placeholder="e.g. Accountant, Cleaner, Guard"
                      value={formData.designation}
                      onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                    />
                  </Grid>
                </Grid>
              )}
            </Box>

            <Divider />

            {/* Payment Frequency / Basis */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Basis *</InputLabel>
                  <Select
                    value={formData.payment_basis}
                    label="Payment Basis *"
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_basis: e.target.value }))}
                  >
                    <MenuItem value="monthly">Monthly Salary</MenuItem>
                    <MenuItem value="yearly">Yearly / Annual</MenuItem>
                    <MenuItem value="daily">Daily Wage Staff</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.payment_basis === "monthly" && (
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Salary Month</InputLabel>
                    <Select
                      value={formData.period_month}
                      label="Salary Month"
                      onChange={(e) => setFormData(prev => ({ ...prev, period_month: e.target.value }))}
                    >
                      {MONTHS.map((m) => (
                        <MenuItem key={m.value} value={m.value}>
                          {m.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {formData.payment_basis === "yearly" && (
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Salary Year"
                    type="number"
                    value={formData.period_year}
                    onChange={(e) => setFormData(prev => ({ ...prev, period_year: parseInt(e.target.value, 10) }))}
                  />
                </Grid>
              )}

              {formData.payment_basis === "daily" && (
                <>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Work Date"
                      type="date"
                      value={formData.period_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, period_date: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Days Worked"
                      type="number"
                      value={formData.daily_days}
                      onChange={(e) => setFormData(prev => ({ ...prev, daily_days: e.target.value }))}
                      helperText="Multiplies daily rate"
                    />
                  </Grid>
                </>
              )}
            </Grid>

            {/* Financials */}
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  label={formData.payment_basis === "daily" ? "Daily Rate (BDT ৳) *" : "Basic Salary (BDT ৳) *"}
                  type="number"
                  value={formData.basic_salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, basic_salary: e.target.value }))}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Allowance / Bonus (+)"
                  type="number"
                  value={formData.allowance}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowance: e.target.value }))}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Deductions (-)"
                  type="number"
                  value={formData.deduction}
                  onChange={(e) => setFormData(prev => ({ ...prev, deduction: e.target.value }))}
                />
              </Grid>
            </Grid>

            {/* Net Amount Box */}
            <Box sx={{ p: 2, bgcolor: "#f0fdf4", borderRadius: 2, border: "1px solid #bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" fontWeight="bold" sx={{ color: "#166534" }}>
                Total Net Amount to Disburse:
              </Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#15803d", fontFamily: "monospace" }}>
                {formatMoney(calculateNetPaid())}
              </Typography>
            </Box>

            {/* Payment Method & Date */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Method *</InputLabel>
                  <Select
                    value={formData.payment_method}
                    label="Payment Method *"
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="bank">Bank Transfer</MenuItem>
                    <MenuItem value="mobile_money">Mobile Banking (bKash/Nagad)</MenuItem>
                    <MenuItem value="cheque">Cheque</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Disbursement Date *"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              size="small"
              label="Transaction Ref / Cheque No / Remarks"
              placeholder="e.g. Cheque #84920 or Bank TXN"
              value={formData.transaction_id}
              onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setModalOpen(false)} color="inherit">Cancel</Button>
          <Button
            onClick={handleDisburseSubmit}
            variant="contained"
            color="primary"
            disabled={saving}
            startIcon={<PaidIcon />}
            sx={{ fontWeight: "bold", textTransform: "none" }}
          >
            {saving ? "Disbursing..." : "Disburse & Debit Wallet"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
