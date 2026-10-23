"use client";

import { useEffect, useState } from "react";
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
  ButtonGroup,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import AbsentStudentModal from "@/components/AbsentStudentModal";

const STATUSES = ["present", "absent"];

export default function AttendancePage() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // studentId -> {status, recordId}
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Absent Student Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

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

  async function loadRoster() {
    if (!sectionId) return;
    setLoading(true);
    setHasLoaded(true);
    setMsg("");
    try {
      const [studs, existing] = await Promise.all([
        api.get(`/students/?current_section=${sectionId}&page_size=500`),
        api.get(`/student-attendance/?section=${sectionId}&date=${date}&page_size=500`),
      ]);
      const existingBy = {};
      (existing.results || existing).forEach((r) => (existingBy[r.student] = r));
      const m = {};
      const studsData = studs.results || studs;
      studsData.forEach((s) => {
        const ex = existingBy[s.id];
        m[s.id] = { status: ex ? ex.status : "present", recordId: ex ? ex.id : null };
      });
      setStudents(studsData);
      setMarks(m);
    } catch (err) {
      console.error(err);
      setMsg("Failed to load roster.");
    } finally {
      setLoading(false);
    }
  }

  // Reload when section or date changes if we've already loaded once
  useEffect(() => {
    if (hasLoaded && sectionId) {
      loadRoster();
    }
  }, [sectionId, date]);

  function setStatus(sid, status) {
    setMarks((m) => ({ ...m, [sid]: { ...m[sid], status } }));
  }

  // "Mark All As" helper
  function markAll(status) {
    const m = { ...marks };
    students.forEach(s => {
      if (m[s.id]) m[s.id].status = status;
    });
    setMarks(m);
  }

  async function save() {
    setMsg("Saving…");
    setLoading(true);
    let errorOccurred = false;
    for (const s of students) {
      const mk = marks[s.id];
      const body = { student: s.id, section: Number(sectionId), date, status: mk.status };
      try {
        if (mk.recordId) await api.patch(`/student-attendance/${mk.recordId}/`, { status: mk.status });
        else await api.post("/student-attendance/", body);
      } catch (e) {
        errorOccurred = true;
      }
    }
    setMsg(errorOccurred ? "Saved with some errors." : "Attendance saved successfully! ✓");
    await loadRoster();
  }

  return (
    <Box>
      {/* Top Action Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Typography variant="h6" fontWeight="bold">
          Daily Class Attendance
        </Typography>
        <Button
          component={Link}
          href="/attendance/absentees"
          variant="outlined"
          color="error"
          startIcon={<PersonOffIcon />}
          sx={{ fontWeight: 600 }}
        >
          Absent Students Desk
        </Button>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body1" fontWeight="bold">
            Select Class & Section:
          </Typography>

          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              label="Class"
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {classes.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }} size="small" disabled={!selectedClass || sections.length === 0}>
            <InputLabel>Section</InputLabel>
            <Select
              value={sectionId}
              label="Section"
              onChange={(e) => setSectionId(e.target.value)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {sections.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.name} ({s.academic_year_name})</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="date"
            size="small"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />

          <Button 
            variant="contained" 
            startIcon={<SearchIcon />}
            onClick={loadRoster}
            disabled={!sectionId}
          >
            Load Roster
          </Button>
        </CardContent>
      </Card>

      {!hasLoaded && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Please select a Class, Section, and Date, then click "Load Roster" to take attendance.
        </Alert>
      )}

      {hasLoaded && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4, justifyContent: 'center' }}>
                <CircularProgress size={24} />
                <Typography color="text.secondary">Loading attendance records…</Typography>
              </Box>
            ) : students.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No students found in this section.</Typography>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Roster</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Quick Mark All:</Typography>
                    <Button size="small" variant="outlined" color="primary" onClick={() => markAll('present')}>Present</Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => markAll('absent')}>Absent</Button>
                  </Box>
                </Box>
                
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell width="10%">Roll</TableCell>
                        <TableCell width="32%">Student</TableCell>
                        <TableCell width="34%" align="center">Status</TableCell>
                        <TableCell width="24%" align="center">Follow-up / Parent Info</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((s) => {
                        const isAbsent = marks[s.id]?.status === 'absent';
                        return (
                          <TableRow
                            key={s.id}
                            hover
                            sx={{
                              bgcolor: isAbsent ? 'rgba(211, 47, 47, 0.04)' : 'inherit',
                              transition: 'background-color 0.2s',
                            }}
                          >
                            <TableCell>{s.roll_number || "—"}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{s.full_name}</TableCell>
                            <TableCell align="center">
                              <ButtonGroup size="small">
                                {STATUSES.map((st) => (
                                  <Button
                                    key={st}
                                    variant={marks[s.id]?.status === st ? "contained" : "outlined"}
                                    color={
                                      marks[s.id]?.status === st 
                                        ? (st === 'present' ? 'success' : st === 'absent' ? 'error' : st === 'late' ? 'warning' : 'primary') 
                                        : "inherit"
                                    }
                                    onClick={() => setStatus(s.id, st)}
                                    sx={{ textTransform: 'capitalize', width: 80 }}
                                  >
                                    {st}
                                  </Button>
                                ))}
                              </ButtonGroup>
                            </TableCell>
                            <TableCell align="center">
                              {isAbsent ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<ContactPhoneIcon fontSize="small" />}
                                  onClick={() => {
                                    setSelectedStudentId(s.id);
                                    setModalOpen(true);
                                  }}
                                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', py: 0.2 }}
                                >
                                  Parent Info & Stats
                                </Button>
                              ) : (
                                <Tooltip title="View Student, Parent & Monthly Attendance Info">
                                  <IconButton
                                    size="small"
                                    color="default"
                                    onClick={() => {
                                      setSelectedStudentId(s.id);
                                      setModalOpen(true);
                                    }}
                                  >
                                    <ContactPhoneIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color={msg.includes("error") ? "error.main" : "success.main"} fontWeight="bold">
                    {msg}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<CheckIcon />}
                    onClick={save}
                    size="large"
                  >
                    Save Attendance
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
      {/* Absent Student & Parent Follow-up Modal */}
      {selectedStudentId && (
        <AbsentStudentModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedStudentId(null);
          }}
          studentId={selectedStudentId}
          date={date}
        />
      )}
    </Box>
  );
}
