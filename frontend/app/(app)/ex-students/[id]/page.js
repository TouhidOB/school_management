"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Avatar,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkIcon from "@mui/icons-material/Work";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import AddIcon from "@mui/icons-material/Add";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import VerifiedIcon from "@mui/icons-material/Verified";

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id;

  const [batch, setBatch] = useState(null);
  const [loadingBatch, setLoadingBatch] = useState(true);
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [page, setPage] = useState(1);

  // Modals
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    passing_roll: "",
    passing_result: "",
    current_status: "higher_study",
    current_institution: "",
    current_occupation: "",
    contact_phone: "",
    contact_email: "",
    current_city: "",
    achievements: "",
    notes: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // Add Student to Batch Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateStudents, setCandidateStudents] = useState([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [selectedStudentForBatch, setSelectedStudentForBatch] = useState(null);
  const [addResult, setAddResult] = useState("GPA 5.00");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  // Load Batch Details
  const loadBatch = useCallback(() => {
    if (!batchId) return;
    setLoadingBatch(true);
    api.get(`/passing-batches/${batchId}/`)
      .then(setBatch)
      .catch((err) => {
        alert("Failed to load batch: " + (err.message || "Not found"));
        router.push("/ex-students");
      })
      .finally(() => setLoadingBatch(false));
  }, [batchId, router]);

  useEffect(() => {
    loadBatch();
  }, [loadBatch]);

  // Load Students for this Batch
  const loadStudents = useCallback(() => {
    if (!batchId) return;
    setLoadingStudents(true);
    const query = new URLSearchParams({
      page: String(page),
      page_size: "50",
    });
    if (search) query.set("search", search);
    if (statusFilter && statusFilter !== "all") query.set("current_status", statusFilter);

    api.get(`/passing-batches/${batchId}/students/?${query}`)
      .then((res) => {
        if (res.results) {
          setStudents(res.results);
          setTotalCount(res.count || res.results.length);
        } else if (Array.isArray(res)) {
          setStudents(res);
          setTotalCount(res.length);
        }
      })
      .catch(() => {
        setStudents([]);
        setTotalCount(0);
      })
      .finally(() => setLoadingStudents(false));
  }, [batchId, page, search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(loadStudents, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadStudents, search]);

  // View Modal Handler
  const handleOpenViewModal = (alumni) => {
    setSelectedAlumni(alumni);
    setViewModalOpen(true);
  };

  // Edit Modal Handler
  const handleOpenEditModal = (alumni) => {
    setSelectedAlumni(alumni);
    setEditForm({
      passing_roll: alumni.passing_roll || "",
      passing_result: alumni.passing_result || "",
      current_status: alumni.current_status || "higher_study",
      current_institution: alumni.current_institution || "",
      current_occupation: alumni.current_occupation || "",
      contact_phone: alumni.contact_phone || "",
      contact_email: alumni.contact_email || "",
      current_city: alumni.current_city || "",
      achievements: alumni.achievements || "",
      notes: alumni.notes || "",
    });
    setEditError("");
    setEditModalOpen(true);
  };

  const handleSaveAlumniEdit = async (e) => {
    e.preventDefault();
    if (!selectedAlumni) return;
    setEditSubmitting(true);
    setEditError("");
    try {
      await api.patch(`/alumni-profiles/${selectedAlumni.id}/`, editForm);
      setEditModalOpen(false);
      loadStudents();
    } catch (err) {
      setEditError(err.data?.detail || err.message || "Failed to update profile.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Add Student to Batch Handlers
  const handleSearchCandidates = useCallback(async () => {
    if (!candidateSearch.trim()) return;
    setCandidateLoading(true);
    setAddError("");
    try {
      const res = await api.get(`/students/?search=${encodeURIComponent(candidateSearch)}&page_size=20`);
      setCandidateStudents(res.results || res || []);
    } catch (err) {
      setAddError("Search failed: " + err.message);
    } finally {
      setCandidateLoading(false);
    }
  }, [candidateSearch]);

  const handleAddStudentToBatch = async () => {
    if (!selectedStudentForBatch) {
      setAddError("Please select a student.");
      return;
    }
    setAddSubmitting(true);
    setAddError("");
    try {
      await api.post("/alumni-profiles/", {
        batch: batchId,
        student: selectedStudentForBatch.id,
        passing_roll: selectedStudentForBatch.roll_number || "",
        passing_result: addResult,
        contact_phone: selectedStudentForBatch.emergency_contact || "",
        current_city: selectedStudentForBatch.present_zilla || "",
      });
      setAddModalOpen(false);
      setSelectedStudentForBatch(null);
      setCandidateSearch("");
      setCandidateStudents([]);
      loadStudents();
      loadBatch();
    } catch (err) {
      setAddError(err.data?.student?.[0] || err.data?.detail || err.message || "Failed to add student to batch.");
    } finally {
      setAddSubmitting(false);
    }
  };

  // Print Batch Directory Handler
  const handlePrint = () => {
    window.print();
  };

  if (loadingBatch) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!batch) return null;

  const totalPages = Math.ceil(totalCount / 50) || 1;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Back button & Breadcrumbs */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <Button
          component={Link}
          href="/ex-students"
          startIcon={<ArrowBackIcon />}
          sx={{ textTransform: "none", color: "text.secondary", fontWeight: 600 }}
        >
          All Batches
        </Button>
        <Typography variant="body2" color="text.disabled">/</Typography>
        <Typography variant="body2" color="primary.main" fontWeight={600}>
          {batch.name}
        </Typography>
      </Box>

      {/* Hero Header Banner */}
      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          mb: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
            color: "#fff",
            p: { xs: 2.5, md: 3.5 },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Chip
                  label={`Passing Year ${batch.passing_year}`}
                  size="small"
                  sx={{ bgcolor: "primary.main", color: "#fff", fontWeight: 700 }}
                />
                {batch.academic_year_name && (
                  <Chip
                    label={`Session: ${batch.academic_year_name}`}
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff" }}
                  />
                )}
                {batch.graduating_class_name && (
                  <Chip
                    label={`Class: ${batch.graduating_class_name}`}
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff" }}
                  />
                )}
              </Box>

              <Typography variant="h3" fontWeight={800} sx={{ color: "#fff", letterSpacing: "-0.5px" }}>
                {batch.name}
              </Typography>

              {batch.description && (
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 1, maxWidth: 650 }}>
                  "{batch.description}"
                </Typography>
              )}
            </Box>

            {/* Quick Action Buttons */}
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.4)",
                  "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" },
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                }}
                startIcon={<PrintIcon />}
                onClick={handlePrint}
              >
                Print Roster
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setAddModalOpen(true)}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
              >
                Add Ex-Student
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Sub-bar with stats */}
        <Box sx={{ p: 2, bgcolor: "background.paper", display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolIcon color="primary" />
            <Typography variant="body2">
              Total Graduates: <strong>{totalCount}</strong>
            </Typography>
          </Box>
          {batch.graduation_date && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Graduation Date: <strong>{batch.graduation_date}</strong>
              </Typography>
            </Box>
          )}
        </Box>
      </Card>

      {/* Control Bar: Search, Status Filter, View Toggle */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", flex: { xs: "1 1 100%", md: "0 1 600px" } }}>
            <TextField
              size="small"
              placeholder="Search by student name, roll, admission no, university, job..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 260 }}
            />

            <TextField
              select
              size="small"
              label="Current Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="higher_study">Higher Study</MenuItem>
              <MenuItem value="employed">Employed / Job</MenuItem>
              <MenuItem value="business">Business</MenuItem>
              <MenuItem value="preparing">Preparing for Admission</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              View Mode:
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(e, val) => val && setViewMode(val)}
            >
              <ToggleButton value="table" aria-label="table view">
                <ViewListIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="cards" aria-label="cards view">
                <ViewModuleIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Card>

      {/* Student List View */}
      {loadingStudents ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : students.length === 0 ? (
        <Card elevation={0} sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 3, p: 6, textAlign: "center" }}>
          <SchoolIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} color="text.secondary">
            No Ex-Students Found in this Batch
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 400, mx: "auto", mt: 0.5, mb: 2.5 }}>
            {search || statusFilter !== "all"
              ? "No students match your filter criteria. Try clearing search keywords."
              : "This batch currently has no registered alumni. Use the 'Add Ex-Student' button to add alumni."}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            Add Student to Batch
          </Button>
        </Card>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "grey.50" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 80 }}>Roll</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Admission No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Final Result</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Current Placement</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 120 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((alumni) => (
                  <TableRow key={alumni.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        #{alumni.passing_roll || "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          src={alumni.student_photo || undefined}
                          sx={{ width: 40, height: 40, bgcolor: "primary.main", fontWeight: 700 }}
                        >
                          {alumni.student_name?.[0] || "S"}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                            {alumni.student_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alumni.gender ? alumni.gender.toUpperCase() : ""} {alumni.blood_group ? `• ${alumni.blood_group}` : ""}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {alumni.admission_number || "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={alumni.passing_result || "Passed"}
                        size="small"
                        color={
                          alumni.passing_result?.includes("5.0") || alumni.passing_result?.includes("A+")
                            ? "success"
                            : "default"
                        }
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="text.primary">
                          {alumni.current_institution || alumni.current_status_display || "Not specified"}
                        </Typography>
                        {alumni.current_occupation && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {alumni.current_occupation}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
                        {alumni.contact_phone && (
                          <Typography variant="caption" color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                            {alumni.contact_phone}
                          </Typography>
                        )}
                        {alumni.contact_email && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                            {alumni.contact_email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary" onClick={() => handleOpenViewModal(alumni)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Placement Info">
                          <IconButton size="small" color="secondary" onClick={() => handleOpenEditModal(alumni)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
              <Pagination count={totalPages} page={page} onChange={(e, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </Card>
      ) : (
        /* YEARBOOK CARD GRID VIEW */
        <Box>
          <Grid container spacing={2.5}>
            {students.map((alumni) => (
              <Grid item xs={12} sm={6} md={4} key={alumni.id}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    p: 2.5,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
                    <Avatar
                      src={alumni.student_photo || undefined}
                      sx={{ width: 56, height: 56, bgcolor: "primary.main", fontSize: 22, fontWeight: 700 }}
                    >
                      {alumni.student_name?.[0] || "S"}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={800} color="text.primary" noWrap>
                        {alumni.student_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Roll: <strong>#{alumni.passing_roll || "—"}</strong> • {alumni.admission_number}
                      </Typography>
                      <Chip
                        label={alumni.passing_result || "Passed"}
                        size="small"
                        color={
                          alumni.passing_result?.includes("5.0") || alumni.passing_result?.includes("A+")
                            ? "success"
                            : "default"
                        }
                        sx={{ mt: 0.5, fontWeight: 700, height: 22, fontSize: "0.7rem" }}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, my: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <SchoolIcon sx={{ fontSize: 16, color: "primary.main", mt: 0.3 }} />
                      <Typography variant="body2" color="text.primary" fontWeight={600}>
                        {alumni.current_institution || "Institution not listed"}
                      </Typography>
                    </Box>

                    {alumni.current_occupation && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <WorkIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                          {alumni.current_occupation}
                        </Typography>
                      </Box>
                    )}

                    {alumni.contact_phone && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                          {alumni.contact_phone}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1.5, mt: "auto", borderTop: "1px dashed", borderColor: "divider" }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenViewModal(alumni)}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      View Details
                    </Button>
                    <IconButton size="small" color="secondary" onClick={() => handleOpenEditModal(alumni)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
              <Pagination count={totalPages} page={page} onChange={(e, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </Box>
      )}

      {/* Modal 1: View Alumni Details */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="sm" fullWidth>
        {selectedAlumni && (
          <>
            <DialogTitle sx={{ fontWeight: 800, pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                src={selectedAlumni.student_photo || undefined}
                sx={{ width: 44, height: 44, bgcolor: "primary.main", fontWeight: 700 }}
              >
                {selectedAlumni.student_name?.[0] || "S"}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {selectedAlumni.student_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {batch.name} • Passing Roll #{selectedAlumni.passing_roll || "—"}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Academic Snapshot */}
                <Box sx={{ p: 2, bgcolor: "primary.lighter", borderRadius: 2 }}>
                  <Typography variant="caption" color="primary.dark" fontWeight={700} textTransform="uppercase">
                    Academic Graduation Record
                  </Typography>
                  <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Admission Number:</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedAlumni.admission_number || "—"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Final Result / GPA:</Typography>
                      <Typography variant="body2" fontWeight={700} color="success.main">
                        {selectedAlumni.passing_result || "Passed"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Batch & Passing Year:</Typography>
                      <Typography variant="body2">{batch.name} ({batch.passing_year})</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Graduating Class:</Typography>
                      <Typography variant="body2">{batch.graduating_class_name || "General"}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Current Placement & Career */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                    Current Placement & Higher Studies
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Current Status:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedAlumni.current_status_display || "Higher Study"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">College / University / Org:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedAlumni.current_institution || "—"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Occupation / Major:</Typography>
                      <Typography variant="body2">{selectedAlumni.current_occupation || "—"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Current City / Location:</Typography>
                      <Typography variant="body2">{selectedAlumni.current_city || "—"}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Contact Information */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                    Contact Information
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Phone Number:</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedAlumni.contact_phone || "—"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Email Address:</Typography>
                      <Typography variant="body2">{selectedAlumni.contact_email || "—"}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {selectedAlumni.achievements && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                      Awards & Achievements
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedAlumni.achievements}
                    </Typography>
                  </Box>
                )}

                {selectedAlumni.notes && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                      Testimonial & Remarks
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                      "{selectedAlumni.notes}"
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<EditIcon />}
                onClick={() => {
                  setViewModalOpen(false);
                  handleOpenEditModal(selectedAlumni);
                }}
              >
                Edit Info
              </Button>
              <Button onClick={() => setViewModalOpen(false)} variant="contained">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal 2: Edit Alumni Info */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveAlumniEdit}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            Update Alumni Information: {selectedAlumni?.student_name}
          </DialogTitle>
          <DialogContent dividers>
            {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Final Passing Roll"
                    value={editForm.passing_roll}
                    onChange={(e) => setEditForm(prev => ({ ...prev, passing_roll: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Final Result / GPA"
                    placeholder="e.g. GPA 5.00, A+, First Div"
                    value={editForm.passing_result}
                    onChange={(e) => setEditForm(prev => ({ ...prev, passing_result: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <TextField
                select
                label="Current Engagement Status"
                value={editForm.current_status}
                onChange={(e) => setEditForm(prev => ({ ...prev, current_status: e.target.value }))}
                fullWidth
                size="small"
              >
                <MenuItem value="higher_study">Higher Study / College / University</MenuItem>
                <MenuItem value="employed">Employed / Working</MenuItem>
                <MenuItem value="business">Business / Entrepreneurship</MenuItem>
                <MenuItem value="preparing">Preparing for Admission / Exams</MenuItem>
                <MenuItem value="other">Other / Undisclosed</MenuItem>
              </TextField>

              <TextField
                label="College / University / Organization"
                placeholder="e.g. Notre Dame College, University of Dhaka, BUET"
                value={editForm.current_institution}
                onChange={(e) => setEditForm(prev => ({ ...prev, current_institution: e.target.value }))}
                fullWidth
                size="small"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Occupation / Major / Field"
                    placeholder="e.g. Computer Science, Medical, Engineering"
                    value={editForm.current_occupation}
                    onChange={(e) => setEditForm(prev => ({ ...prev, current_occupation: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Current City / Residence"
                    placeholder="e.g. Dhaka, Chittagong, Sylhet"
                    value={editForm.current_city}
                    onChange={(e) => setEditForm(prev => ({ ...prev, current_city: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Updated Phone Number"
                    value={editForm.contact_phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Updated Email"
                    type="email"
                    value={editForm.contact_email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, contact_email: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <TextField
                label="Honors & Achievements"
                multiline
                rows={2}
                placeholder="e.g. National Math Olympiad champion, scholarship recipient..."
                value={editForm.achievements}
                onChange={(e) => setEditForm(prev => ({ ...prev, achievements: e.target.value }))}
                fullWidth
              />

              <TextField
                label="Testimonial / Notes"
                multiline
                rows={2}
                placeholder="Remarks or memories..."
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setEditModalOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={editSubmitting}
              sx={{ fontWeight: 600, minWidth: 120 }}
            >
              {editSubmitting ? <CircularProgress size={22} /> : "Save Changes"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal 3: Add Individual Student to Batch */}
      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Add Student to {batch.name}
        </DialogTitle>
        <DialogContent dividers>
          {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Search for a student by name, admission number, or roll number to register them into this batch.
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                label="Search Student"
                placeholder="Type student name or ID..."
                size="small"
                fullWidth
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchCandidates();
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearchCandidates}
                disabled={candidateLoading || !candidateSearch.trim()}
                sx={{ textTransform: "none" }}
              >
                {candidateLoading ? <CircularProgress size={20} /> : "Search"}
              </Button>
            </Box>

            {candidateStudents.length > 0 && (
              <Box sx={{ maxHeight: 200, overflowY: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                {candidateStudents.map(st => (
                  <Box
                    key={st.id}
                    onClick={() => setSelectedStudentForBatch(st)}
                    sx={{
                      p: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      cursor: "pointer",
                      bgcolor: selectedStudentForBatch?.id === st.id ? "primary.lighter" : "transparent",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700}>
                      {st.full_name} ({st.admission_number})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Class: {st.class_name || "—"} • Roll: {st.roll_number || "—"} • Status: {st.status}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {selectedStudentForBatch && (
              <Box sx={{ p: 1.5, bgcolor: "success.lighter", borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} color="success.dark">
                  Selected: {selectedStudentForBatch.full_name}
                </Typography>
                <TextField
                  label="Final Result / GPA"
                  size="small"
                  fullWidth
                  value={addResult}
                  onChange={(e) => setAddResult(e.target.value)}
                  sx={{ mt: 1.5, bgcolor: "#fff" }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAddModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddStudentToBatch}
            disabled={addSubmitting || !selectedStudentForBatch}
            sx={{ fontWeight: 600, minWidth: 120 }}
          >
            {addSubmitting ? <CircularProgress size={22} /> : "Confirm Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
