"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, TextField, FormControl, InputLabel, Select,
  MenuItem, IconButton, CircularProgress, Alert, Autocomplete, Avatar, Stack,
  InputAdornment, Tooltip, Paper, Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import ClassIcon from "@mui/icons-material/Class";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PercentIcon from "@mui/icons-material/Percent";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ConfirmDialog from "@/components/ConfirmDialog";

const QUICK_DISCOUNT_CATEGORIES = [
  "Merit Scholarship",
  "Sibling Discount",
  "Staff Ward / Child",
  "Financial Hardship / Need-Based",
  "Early Admission Discount",
  "Orphan / Special Care Exemption"
];

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mappings & Lookup Data
  const [students, setStudents] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  // Main Table Filters
  const [tableSearch, setTableSearch] = useState("");
  const [tableClass, setTableClass] = useState("all");
  const [tableSection, setTableSection] = useState("all");
  const [tableFeeType, setTableFeeType] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog State
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal Filters for Student Selection
  const [modalClass, setModalClass] = useState("");
  const [modalSection, setModalSection] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fee_type: "",
    discount_type: "",
    discount_value_type: "flat",
    discount_amount: "",
    reason: "",
    valid_from: "",
    valid_to: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [discRes, stuRes, feeRes, clsRes, secRes] = await Promise.all([
        api.get("/fee-discounts/?page_size=500"),
        api.get("/students/?page_size=2000&status=active"),
        api.get("/fee-types/?page_size=200"),
        api.get("/classes/?page_size=200"),
        api.get("/sections/?page_size=500")
      ]);
      setDiscounts(discRes.results || discRes || []);
      setStudents(stuRes.results || stuRes || []);
      setFeeTypes(feeRes.results || feeRes || []);
      setClasses(clsRes.results || clsRes || []);
      setSections(secRes.results || secRes || []);
    } catch (err) {
      console.error("Failed to load discount data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter sections for modal class
  const modalAvailableSections = useMemo(() => {
    if (!modalClass) return [];
    return sections.filter(sec => {
      const cId = typeof sec.school_class === "object" ? sec.school_class?.id : sec.school_class;
      return String(cId) === String(modalClass);
    });
  }, [modalClass, sections]);

  // Filter students for modal selection based on modalClass and modalSection
  const modalAvailableStudents = useMemo(() => {
    return students.filter(s => {
      if (modalClass && String(s.current_class) !== String(modalClass)) return false;
      if (modalSection && String(s.current_section) !== String(modalSection)) return false;
      return true;
    });
  }, [students, modalClass, modalSection]);

  // Filter sections for main table class
  const tableAvailableSections = useMemo(() => {
    if (!tableClass || tableClass === "all") return [];
    return sections.filter(sec => {
      const cId = typeof sec.school_class === "object" ? sec.school_class?.id : sec.school_class;
      return String(cId) === String(tableClass);
    });
  }, [tableClass, sections]);

  const handleOpen = () => {
    setModalClass("");
    setModalSection("");
    setSelectedStudent(null);
    setFormData({
      fee_type: "",
      discount_type: "",
      discount_value_type: "flat",
      discount_amount: "",
      reason: "",
      valid_from: "",
      valid_to: "",
    });
    setErrorMsg("");
    setOpen(true);
  };

  // When modal class changes, clear section and ensure student still matches
  const handleModalClassChange = (classId) => {
    setModalClass(classId);
    setModalSection("");
    if (selectedStudent && classId && String(selectedStudent.current_class) !== String(classId)) {
      setSelectedStudent(null);
    }
  };

  // When modal section changes
  const handleModalSectionChange = (sectionId) => {
    setModalSection(sectionId);
    if (selectedStudent && sectionId && String(selectedStudent.current_section) !== String(sectionId)) {
      setSelectedStudent(null);
    }
  };

  // Quick category chip click
  const handleSelectQuickCategory = (cat) => {
    setFormData(prev => ({
      ...prev,
      discount_type: cat
    }));
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      setErrorMsg("Please select a student to assign the discount.");
      return;
    }
    if (!formData.fee_type) {
      setErrorMsg("Please select a Fee Type.");
      return;
    }
    if (!formData.discount_amount || parseFloat(formData.discount_amount) <= 0) {
      setErrorMsg("Please enter a valid discount amount greater than 0.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        student: selectedStudent.id,
        fee_type: formData.fee_type,
        discount_type: formData.discount_type || "Scholarship / Fee Waiver",
        discount_value_type: formData.discount_value_type,
        discount_amount: parseFloat(formData.discount_amount),
        reason: formData.reason || ""
      };
      if (formData.valid_from) payload.valid_from = formData.valid_from;
      if (formData.valid_to) payload.valid_to = formData.valid_to;

      await api.post("/fee-discounts/", payload);
      setOpen(false);
      loadData();
    } catch (err) {
      if (err.data) {
        setErrorMsg(Object.entries(err.data).map(([k, v]) => `${k}: ${v}`).join(", "));
      } else {
        setErrorMsg("Failed to assign discount. Please check values.");
      }
    } finally {
      setSaving(false);
    }
  };

  const promptDelete = (d) => {
    setDiscountToDelete(d);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!discountToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/fee-discounts/${discountToDelete.id}/`);
      setDeleteConfirmOpen(false);
      setDiscountToDelete(null);
      loadData();
    } catch (err) {
      alert("Failed to delete discount");
    } finally {
      setDeleting(false);
    }
  };

  // Helper mappings
  const getStudentObj = (id) => students.find(s => s.id === id);
  const getStudentName = (id, fallback) => fallback || students.find(s => s.id === id)?.full_name || `Student #${id}`;
  const getFeeTypeName = (id, fallback) => fallback || feeTypes.find(f => f.id === id)?.name || `Fee #${id}`;

  const formatDiscount = (amount, type) => {
    if (type === "percent") return `${amount}%`;
    return `৳${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  // Filtered discounts for the main table
  const filteredDiscounts = useMemo(() => {
    return discounts.filter(d => {
      const studentObj = getStudentObj(d.student);
      const studentName = (d.student_name || studentObj?.full_name || "").toLowerCase();
      const studentRoll = String(d.student_roll || studentObj?.roll_number || "").toLowerCase();
      const studentAdm = String(d.student_admission || studentObj?.admission_number || "").toLowerCase();
      const discType = (d.discount_type || "").toLowerCase();
      const reason = (d.reason || "").toLowerCase();
      const q = tableSearch.toLowerCase().trim();

      const matchSearch = !q ||
        studentName.includes(q) ||
        studentRoll.includes(q) ||
        studentAdm.includes(q) ||
        discType.includes(q) ||
        reason.includes(q);

      const sClass = d.class_id || studentObj?.current_class;
      const matchClass = tableClass === "all" || String(sClass) === String(tableClass);

      const sSec = d.section_id || studentObj?.current_section;
      const matchSec = tableClass === "all" || tableSection === "all" || String(sSec) === String(tableSection);

      const matchFee = tableFeeType === "all" || String(d.fee_type) === String(tableFeeType);

      return matchSearch && matchClass && matchSec && matchFee;
    });
  }, [discounts, students, tableSearch, tableClass, tableSection, tableFeeType]);

  // Metrics
  const totalBenefitingStudents = useMemo(() => {
    const set = new Set(discounts.map(d => d.student));
    return set.size;
  }, [discounts]);

  const flatTotalCommitment = useMemo(() => {
    return discounts
      .filter(d => d.discount_value_type === "flat")
      .reduce((sum, d) => sum + parseFloat(d.discount_amount || 0), 0);
  }, [discounts]);

  const percentDiscountsCount = useMemo(() => {
    return discounts.filter(d => d.discount_value_type === "percent").length;
  }, [discounts]);

  return (
    <Box>
      {/* Header and Action */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a" }}>
            Discounts & Scholarships Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Assign custom fee discounts, merit scholarships, and sibling waivers to specific students filtered by class and section.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 2.5 }}
        >
          Assign New Discount
        </Button>
      </Box>

      {/* 4 Summary KPI Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                  Active Discounts
                </Typography>
                <MonetizationOnIcon fontSize="small" sx={{ color: "#2563eb" }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#1e3a8a" }}>
                {discounts.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Assigned across all classes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                  Benefiting Students
                </Typography>
                <PersonIcon fontSize="small" sx={{ color: "#16a34a" }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#16a34a" }}>
                {totalBenefitingStudents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Unique students receiving aid
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                  Flat Waivers Total
                </Typography>
                <MonetizationOnIcon fontSize="small" sx={{ color: "#d97706" }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#d97706" }}>
                ৳{flatTotalCommitment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Direct monetary concessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                  Percentage Waivers
                </Typography>
                <PercentIcon fontSize="small" sx={{ color: "#8b5cf6" }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#6d28d9" }}>
                {percentDiscountsCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Merit & scholarship quotas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Discounts Ledger Card */}
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, overflow: "hidden" }}>
        {/* Table Filters Toolbar */}
        <Box sx={{ p: 2, bgcolor: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3.5}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by Student, Roll, or Category..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
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

            <Grid item xs={6} sm={2.5} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter Class</InputLabel>
                <Select
                  value={tableClass}
                  label="Filter Class"
                  onChange={(e) => {
                    setTableClass(e.target.value);
                    setTableSection("all");
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Classes ({classes.length})</MenuItem>
                  {classes.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={2.5} md={2}>
              <FormControl fullWidth size="small" disabled={!tableClass || tableClass === "all"}>
                <InputLabel>Filter Section</InputLabel>
                <Select
                  value={tableClass === "all" ? "all" : tableSection}
                  label="Filter Section"
                  onChange={(e) => {
                    setTableSection(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">
                    {tableClass === "all" ? "Select Class First" : "All Sections"}
                  </MenuItem>
                  {tableAvailableSections.map(s => (
                    <MenuItem key={s.id} value={s.id}>Section {s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={2} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Fee Type</InputLabel>
                <Select
                  value={tableFeeType}
                  label="Fee Type"
                  onChange={(e) => {
                    setTableFeeType(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Fee Types ({feeTypes.length})</MenuItem>
                  {feeTypes.map(f => (
                    <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={1} md={1.5} sx={{ textAlign: "right" }}>
              <IconButton onClick={loadData} color="primary" title="Refresh Discounts">
                <RefreshIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Box>

        {/* Discounts Table */}
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Student & Contact</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Class & Section</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fee Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Discount Category</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Concession Value</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Validity Period</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, width: 90 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading discounts and scholarships...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredDiscounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    <Typography variant="body1" fontWeight="bold">No discounts found matching the criteria.</Typography>
                    <Typography variant="body2">
                      Click &apos;Assign New Discount&apos; to set a student scholarship or discount.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDiscounts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((d) => {
                    const studentObj = getStudentObj(d.student);
                    const studentName = d.student_name || studentObj?.full_name || `Student #${d.student}`;
                    const rollNo = d.student_roll || studentObj?.roll_number;
                    const admNo = d.student_admission || studentObj?.admission_number;
                    const className = d.class_name || studentObj?.class_name || "—";
                    const secName = d.section_name || studentObj?.section_name || "—";
                    const feeName = d.fee_type_name || getFeeTypeName(d.fee_type);

                    return (
                      <TableRow key={d.id} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                bgcolor: "#eff6ff",
                                color: "#1d4ed8"
                              }}
                            >
                              {studentName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold" sx={{ color: "#0f172a" }}>
                                {studentName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Roll: <strong>{rollNo || "—"}</strong> {admNo ? `· ID: ${admNo}` : ""}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Chip
                            icon={<SchoolIcon sx={{ fontSize: "14px !important" }} />}
                            label={`${className} · Sec ${secName}`}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              bgcolor: "#f1f5f9",
                              color: "#334155"
                            }}
                          />
                        </TableCell>

                        <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>
                          {feeName}
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ color: "#4338ca" }}>
                            {d.discount_type || "General Waiver"}
                          </Typography>
                          {d.reason && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ maxWidth: 220, noWrap: true }}>
                              {d.reason}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell align="right">
                          <Chip
                            label={formatDiscount(d.discount_amount, d.discount_value_type)}
                            size="small"
                            color="success"
                            variant="filled"
                            sx={{
                              fontWeight: 800,
                              fontFamily: "monospace",
                              fontSize: "0.85rem",
                              bgcolor: "#dcfce7",
                              color: "#15803d"
                            }}
                          />
                        </TableCell>

                        <TableCell sx={{ color: "#475569", fontSize: "0.8rem" }}>
                          {d.valid_from && d.valid_to ? (
                            <span>{d.valid_from} to {d.valid_to}</span>
                          ) : d.valid_from ? (
                            <span>From {d.valid_from}</span>
                          ) : d.valid_to ? (
                            <span>Until {d.valid_to}</span>
                          ) : (
                            <span style={{ color: "#16a34a", fontWeight: 600 }}>Always Applicable</span>
                          )}
                        </TableCell>

                        <TableCell align="center">
                          <Tooltip title="Remove / Revoke Discount">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => promptDelete(d)}
                              sx={{ "&:hover": { bgcolor: "#fee2e2" } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
          count={filteredDiscounts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* ASSIGN DISCOUNT DIALOG WITH CLASS & SECTION FILTERING */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: "#0f172a" }}>
              Assign Student Fee Discount / Scholarship
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Filter by class and section to easily find and assign a discount to a specific student.
            </Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {errorMsg}
            </Alert>
          )}

          <Stack spacing={2.5}>
            {/* 1. Academic Filtering Box: Class & Section */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5 }} display="block">
                Step 1: Filter by Class & Section (To Target Student)
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Target Class</InputLabel>
                    <Select
                      value={modalClass}
                      label="Target Class"
                      onChange={(e) => handleModalClassChange(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>All Classes (Search Any Student)</em>
                      </MenuItem>
                      {classes.map(c => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" disabled={!modalClass}>
                    <InputLabel>Target Section</InputLabel>
                    <Select
                      value={modalSection}
                      label="Target Section"
                      onChange={(e) => handleModalSectionChange(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>All Sections of Class</em>
                      </MenuItem>
                      {modalAvailableSections.map(s => (
                        <MenuItem key={s.id} value={s.id}>
                          Section {s.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {modalClass && (
                <Typography variant="caption" color="primary" sx={{ display: "block", mt: 1, fontWeight: 600 }}>
                  Showing {modalAvailableStudents.length} student(s) enrolled in selected filter.
                </Typography>
              )}
            </Paper>

            {/* 2. Student Autocomplete Picker */}
            <Box>
              <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }} display="block">
                Step 2: Choose Specific Student *
              </Typography>

              <Autocomplete
                size="small"
                options={modalAvailableStudents}
                getOptionLabel={(option) => {
                  const roll = option.roll_number ? `Roll: ${option.roll_number}` : "";
                  const cls = option.class_name ? `Class: ${option.class_name}` : "";
                  const sec = option.section_name ? `Sec: ${option.section_name}` : "";
                  const meta = [roll, cls, sec].filter(Boolean).join(" · ");
                  return `${option.full_name} ${meta ? `(${meta})` : ""} - ID: ${option.admission_number || option.id}`;
                }}
                value={selectedStudent}
                onChange={(e, val) => setSelectedStudent(val)}
                filterOptions={(options, state) => {
                  const q = state.inputValue.toLowerCase().trim();
                  if (!q) return options;
                  return options.filter(opt =>
                    (opt.full_name && opt.full_name.toLowerCase().includes(q)) ||
                    (opt.roll_number && opt.roll_number.toLowerCase().includes(q)) ||
                    (opt.admission_number && opt.admission_number.toLowerCase().includes(q)) ||
                    (opt.class_name && opt.class_name.toLowerCase().includes(q)) ||
                    (opt.section_name && opt.section_name.toLowerCase().includes(q))
                  );
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id} sx={{ py: 1 }}>
                    <Avatar sx={{ width: 28, height: 28, mr: 1.5, fontSize: "0.75rem", bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700 }}>
                      {option.full_name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" fontWeight="bold">
                          {option.full_name}
                        </Typography>
                        <Chip
                          label={option.roll_number ? `Roll: ${option.roll_number}` : "No Roll"}
                          size="small"
                          sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Class: <strong>{option.class_name || "—"}</strong> (Sec {option.section_name || "—"}) · ID: {option.admission_number || option.id}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search or Select Student by Name, Roll #, or ID *"
                    placeholder={modalClass ? "Select from filtered class list..." : "Type student name or roll..."}
                  />
                )}
              />

              {/* Selected Student Confirmation Card */}
              {selectedStudent && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    bgcolor: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5
                  }}
                >
                  <Avatar sx={{ width: 38, height: 38, bgcolor: "#10b981", color: "#ffffff", fontWeight: 700 }}>
                    {selectedStudent.full_name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: "#065f46" }}>
                      {selectedStudent.full_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#047857" }}>
                      Class: <strong>{selectedStudent.class_name || "—"}</strong> · Section: <strong>{selectedStudent.section_name || "—"}</strong> · Roll: <strong>{selectedStudent.roll_number || "—"}</strong> · ID: {selectedStudent.admission_number || selectedStudent.id}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: "16px !important" }} />}
                    label="Selected"
                    size="small"
                    color="success"
                    sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                  />
                </Paper>
              )}
            </Box>

            <Divider />

            {/* 3. Fee Type Selection */}
            <FormControl fullWidth size="small" required>
              <InputLabel>Applicable Fee Type</InputLabel>
              <Select
                value={formData.fee_type}
                label="Applicable Fee Type"
                onChange={(e) => setFormData(prev => ({ ...prev, fee_type: e.target.value }))}
              >
                {feeTypes.map(f => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.name} {f.default_amount ? `(Default: ৳${parseFloat(f.default_amount).toLocaleString()})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 4. Discount Category with Quick Suggestions */}
            <Box>
              <TextField
                fullWidth
                size="small"
                label="Discount Type / Category"
                placeholder="e.g. Sibling Discount, Merit Scholarship, Staff Ward"
                value={formData.discount_type}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_type: e.target.value }))}
              />
              <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.8, alignItems: "center" }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                  Quick presets:
                </Typography>
                {QUICK_DISCOUNT_CATEGORIES.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    size="small"
                    clickable
                    onClick={() => handleSelectQuickCategory(cat)}
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: formData.discount_type === cat ? 700 : 500,
                      bgcolor: formData.discount_type === cat ? "#e0e7ff" : "#f1f5f9",
                      color: formData.discount_type === cat ? "#3730a3" : "#475569"
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* 5. Value Type & Concession Amount */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Discount Calculation Mode</InputLabel>
                  <Select
                    value={formData.discount_value_type}
                    label="Discount Calculation Mode"
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_value_type: e.target.value }))}
                  >
                    <MenuItem value="flat">Flat Amount (৳ BDT Concession)</MenuItem>
                    <MenuItem value="percent">Percentage (% Off Fee Item)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={`Discount Value (${formData.discount_value_type === "percent" ? "% Percentage" : "৳ BDT Amount"}) *`}
                  type="number"
                  required
                  placeholder={formData.discount_value_type === "percent" ? "e.g. 25" : "e.g. 500"}
                  value={formData.discount_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {formData.discount_value_type === "percent" ? "%" : "৳"}
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            </Grid>

            {/* 6. Validity Dates */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Valid From (Optional)"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.valid_from}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                  helperText="Leave empty to activate immediately"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Valid To (Optional)"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.valid_to}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_to: e.target.value }))}
                  helperText="Leave empty for permanent discount"
                />
              </Grid>
            </Grid>

            {/* 7. Justification / Remarks */}
            <TextField
              fullWidth
              size="small"
              label="Reason / Administrative Notes (Optional)"
              multiline
              rows={2}
              placeholder="e.g. Approved 50% sibling tuition waiver by School Principal"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={saving || !selectedStudent || !formData.fee_type || !formData.discount_amount}
            sx={{ fontWeight: "bold", textTransform: "none", px: 3 }}
          >
            {saving ? "Saving..." : "Assign Discount to Student"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bootstrap-Style Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Confirm Remove Discount"
        message="Are you sure you want to remove this discount / scholarship?"
        itemName={
          discountToDelete
            ? `${discountToDelete.student_name || getStudentName(discountToDelete.student)} — ${discountToDelete.fee_type_name || getFeeTypeName(discountToDelete.fee_type)} (${formatDiscount(discountToDelete.discount_amount, discountToDelete.discount_value_type)})`
            : ""
        }
        subMessage="This will revoke the discount waiver for this student. Future invoices will be billed at full price."
        confirmText="Yes, Remove Discount"
        cancelText="Cancel"
      />
    </Box>
  );
}

