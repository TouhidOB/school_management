"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PhoneIcon from "@mui/icons-material/Phone";
import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckIcon from "@mui/icons-material/Check";
import AbsentStudentModal from "@/components/AbsentStudentModal";

export default function AbsenteeDeskPage() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");

  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Copy Feedback
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    api.get("/classes/?page_size=200").then((d) => setClasses(d.results || d)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      setSectionId("");
      return;
    }
    api.get(`/sections/?school_class=${selectedClass}&page_size=200`).then((d) => setSections(d.results || d)).catch(() => {});
  }, [selectedClass]);

  const loadAbsentees = async () => {
    setLoading(true);
    setMsg("");
    try {
      const params = new URLSearchParams({ date });
      if (selectedClass) params.set("school_class", selectedClass);
      if (sectionId) params.set("section", sectionId);
      if (search.trim()) params.set("search", search.trim());

      const res = await api.get(`/student-attendance/absentees/?${params}`);
      setAbsentees(res.results || []);
    } catch (err) {
      console.error("Failed to load absentees:", err);
      setMsg("Failed to load absent students list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAbsentees();
  }, [date, selectedClass, sectionId]);

  // Handle Search on enter or debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAbsentees();
  };

  // Quick Copy
  const copyPhone = (phone, id) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculate summary stats
  const totalCount = absentees.length;
  const withPhoneCount = absentees.filter((a) => a.primary_phone).length;
  const streakCount = absentees.filter((a) => (a.monthly_stats?.consecutive_absent || 0) >= 2).length;
  const avgMonthlyRate = useMemo(() => {
    if (!absentees.length) return 0;
    const sum = absentees.reduce((acc, curr) => acc + (curr.monthly_stats?.attendance_rate || 0), 0);
    return Math.round(sum / absentees.length);
  }, [absentees]);

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PersonOffIcon color="error" fontSize="large" />
            <Typography variant="h5" fontWeight="bold">
              Absent Students Follow-up Desk
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Management oversight for absent students, guardian contacts, home addresses, and monthly attendance records.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAbsentees}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            component={Link}
            href="/attendance"
            variant="contained"
            color="primary"
            startIcon={<CheckIcon />}
          >
            Take Daily Attendance
          </Button>
        </Box>
      </Box>

      {/* KPI Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                TOTAL ABSENT STUDENTS
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main" sx={{ mt: 0.5 }}>
                {totalCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Marked absent on {date}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                CONTACTS ON RECORD
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ mt: 0.5 }}>
                {withPhoneCount} / {totalCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Students with reachable guardians
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                MULTI-DAY STREAK (≥2 DAYS)
              </Typography>
              <Typography variant="h4" fontWeight="bold" color={streakCount > 0 ? "warning.main" : "text.primary"} sx={{ mt: 0.5 }}>
                {streakCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Require priority guardian follow-up
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                AVG. MONTHLY ATTENDANCE
              </Typography>
              <Typography variant="h4" fontWeight="bold" color={avgMonthlyRate >= 75 ? "success.main" : "warning.main"} sx={{ mt: 0.5 }}>
                {avgMonthlyRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Overall monthly rate of absentees
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
        <CardContent sx={{ p: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            type="date"
            size="small"
            label="Attendance Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 170 }}
          />

          <FormControl sx={{ minWidth: 160 }} size="small">
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              label="Class"
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <MenuItem value=""><em>All Classes</em></MenuItem>
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 160 }} size="small" disabled={!selectedClass || sections.length === 0}>
            <InputLabel>Section</InputLabel>
            <Select
              value={sectionId}
              label="Section"
              onChange={(e) => setSectionId(e.target.value)}
            >
              <MenuItem value=""><em>All Sections</em></MenuItem>
              {sections.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box component="form" onSubmit={handleSearchSubmit} sx={{ flexGrow: 1, minWidth: 240 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search student, roll, or guardian phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Button variant="outlined" onClick={loadAbsentees}>
            Filter
          </Button>
        </CardContent>
      </Card>

      {/* Error or Notice */}
      {msg && <Alert severity="error" sx={{ mb: 3 }}>{msg}</Alert>}

      {/* Absentee Records Table */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 8, gap: 2 }}>
              <CircularProgress size={28} />
              <Typography color="text.secondary">Fetching absent students and parent registry…</Typography>
            </Box>
          ) : absentees.length === 0 ? (
            <Box sx={{ py: 8, px: 3, textAlign: "center" }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 48, color: "success.main", mb: 1.5 }} />
              <Typography variant="h6" fontWeight="bold">
                No Absent Students Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: "auto", mt: 0.5 }}>
                No students were marked absent for the selected date and filters. Either all students attended, or
                attendance hasn’t been recorded yet.
              </Typography>
              <Button
                component={Link}
                href="/attendance"
                variant="outlined"
                sx={{ mt: 2.5 }}
                startIcon={<CheckIcon />}
              >
                Go to Daily Attendance
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell width="22%">Student Details</TableCell>
                    <TableCell width="14%">Class & Section</TableCell>
                    <TableCell width="20%">Parent / Mobile</TableCell>
                    <TableCell width="20%">Present Address</TableCell>
                    <TableCell width="14%" align="center">This Month's Attendance</TableCell>
                    <TableCell width="10%" align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {absentees.map((item) => {
                    const stats = item.monthly_stats || {};
                    const rate = stats.attendance_rate ?? 100;
                    const rateColor = rate >= 80 ? "success" : rate >= 65 ? "warning" : "error";
                    const isStreak = (stats.consecutive_absent || 0) >= 2;

                    return (
                      <TableRow key={item.student_id} hover sx={{ bgcolor: isStreak ? "rgba(237, 108, 2, 0.04)" : "inherit" }}>
                        {/* Student Details */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              src={item.photo || undefined}
                              sx={{ width: 36, height: 36, bgcolor: "error.light", color: "error.dark", fontWeight: 700, fontSize: "0.9rem" }}
                            >
                              {item.full_name?.charAt(0) || "S"}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {item.full_name}
                              </Typography>
                              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <Typography variant="caption" color="text.secondary">
                                  Roll: #{item.roll_number || "—"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  • Adm: {item.admission_number}
                                </Typography>
                              </Box>
                              {isStreak && (
                                <Chip
                                  label={`🚨 ${stats.consecutive_absent} Days Absent`}
                                  size="small"
                                  color="warning"
                                  sx={{ height: 18, fontSize: "0.68rem", fontWeight: 700, mt: 0.3 }}
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Class & Section */}
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {item.class_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Section: {item.section_name}
                          </Typography>
                        </TableCell>

                        {/* Parent / Guardian & Phone */}
                        <TableCell>
                          {item.primary_phone ? (
                            <Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Typography variant="body2" fontWeight={600} color="primary.main">
                                  {item.primary_phone}
                                </Typography>
                                <Tooltip title={copiedId === item.student_id ? "Copied!" : "Copy Phone"}>
                                  <IconButton
                                    size="small"
                                    onClick={() => copyPhone(item.primary_phone, item.student_id)}
                                    sx={{ p: 0.3 }}
                                  >
                                    <ContentCopyIcon sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {item.primary_guardian_name ? `${item.primary_guardian_name} ` : ""}
                                ({item.primary_relation || "Guardian"})
                              </Typography>
                              {item.emergency_contact && item.emergency_contact !== item.primary_phone && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                  Emerg: {item.emergency_contact}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                              No phone on record
                            </Typography>
                          )}
                        </TableCell>

                        {/* Address */}
                        <TableCell>
                          <Typography variant="caption" sx={{ display: "block", color: "text.primary" }}>
                            {item.full_present_address !== "—" ? item.full_present_address : item.address || "—"}
                          </Typography>
                        </TableCell>

                        {/* Monthly Attendance */}
                        <TableCell align="center">
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <Chip
                              label={`${rate}% (${stats.present_count || 0}/${stats.total_working_days || 0}d)`}
                              size="small"
                              color={rateColor}
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                            />
                            <Typography variant="caption" color="error.main" sx={{ mt: 0.3, fontWeight: 600 }}>
                              {stats.absent_count || 0} Absent this month
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                            {item.primary_phone && (
                              <Tooltip title={`Call ${item.primary_guardian_name || "Parent"}`}>
                                <IconButton
                                  size="small"
                                  color="success"
                                  component="a"
                                  href={`tel:${item.primary_phone}`}
                                >
                                  <PhoneIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="View Full Absentee & Parent Info">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setSelectedStudent(item);
                                  setModalOpen(true);
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Detailed Modal */}
      {selectedStudent && (
        <AbsentStudentModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedStudent(null);
          }}
          studentId={selectedStudent.student_id}
          date={date}
          initialData={selectedStudent}
        />
      )}
    </Box>
  );
}
