"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  TextField,
  InputAdornment,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Checkbox,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Divider,
} from "@mui/material";

import SchoolIcon from "@mui/icons-material/School";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

export default function ExStudentsBatchesPage() {
  const router = useRouter();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  // Batch create/edit dialog state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({
    name: "",
    passing_year: new Date().getFullYear(),
    graduating_class: "",
    academic_year: "",
    graduation_date: "",
    description: "",
  });
  const [batchFormSubmitting, setBatchFormSubmitting] = useState(false);
  const [batchFormError, setBatchFormError] = useState("");

  // Bulk graduation wizard modal state
  const [gradModalOpen, setGradModalOpen] = useState(false);
  const [gradStep, setGradStep] = useState(1);
  const [gradClass, setGradClass] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [gradStudents, setGradStudents] = useState([]);
  const [gradStudentsLoading, setGradStudentsLoading] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [targetBatchId, setTargetBatchId] = useState("");
  const [newBatchName, setNewBatchName] = useState("");
  const [defaultResult, setDefaultResult] = useState("GPA 5.00");
  const [studentResults, setStudentResults] = useState({});
  const [gradSubmitting, setGradSubmitting] = useState(false);
  const [gradError, setGradError] = useState("");
  const [gradSuccessMsg, setGradSuccessMsg] = useState("");

  // Load lookup data
  useEffect(() => {
    api.get("/classes/?page_size=200").then(res => setClasses(res.results || res || [])).catch(() => {});
    api.get("/academic-years/?page_size=200").then(res => {
      const list = res.results || res || [];
      setAcademicYears(list);
      const curr = list.find(y => y.is_current);
      if (curr) {
        setBatchForm(prev => ({ ...prev, academic_year: curr.id }));
        setGradYear(String(curr.id));
      }
    }).catch(() => {});
  }, []);

  // Load batches list
  const loadBatches = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page_size: "200" });
    if (search) params.set("search", search);
    if (selectedYear && selectedYear !== "all") params.set("passing_year", selectedYear);

    api.get(`/passing-batches/?${params}`)
      .then(res => {
        setBatches(res.results || res || []);
      })
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }, [search, selectedYear]);

  useEffect(() => {
    const t = setTimeout(loadBatches, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadBatches, search]);

  // Compute metrics
  const totalBatches = batches.length;
  const totalAlumni = batches.reduce((acc, b) => acc + (b.total_students || 0), 0);
  const distinctYears = Array.from(new Set(batches.map(b => b.passing_year))).sort((a, b) => b - a);

  // Batch Create / Edit Handlers
  const handleOpenBatchModal = (batch = null) => {
    setEditingBatch(batch);
    if (batch) {
      setBatchForm({
        name: batch.name || "",
        passing_year: batch.passing_year || new Date().getFullYear(),
        graduating_class: batch.graduating_class || "",
        academic_year: batch.academic_year || "",
        graduation_date: batch.graduation_date || "",
        description: batch.description || "",
      });
    } else {
      const currYear = academicYears.find(y => y.is_current);
      setBatchForm({
        name: `Batch ${new Date().getFullYear()}`,
        passing_year: new Date().getFullYear(),
        graduating_class: classes.length > 0 ? classes[classes.length - 1].id : "",
        academic_year: currYear ? currYear.id : "",
        graduation_date: new Date().toISOString().split("T")[0],
        description: "",
      });
    }
    setBatchFormError("");
    setBatchModalOpen(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (!batchForm.name || !batchForm.passing_year) {
      setBatchFormError("Batch name and passing year are required.");
      return;
    }
    setBatchFormSubmitting(true);
    setBatchFormError("");
    try {
      const payload = {
        name: batchForm.name,
        passing_year: parseInt(batchForm.passing_year, 10),
        graduating_class: batchForm.graduating_class || null,
        academic_year: batchForm.academic_year || null,
        graduation_date: batchForm.graduation_date || null,
        description: batchForm.description || "",
      };
      if (editingBatch) {
        await api.patch(`/passing-batches/${editingBatch.id}/`, payload);
      } else {
        await api.post("/passing-batches/", payload);
      }
      setBatchModalOpen(false);
      loadBatches();
    } catch (err) {
      setBatchFormError(err.data?.name?.[0] || err.data?.detail || err.message || "Failed to save batch.");
    } finally {
      setBatchFormSubmitting(false);
    }
  };

  const handleDeleteBatch = async (e, batch) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${batch.name}"? This will unlink its ex-students.`)) return;
    try {
      await api.del(`/passing-batches/${batch.id}/`);
      loadBatches();
    } catch (err) {
      alert("Failed to delete batch: " + (err.message || "Unknown error"));
    }
  };

  // Graduation Wizard Handlers
  const handleOpenGradWizard = () => {
    setGradStep(1);
    setGradStudents([]);
    setSelectedStudentIds([]);
    setTargetBatchId("");
    setNewBatchName("");
    setDefaultResult("GPA 5.00");
    setStudentResults({});
    setGradError("");
    setGradSuccessMsg("");
    setGradModalOpen(true);
  };

  const handleFetchStudentsForGrad = async () => {
    if (!gradClass) {
      setGradError("Please select a graduating class.");
      return;
    }
    setGradStudentsLoading(true);
    setGradError("");
    try {
      const params = new URLSearchParams({
        current_class: gradClass,
        status: "active",
        page_size: "300",
      });
      if (gradYear) params.set("academic_year", gradYear);
      const res = await api.get(`/students/?${params}`);
      const list = res.results || res || [];
      setGradStudents(list);
      setSelectedStudentIds(list.map(s => s.id));
      const initialResults = {};
      list.forEach(s => {
        initialResults[s.id] = defaultResult;
      });
      setStudentResults(initialResults);
      setGradStep(2);
    } catch (err) {
      setGradError("Failed to fetch students: " + (err.message || "Error"));
    } finally {
      setGradStudentsLoading(false);
    }
  };

  const handleSelectAllStudents = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(gradStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkGraduate = async () => {
    if (selectedStudentIds.length === 0) {
      setGradError("Please select at least one student to graduate.");
      return;
    }

    let batchId = targetBatchId;
    setGradSubmitting(true);
    setGradError("");

    try {
      // If user wants to create a new batch during wizard
      if (targetBatchId === "NEW") {
        if (!newBatchName.trim()) {
          setGradError("Please enter a name for the new batch.");
          setGradSubmitting(false);
          return;
        }
        const newBatchRes = await api.post("/passing-batches/", {
          name: newBatchName.trim(),
          passing_year: new Date().getFullYear(),
          graduating_class: gradClass || null,
          academic_year: gradYear || null,
          graduation_date: new Date().toISOString().split("T")[0],
          description: `Graduating cohort from ${classes.find(c => String(c.id) === String(gradClass))?.name || "Class"}`,
        });
        batchId = newBatchRes.id;
      } else if (!batchId) {
        setGradError("Please select an existing batch or choose to create a new one.");
        setGradSubmitting(false);
        return;
      }

      const res = await api.post(`/passing-batches/${batchId}/graduate_class/`, {
        student_ids: selectedStudentIds,
        results: studentResults,
        default_result: defaultResult,
        graduation_date: new Date().toISOString().split("T")[0],
      });

      setGradSuccessMsg(res.message || `Successfully graduated ${selectedStudentIds.length} students!`);
      loadBatches();
      setTimeout(() => {
        setGradModalOpen(false);
        router.push(`/ex-students/${batchId}`);
      }, 1200);
    } catch (err) {
      setGradError(err.data?.error || err.message || "Graduation failed.");
    } finally {
      setGradSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Top Breadcrumb & Title */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight="800" color="text.primary">
              Ex-Students & Batches
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Directory of graduating cohorts, passing batches, academic results, and alumni career tracking.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<GroupAddIcon />}
            onClick={handleOpenGradWizard}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            Graduate Class to Batch
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenBatchModal()}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, boxShadow: 2 }}
          >
            New Passing Batch
          </Button>
        </Box>
      </Box>

      {/* Summary KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Total Batches
                </Typography>
                <Typography variant="h4" fontWeight={800} color="primary.main">
                  {totalBatches}
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: "primary.lighter", borderRadius: 2, color: "primary.main" }}>
                <SchoolIcon />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Total Ex-Students
                </Typography>
                <Typography variant="h4" fontWeight={800} color="secondary.main">
                  {totalAlumni}
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: "secondary.lighter", borderRadius: 2, color: "secondary.main" }}>
                <PeopleAltIcon />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Latest Cohort
                </Typography>
                <Typography variant="h5" fontWeight={800} color="text.primary" noWrap>
                  {batches[0]?.name || "None yet"}
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: "success.lighter", borderRadius: 2, color: "success.main" }}>
                <CalendarMonthIcon />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Alumni Status
                </Typography>
                <Typography variant="h5" fontWeight={800} color="warning.main">
                  Active
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: "warning.lighter", borderRadius: 2, color: "warning.main" }}>
                <WorkspacePremiumIcon />
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Search batches by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: { xs: "1 1 100%", md: "1 1 350px" } }}
          />

          <TextField
            select
            size="small"
            label="Passing Year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All Passing Years</MenuItem>
            {distinctYears.map(yr => (
              <MenuItem key={yr} value={yr}>Year {yr}</MenuItem>
            ))}
          </TextField>

          <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
            Showing <strong>{batches.length}</strong> {batches.length === 1 ? "batch" : "batches"}
          </Typography>
        </Box>
      </Card>

      {/* Batch Cards Grid */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : batches.length === 0 ? (
        <Card elevation={0} sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 3, p: 6, textAlign: "center" }}>
          <SchoolIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" fontWeight={700} color="text.secondary">
            No Passing Batches Found
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 450, mx: "auto", mt: 1, mb: 3 }}>
            Create your first passing batch to start organizing ex-students by their graduation year, class, and results.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenBatchModal()}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Create Passing Batch
            </Button>
            <Button
              variant="outlined"
              startIcon={<GroupAddIcon />}
              onClick={handleOpenGradWizard}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Graduate a Class
            </Button>
          </Box>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {batches.map((batch) => (
            <Grid item xs={12} sm={6} md={4} key={batch.id}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  transition: "all 0.25s ease-in-out",
                  overflow: "hidden",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    transform: "translateY(-3px)",
                  },
                }}
              >
                {/* Header Banner */}
                <Box
                  sx={{
                    background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                    color: "#fff",
                    p: 2.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Chip
                      label={`Year ${batch.passing_year}`}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.18)",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        mb: 1,
                      }}
                    />
                    <Typography variant="h6" fontWeight={800} sx={{ color: "#fff", lineHeight: 1.2 }}>
                      {batch.name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Edit Batch Info">
                      <IconButton
                        size="small"
                        sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff" } }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBatchModal(batch);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Batch">
                      <IconButton
                        size="small"
                        sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#f87171" } }}
                        onClick={(e) => handleDeleteBatch(e, batch)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, mb: 2 }}>
                    {batch.graduating_class_name && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" color="text.secondary">Graduating Class:</Typography>
                        <Typography variant="body2" fontWeight={600}>{batch.graduating_class_name}</Typography>
                      </Box>
                    )}

                    {batch.academic_year_name && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" color="text.secondary">Academic Session:</Typography>
                        <Typography variant="body2">{batch.academic_year_name}</Typography>
                      </Box>
                    )}

                    {batch.graduation_date && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" color="text.secondary">Graduation Date:</Typography>
                        <Typography variant="body2">{batch.graduation_date}</Typography>
                      </Box>
                    )}

                    {batch.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", mt: 0.5 }}>
                        "{batch.description}"
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Chip
                      icon={<PeopleAltIcon fontSize="small" />}
                      label={`${batch.total_students || 0} Ex-Students`}
                      color={batch.total_students > 0 ? "primary" : "default"}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />

                    <Button
                      component={Link}
                      href={`/ex-students/${batch.id}`}
                      variant="text"
                      color="primary"
                      endIcon={<ArrowForwardIcon />}
                      size="small"
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      View Students
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal: Create or Edit Batch */}
      <Dialog open={batchModalOpen} onClose={() => setBatchModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveBatch}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingBatch ? `Edit Batch: ${editingBatch.name}` : "Create New Passing Batch"}
          </DialogTitle>
          <DialogContent dividers>
            {batchFormError && (
              <Alert severity="error" sx={{ mb: 2 }}>{batchFormError}</Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <TextField
                label="Batch Name"
                placeholder="e.g. SSC Batch 2024, Class 10 Passing Out 2023"
                value={batchForm.name}
                onChange={(e) => setBatchForm(prev => ({ ...prev, name: e.target.value }))}
                required
                fullWidth
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Passing Year"
                    type="number"
                    value={batchForm.passing_year}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, passing_year: e.target.value }))}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Graduation Date"
                    type="date"
                    value={batchForm.graduation_date}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, graduation_date: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Graduating Class"
                    value={batchForm.graduating_class}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, graduating_class: e.target.value }))}
                    fullWidth
                  >
                    <MenuItem value="">-- None / General --</MenuItem>
                    {classes.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Academic Year"
                    value={batchForm.academic_year}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, academic_year: e.target.value }))}
                    fullWidth
                  >
                    <MenuItem value="">-- Select Academic Year --</MenuItem>
                    {academicYears.map(y => (
                      <MenuItem key={y.id} value={y.id}>{y.name} {y.is_current ? "(Current)" : ""}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <TextField
                label="Batch Description / Motto / Notes"
                multiline
                rows={3}
                placeholder="e.g. Golden jubilee batch with 100% pass rate in board exams..."
                value={batchForm.description}
                onChange={(e) => setBatchForm(prev => ({ ...prev, description: e.target.value }))}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setBatchModalOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={batchFormSubmitting}
              sx={{ fontWeight: 600, minWidth: 120 }}
            >
              {batchFormSubmitting ? <CircularProgress size={22} /> : editingBatch ? "Save Changes" : "Create Batch"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal: Bulk Class Graduation Wizard */}
      <Dialog open={gradModalOpen} onClose={() => setGradModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <WorkspacePremiumIcon color="primary" />
          Bulk Class Graduation Wizard (Step {gradStep} of 2)
        </DialogTitle>
        <DialogContent dividers>
          {gradError && <Alert severity="error" sx={{ mb: 2 }}>{gradError}</Alert>}
          {gradSuccessMsg && <Alert severity="success" sx={{ mb: 2 }}>{gradSuccessMsg}</Alert>}

          {gradStep === 1 ? (
            <Box sx={{ py: 1, display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Typography variant="body2" color="text.secondary">
                Select the outgoing academic session and class level (e.g. Class 10 or Class 12).
                The system will pull all active students so you can review and assign them to a Passing Batch.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Academic Year"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    required
                    fullWidth
                  >
                    {academicYears.map(y => (
                      <MenuItem key={y.id} value={String(y.id)}>{y.name} {y.is_current ? "(Current)" : ""}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Graduating Class"
                    value={gradClass}
                    onChange={(e) => setGradClass(e.target.value)}
                    required
                    fullWidth
                  >
                    <MenuItem value="">-- Select Class --</MenuItem>
                    {classes.map(c => (
                      <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, border: "1px dashed", borderColor: "divider" }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                  What happens upon graduation?
                </Typography>
                <Typography variant="caption" color="text.secondary" component="ul" sx={{ pl: 2, mt: 0.5, mb: 0 }}>
                  <li>Student status transitions from <strong>Active</strong> to <strong>Alumni</strong>.</li>
                  <li>An official <strong>Alumni Profile</strong> is created preserving their final passing roll, GPA/grade, and contact info.</li>
                  <li>Their past attendance, marksheets, and invoices are 100% preserved.</li>
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ py: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Review Students to Graduate ({selectedStudentIds.length} of {gradStudents.length} selected)
                </Typography>

                <TextField
                  label="Default Passing Result"
                  size="small"
                  value={defaultResult}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDefaultResult(val);
                    const updated = { ...studentResults };
                    gradStudents.forEach(st => {
                      if (!updated[st.id] || updated[st.id] === defaultResult) {
                        updated[st.id] = val;
                      }
                    });
                    setStudentResults(updated);
                  }}
                  sx={{ width: 180 }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Assign to Passing Batch"
                    value={targetBatchId}
                    onChange={(e) => setTargetBatchId(e.target.value)}
                    required
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="">-- Select Target Batch --</MenuItem>
                    <MenuItem value="NEW" sx={{ fontWeight: 700, color: "primary.main" }}>
                      + Create New Batch on the Fly
                    </MenuItem>
                    {batches.map(b => (
                      <MenuItem key={b.id} value={b.id}>{b.name} (Year {b.passing_year})</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {targetBatchId === "NEW" && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="New Batch Name"
                      placeholder="e.g. SSC Batch 2024"
                      value={newBatchName}
                      onChange={(e) => setNewBatchName(e.target.value)}
                      required
                      fullWidth
                      size="small"
                    />
                  </Grid>
                )}
              </Grid>

              {/* Students Checkbox Table */}
              <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 320, border: "1px solid", borderColor: "divider" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedStudentIds.length === gradStudents.length && gradStudents.length > 0}
                          indeterminate={selectedStudentIds.length > 0 && selectedStudentIds.length < gradStudents.length}
                          onChange={handleSelectAllStudents}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Roll</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Admission No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Final Result / GPA</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gradStudents.map(student => (
                      <TableRow key={student.id} hover selected={selectedStudentIds.includes(student.id)}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => handleToggleStudent(student.id)}
                          />
                        </TableCell>
                        <TableCell>{student.roll_number || "—"}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{student.full_name}</TableCell>
                        <TableCell>{student.admission_number}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            variant="standard"
                            value={studentResults[student.id] || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setStudentResults(prev => ({ ...prev, [student.id]: v }));
                            }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {gradStep === 2 && (
            <Button onClick={() => setGradStep(1)} color="inherit" sx={{ mr: "auto" }}>
              Back
            </Button>
          )}
          <Button onClick={() => setGradModalOpen(false)} color="inherit">
            Cancel
          </Button>
          {gradStep === 1 ? (
            <Button
              variant="contained"
              onClick={handleFetchStudentsForGrad}
              disabled={gradStudentsLoading || !gradClass}
              sx={{ fontWeight: 600 }}
            >
              {gradStudentsLoading ? <CircularProgress size={22} /> : "Next: Review Students"}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleBulkGraduate}
              disabled={gradSubmitting || selectedStudentIds.length === 0}
              sx={{ fontWeight: 700, minWidth: 150 }}
            >
              {gradSubmitting ? <CircularProgress size={22} /> : `Confirm Graduation (${selectedStudentIds.length})`}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
