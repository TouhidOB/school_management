"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, IconButton,
  CircularProgress, Alert, Tooltip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";

export default function ExamSchedulePage() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  
  const [examSubjects, setExamSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(getInitialForm());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function getInitialForm() {
    return {
      id: null,
      subject: "",
      exam_date: "",
      start_time: "09:00",
      end_time: "12:00",
      exam_room: "",
      invigilator: "",
      total_marks: 100,
      pass_marks: 33
    };
  }

  useEffect(() => {
    api.get("/exam-sessions/?page_size=200").then(res => setSessions(res.results || res));
    api.get("/classes/?page_size=200").then(res => setClasses(res.results || res));
    api.get("/teachers/?page_size=500").then(res => setTeachers(res.results || res));
  }, []);

  async function loadSchedule() {
    if (!selectedSession || !selectedClass) return;
    setLoading(true);
    setHasLoaded(true);
    
    try {
      const [scheduleRes, subjectsRes] = await Promise.all([
        api.get(`/exam-subjects/?exam_session=${selectedSession}&school_class=${selectedClass}&page_size=200`),
        api.get(`/subjects/?school_class=${selectedClass}&page_size=200`)
      ]);
      setExamSubjects(scheduleRes.results || scheduleRes);
      setAvailableSubjects(subjectsRes.results || subjectsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const openAdd = () => {
    setForm(getInitialForm());
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (es) => {
    setForm({
      id: es.id,
      subject: es.subject,
      exam_date: es.exam_date || "",
      start_time: es.start_time ? es.start_time.substring(0, 5) : "",
      end_time: es.end_time ? es.end_time.substring(0, 5) : "",
      exam_room: es.exam_room || "",
      invigilator: es.invigilator || "",
      total_marks: es.total_marks || 100,
      pass_marks: es.pass_marks || 33
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this subject from the exam schedule?")) return;
    try {
      await api.del(`/exam-subjects/${id}/`);
      loadSchedule();
    } catch (err) {
      alert("Failed to delete the record.");
    }
  };

  const saveSlot = async () => {
    setSaving(true);
    setFormError("");
    
    // Cleanup empty strings for DRF null fields
    const payload = {
      exam_session: selectedSession,
      school_class: selectedClass,
      ...form
    };
    
    if (!payload.exam_date) payload.exam_date = null;
    if (!payload.start_time) payload.start_time = null;
    if (!payload.end_time) payload.end_time = null;
    if (!payload.invigilator) payload.invigilator = null;

    try {
      if (form.id) {
        await api.put(`/exam-subjects/${form.id}/`, payload);
      } else {
        await api.post("/exam-subjects/", payload);
      }
      setDialogOpen(false);
      loadSchedule();
    } catch (err) {
      setFormError(
        err.data
          ? Object.entries(err.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" · ")
          : err.message
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body1" fontWeight="bold">
            Schedule Filters:
          </Typography>

          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Exam Session</InputLabel>
            <Select
              value={selectedSession}
              label="Exam Session"
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {sessions.map(s => <MenuItem key={s.id} value={s.id}>{s.name} ({s.academic_year_name})</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              label="Class"
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>

          <Button 
            variant="contained" 
            startIcon={<SearchIcon />}
            onClick={loadSchedule}
            disabled={!selectedSession || !selectedClass}
          >
            Load Schedule
          </Button>

          <Box sx={{ flexGrow: 1 }} />
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={openAdd}
            disabled={!hasLoaded || !selectedSession || !selectedClass}
            color="success"
          >
            Add Subject to Schedule
          </Button>
        </CardContent>
      </Card>

      {!hasLoaded && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Select an Exam Session and a Class, then click "Load Schedule" to manage examinations.
        </Alert>
      )}

      {hasLoaded && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Time</strong></TableCell>
                  <TableCell><strong>Subject</strong></TableCell>
                  <TableCell><strong>Room</strong></TableCell>
                  <TableCell><strong>Invigilator</strong></TableCell>
                  <TableCell align="center"><strong>Marks (Pass/Total)</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell>
                  </TableRow>
                ) : examSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No subjects scheduled for this class in this exam session yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  examSubjects.map((es) => {
                    const teacher = teachers.find(t => t.id === es.invigilator);
                    return (
                      <TableRow key={es.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {es.exam_date || <Typography variant="caption" color="text.secondary">TBD</Typography>}
                        </TableCell>
                        <TableCell>
                          {es.start_time && es.end_time 
                            ? `${es.start_time.substring(0,5)} - ${es.end_time.substring(0,5)}` 
                            : <Typography variant="caption" color="text.secondary">TBD</Typography>
                          }
                        </TableCell>
                        <TableCell><strong>{es.subject_name}</strong></TableCell>
                        <TableCell>{es.exam_room || "—"}</TableCell>
                        <TableCell>{teacher ? teacher.display_name : "—"}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Pass / Total">
                            <Box component="span" sx={{ p: 0.5, bgcolor: 'grey.100', borderRadius: 1, border: '1px solid', borderColor: 'grey.300', fontSize: '0.85rem' }}>
                              <Typography component="span" color="error.main" fontWeight="bold" fontSize="0.85rem">{es.pass_marks}</Typography>
                              {" / "}
                              <Typography component="span" color="success.main" fontWeight="bold" fontSize="0.85rem">{es.total_marks}</Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => openEdit(es)} title="Edit Slot">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(es.id)} title="Delete Slot">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? "Edit Exam Schedule Slot" : "Add Subject to Schedule"}</DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small" required sx={{ mt: 1 }}>
                <InputLabel>Subject</InputLabel>
                <Select 
                  value={form.subject} 
                  label="Subject *" 
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  disabled={!!form.id} // Changing subject after creation is risky (unique constraint), better to delete and recreate
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {availableSubjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField 
                fullWidth size="small" type="date" label="Exam Date" 
                InputLabelProps={{ shrink: true }}
                value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField 
                fullWidth size="small" type="time" label="Start Time" 
                InputLabelProps={{ shrink: true }}
                value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField 
                fullWidth size="small" type="time" label="End Time" 
                InputLabelProps={{ shrink: true }}
                value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth size="small" label="Exam Room" 
                value={form.exam_room} onChange={(e) => setForm({ ...form, exam_room: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Invigilator</InputLabel>
                <Select 
                  value={form.invigilator} 
                  label="Invigilator" 
                  onChange={(e) => setForm({ ...form, invigilator: e.target.value })}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {teachers.map(t => <MenuItem key={t.id} value={t.id}>{t.display_name || (t.user && t.user.first_name)}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth size="small" type="number" label="Total Marks" required
                value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth size="small" type="number" label="Pass Marks" required
                value={form.pass_marks} onChange={(e) => setForm({ ...form, pass_marks: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveSlot} disabled={saving || !form.subject}>
            {saving ? "Saving..." : "Save Schedule"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
