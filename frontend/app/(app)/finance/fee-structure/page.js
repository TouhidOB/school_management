"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  FormControl, InputLabel, Select, MenuItem, InputAdornment, Alert,
  Tabs, Tab, Stack, Tooltip, CircularProgress, RadioGroup, FormControlLabel, Radio, Autocomplete
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import RefreshIcon from "@mui/icons-material/Refresh";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function FeeStructurePage() {
  const [activeTab, setActiveTab] = useState(0); // 0: Fee Structures & Allocation, 1: Fee Types

  // Dependencies
  const [feeTypes, setFeeTypes] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);

  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Add Structure Dialog
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [targetType, setTargetType] = useState("all"); // 'all', 'class', or 'student'
  const [selectedFeeType, setSelectedFeeType] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [amount, setAmount] = useState("");
  const [savingStructure, setSavingStructure] = useState(false);

  // Add Fee Type Dialog
  const [feeTypeModalOpen, setFeeTypeModalOpen] = useState(false);
  const [typeName, setTypeName] = useState("");
  const [typeCategory, setTypeCategory] = useState("monthly");
  const [typeFrequency, setTypeFrequency] = useState("monthly");
  const [isMandatory, setIsMandatory] = useState(true);
  const [savingType, setSavingType] = useState(false);

  // Generate Invoices Dialog
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [activeStructure, setActiveStructure] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [invoiceMonth, setInvoiceMonth] = useState(new Date().getMonth() + 1);
  const [generating, setGenerating] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [structureToDelete, setStructureToDelete] = useState(null);
  const [deletingStructure, setDeletingStructure] = useState(false);

  const frequencyChoices = [
    { value: "monthly", label: "Monthly", color: "primary" },
    { value: "yearly", label: "Yearly / Annual", color: "success" },
    { value: "daily", label: "Daily", color: "warning" },
    { value: "seasonal", label: "Seasonal (Term / Exam Fee)", color: "secondary" },
    { value: "onetime", label: "One-time", color: "info" },
  ];

  const categoryChoices = [
    { value: "monthly", label: "Monthly Tuition Fee" },
    { value: "exam", label: "Term / Final Exam Fee" },
    { value: "admission", label: "Admission Fee" },
    { value: "annual", label: "Annual Session Fee" },
    { value: "idcard", label: "ID Card Fee" },
    { value: "transport", label: "Transport Fee" },
    { value: "library", label: "Library Fee" },
    { value: "custom", label: "Custom Fee" },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [typesRes, yearsRes, classesRes, studsRes, structuresRes] = await Promise.all([
        api.get("/fee-types/?page_size=200"),
        api.get("/academic-years/?page_size=100"),
        api.get("/classes/?page_size=200"),
        api.get("/students/?page_size=1000&status=active"),
        api.get("/fee-structures/?page_size=500")
      ]);

      setFeeTypes(typesRes.results || typesRes || []);
      const yrs = yearsRes.results || yearsRes || [];
      setAcademicYears(yrs);
      if (yrs.length > 0 && !selectedYear) {
        const activeYr = yrs.find(y => y.is_current) || yrs[0];
        setSelectedYear(activeYr.id);
      }
      setClasses(classesRes.results || classesRes || []);
      setStudents(studsRes.results || studsRes || []);
      setFeeStructures(structuresRes.results || structuresRes || []);
    } catch (err) {
      console.error("Failed to load fee configuration", err);
      setErrorMsg("Failed to load fee structure records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveFeeType = async () => {
    if (!typeName.trim()) {
      alert("Fee Type Name is required.");
      return;
    }
    setSavingType(true);
    try {
      await api.post("/fee-types/", {
        name: typeName,
        fee_category: typeCategory,
        frequency: typeFrequency,
        is_mandatory: isMandatory,
        is_active: true
      });
      setFeeTypeModalOpen(false);
      setTypeName("");
      setSuccessMsg("Fee Type created successfully.");
      loadData();
    } catch (err) {
      alert("Failed to create fee type.");
    } finally {
      setSavingType(false);
    }
  };

  const handleSaveStructure = async () => {
    if (!selectedFeeType || !selectedYear || !amount || parseFloat(amount) <= 0) {
      alert("Fee Type, Academic Year, and a valid Amount > 0 are required.");
      return;
    }

    if (targetType === "class" && !selectedClass) {
      alert("Please select the target class.");
      return;
    }

    if (targetType === "student" && !selectedStudent) {
      alert("Please select the specific student.");
      return;
    }

    setSavingStructure(true);
    try {
      await api.post("/fee-structures/", {
        fee_type: selectedFeeType,
        academic_year: selectedYear,
        applicable_class: targetType === "class" ? selectedClass : null,
        applicable_student: targetType === "student" ? selectedStudent.id : null,
        amount: parseFloat(amount)
      });
      setStructureModalOpen(false);
      setAmount("");
      setSelectedStudent(null);
      setSelectedClass("");
      setSuccessMsg(
        targetType === "all"
          ? "Fee Amount allocated for ALL students (entire school) successfully."
          : "Fee Amount allocated successfully."
      );
      loadData();
    } catch (err) {
      alert("Failed to allocate fee structure. It may already exist.");
    } finally {
      setSavingStructure(false);
    }
  };

  const promptDeleteStructure = (struct) => {
    setStructureToDelete(struct);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteStructure = async () => {
    if (!structureToDelete) return;
    setDeletingStructure(true);
    try {
      const res = await api.del(`/fee-structures/${structureToDelete.id}/`);
      setDeleteModalOpen(false);
      setStructureToDelete(null);
      setSuccessMsg(res?.message || "Fee structure deleted and associated unpaid dues removed.");
      loadData();
    } catch (err) {
      alert("Failed to delete fee structure.");
    } finally {
      setDeletingStructure(false);
    }
  };

  const openGenerateModal = (struct) => {
    setActiveStructure(struct);
    const today = new Date().toISOString().split("T")[0];
    setInvoiceDate(today);
    // Default due date to 15 days later
    const due = new Date();
    due.setDate(due.getDate() + 15);
    setDueDate(due.toISOString().split("T")[0]);
    setInvoiceMonth(new Date().getMonth() + 1);
    setGenerateModalOpen(true);
  };

  const handleGenerateInvoices = async () => {
    if (!activeStructure) return;
    setGenerating(true);
    try {
      const res = await api.post(`/fee-structures/${activeStructure.id}/generate_invoices/`, {
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        month: invoiceMonth
      });
      setGenerateModalOpen(false);
      setSuccessMsg(res.message || "Invoices generated successfully. Pending dues updated.");
    } catch (err) {
      alert("Failed to generate invoices.");
    } finally {
      setGenerating(false);
    }
  };

  const formatMoney = (val) => {
    return '৳' + parseFloat(val || 0).toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const getFrequencyColor = (freq) => {
    const f = frequencyChoices.find(c => c.value === freq);
    return f ? f.color : "default";
  };

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

      {/* Header and Actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a" }}>
            Fee Structure & Payment Allocation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Set payment amounts per specific class or specific student for Monthly, Yearly, Daily, and Seasonal (Exam) fees.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => setFeeTypeModalOpen(true)}
            startIcon={<AddIcon />}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Create Fee Type
          </Button>
          <Button
            variant="contained"
            onClick={() => setStructureModalOpen(true)}
            startIcon={<AddIcon />}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Allocate Payment Amount
          </Button>
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab label="Fee Structures & Allocations" sx={{ textTransform: "none", fontWeight: 600 }} />
          <Tab label="Fee Types & Categories" sx={{ textTransform: "none", fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* Tab 0: Fee Structures & Allocations */}
      {activeTab === 0 && (
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Fee Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Schedule / Frequency</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Target Allocation</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Amount (BDT)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Action / Billing</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading fee allocations...</Typography>
                    </TableCell>
                  </TableRow>
                ) : feeStructures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      <Typography variant="body1" fontWeight="bold">No fee structures allocated yet.</Typography>
                      <Typography variant="body2">Click &apos;Allocate Payment Amount&apos; to assign fees to classes or specific students.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  feeStructures
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((struct) => (
                      <TableRow key={struct.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>
                          {struct.fee_type_name}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={struct.fee_frequency?.toUpperCase() || "MONTHLY"}
                            size="small"
                            color={getFrequencyColor(struct.fee_frequency)}
                            sx={{ fontWeight: "bold", fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell>
                          {struct.applicable_student ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <PersonIcon fontSize="small" sx={{ color: "#4f46e5" }} />
                              <Box>
                                <Typography variant="body2" fontWeight="bold" sx={{ color: "#4f46e5" }}>
                                  {struct.student_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {struct.student_id} · Roll: {struct.student_roll || "—"}
                                </Typography>
                              </Box>
                            </Box>
                          ) : struct.applicable_class ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <SchoolIcon fontSize="small" sx={{ color: "#0284c7" }} />
                              <Typography variant="body2" fontWeight="600" sx={{ color: "#0284c7" }}>
                                Class: {struct.class_name} (All Students in Class)
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <PeopleAltIcon fontSize="small" sx={{ color: "#16a34a" }} />
                              <Typography variant="body2" fontWeight="bold" sx={{ color: "#16a34a" }}>
                                All Students (Entire School / Universal Fee)
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: "monospace", fontSize: "1rem", color: "#0f172a" }}>
                          {formatMoney(struct.amount)}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<SendIcon />}
                              onClick={() => openGenerateModal(struct)}
                              sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem", py: 0.3 }}
                            >
                              Assign & Generate Invoices
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              title="Delete Fee Structure"
                              onClick={() => promptDeleteStructure(struct)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Stack>
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
            count={feeStructures.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newP) => setPage(newP)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Card>
      )}

      {/* Tab 1: Fee Types */}
      {activeTab === 1 && (
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Fee Type Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Schedule / Frequency</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Mandatory?</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feeTypes.map((ft) => (
                  <TableRow key={ft.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{ft.name}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>{ft.fee_category}</TableCell>
                    <TableCell>
                      <Chip
                        label={ft.frequency?.toUpperCase()}
                        size="small"
                        color={getFrequencyColor(ft.frequency)}
                        sx={{ fontWeight: "bold", fontSize: "0.7rem" }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={ft.is_mandatory ? "YES" : "NO"}
                        size="small"
                        color={ft.is_mandatory ? "primary" : "default"}
                        sx={{ fontWeight: "bold", fontSize: "0.7rem" }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Allocate Payment Amount Dialog */}
      <Dialog open={structureModalOpen} onClose={() => setStructureModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>Allocate Fee Payment Amount</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Fee Type *</InputLabel>
              <Select
                value={selectedFeeType}
                label="Fee Type *"
                onChange={(e) => setSelectedFeeType(e.target.value)}
              >
                {feeTypes.map((ft) => (
                  <MenuItem key={ft.id} value={ft.id}>
                    {ft.name} ({ft.frequency})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Academic Year *</InputLabel>
              <Select
                value={selectedYear}
                label="Academic Year *"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {academicYears.map((yr) => (
                  <MenuItem key={yr.id} value={yr.id}>
                    {yr.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" sx={{ mb: 1 }}>
                TARGET ALLOCATION SCOPE
              </Typography>
              <RadioGroup
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
              >
                <FormControlLabel
                  value="all"
                  control={<Radio color="success" />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <PeopleAltIcon fontSize="small" sx={{ color: "#16a34a" }} />
                      <Typography variant="body2" fontWeight="600" color="#16a34a">
                        All Students (Entire School — Same Amount for Every Student)
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="class"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <SchoolIcon fontSize="small" sx={{ color: "#0284c7" }} />
                      <Typography variant="body2">
                        Specific Class (All Students in that Class)
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="student"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <PersonIcon fontSize="small" sx={{ color: "#4f46e5" }} />
                      <Typography variant="body2">
                        Specific Individual Student
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </Box>

            {targetType === "all" && (
              <Alert severity="info" sx={{ py: 0.5, fontSize: "0.85rem" }}>
                This fee amount will automatically apply to <strong>every student across all classes</strong> in the school.
              </Alert>
            )}

            {targetType === "class" && (
              <FormControl fullWidth size="small">
                <InputLabel>Applicable Class *</InputLabel>
                <Select
                  value={selectedClass}
                  label="Applicable Class *"
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {targetType === "student" && (
              <Autocomplete
                size="small"
                options={students}
                getOptionLabel={(s) => `${s.full_name} (${s.admission_number || `ID-${s.id}`}) - Roll: ${s.roll_number || '—'}`}
                value={selectedStudent}
                onChange={(e, val) => setSelectedStudent(val)}
                renderInput={(params) => (
                  <TextField {...params} label="Search Student (Name, ID, Roll) *" />
                )}
              />
            )}

            <TextField
              fullWidth
              size="small"
              label="Payment Amount (BDT ৳) *"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">৳</InputAdornment>
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setStructureModalOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveStructure} variant="contained" disabled={savingStructure}>
            {savingStructure ? "Saving..." : "Save Allocation"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Fee Type Dialog */}
      <Dialog open={feeTypeModalOpen} onClose={() => setFeeTypeModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>Create Fee Type</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="Fee Name *"
              placeholder="e.g. 1st Term Final Exam Fee"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={typeCategory}
                label="Category"
                onChange={(e) => setTypeCategory(e.target.value)}
              >
                {categoryChoices.map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Schedule / Frequency *</InputLabel>
              <Select
                value={typeFrequency}
                label="Schedule / Frequency *"
                onChange={(e) => setTypeFrequency(e.target.value)}
              >
                {frequencyChoices.map((f) => (
                  <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setFeeTypeModalOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveFeeType} variant="contained" disabled={savingType}>
            {savingType ? "Creating..." : "Create Fee Type"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Invoices Dialog */}
      <Dialog open={generateModalOpen} onClose={() => setGenerateModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>Assign & Generate Invoices</DialogTitle>
        <DialogContent dividers>
          {activeStructure && (
            <Stack spacing={2}>
              <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                <Typography variant="caption" color="text.secondary" display="block">Fee Item</Typography>
                <Typography variant="body2" fontWeight="bold">{activeStructure.fee_type_name}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>Amount</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ color: "#0f172a" }}>{formatMoney(activeStructure.amount)}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>Target</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ color: activeStructure.applicable_student ? "#4f46e5" : activeStructure.applicable_class ? "#0284c7" : "#16a34a" }}>
                  {activeStructure.applicable_student 
                    ? `Student: ${activeStructure.student_name} (${activeStructure.student_id})` 
                    : activeStructure.applicable_class
                    ? `Class: ${activeStructure.class_name} (All Students in Class)`
                    : `All Students (Entire School / Universal Fee)`}
                </Typography>
              </Box>

              <TextField
                fullWidth
                size="small"
                label="Invoice Date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                size="small"
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Billing Month</InputLabel>
                <Select
                  value={invoiceMonth}
                  label="Billing Month"
                  onChange={(e) => setInvoiceMonth(e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setGenerateModalOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleGenerateInvoices} 
            variant="contained" 
            color="primary"
            disabled={generating}
            startIcon={<SendIcon />}
          >
            {generating ? "Generating..." : "Generate Invoices Now"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bootstrap-Style Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteStructure}
        loading={deletingStructure}
        title="Confirm Fee Structure Deletion"
        message="Are you sure you want to permanently delete this fee structure allocation?"
        itemName={
          structureToDelete
            ? `${structureToDelete.fee_type_name} — ৳${structureToDelete.amount} (${
                structureToDelete.applicable_student
                  ? `Student: ${structureToDelete.student_name}`
                  : structureToDelete.applicable_class
                  ? `Class: ${structureToDelete.class_name}`
                  : "All Students (Entire School)"
              })`
            : ""
        }
        subMessage="Deleting this fee structure will automatically cancel and remove any unpaid dues generated from it from the students' accounts. Any payments already collected will remain preserved."
        confirmText="Yes, Delete Structure"
        cancelText="Cancel"
      />
    </Box>
  );
}
