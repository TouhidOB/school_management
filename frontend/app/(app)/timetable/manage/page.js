"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Checkbox, FormControlLabel,
  IconButton
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" }
];

export default function ManageTimetablePage() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(getInitialForm());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function getInitialForm() {
    return {
      id: null,
      day_of_week: 0,
      period: 1,
      start_time: "09:00",
      end_time: "09:45",
      is_break: false,
      subject: "",
      teacher: "",
      room: ""
    };
  }

  useEffect(() => {
    api.get("/classes/?page_size=200").then(res => setClasses(res.results || []));
    api.get("/teachers/?page_size=500").then(res => setTeachers(res.results || []));
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      setSelectedSection("");
      setSubjects([]);
      return;
    }
    api.get(`/sections/?school_class=${selectedClass}&page_size=200`).then(res => setSections(res.results || []));
    api.get(`/subjects/?school_class=${selectedClass}&page_size=200`).then(res => setSubjects(res.results || []));
  }, [selectedClass]);

  useEffect(() => {
    loadSlots();
  }, [selectedSection]);

  function loadSlots() {
    if (!selectedSection) {
      setSlots([]);
      return;
    }
    setLoading(true);
    api.get(`/routine-slots/?section=${selectedSection}&page_size=500`).then((res) => {
      setSlots(res.results || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  const openAdd = () => {
    setForm(getInitialForm());
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (slot) => {
    setForm({
      id: slot.id,
      day_of_week: slot.day_of_week,
      period: slot.period,
      start_time: slot.start_time.substring(0, 5),
      end_time: slot.end_time.substring(0, 5),
      is_break: slot.is_break,
      subject: slot.subject || "",
      teacher: slot.teacher || "",
      room: slot.room || ""
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this routine slot?")) return;
    await api.del(`/routine-slots/${id}/`);
    loadSlots();
  };

  const saveSlot = async () => {
    setSaving(true);
    setFormError("");
    const payload = {
      section: selectedSection,
      day_of_week: form.day_of_week,
      period: form.period,
      start_time: form.start_time,
      end_time: form.end_time,
      is_break: form.is_break,
      subject: form.is_break ? null : (form.subject || null),
      teacher: form.is_break ? null : (form.teacher || null),
      room: form.is_break ? "" : form.room
    };

    try {
      if (form.id) {
        await api.put(`/routine-slots/${form.id}/`, payload);
      } else {
        await api.post("/routine-slots/", payload);
      }
      setDialogOpen(false);
      loadSlots();
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

  const groupedSlots = DAYS.map((dayObj) => ({
    day: dayObj.label,
    slots: slots.filter(s => s.day_of_week === dayObj.value).sort((a, b) => a.period - b.period)
  }));

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Typography variant="body1" fontWeight="bold">
            Select Class & Section to Manage:
          </Typography>
          
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

          <FormControl sx={{ minWidth: 200 }} size="small" disabled={!selectedClass || sections.length === 0}>
            <InputLabel>Section</InputLabel>
            <Select
              value={selectedSection}
              label="Section"
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {sections.map(s => <MenuItem key={s.id} value={s.id}>{s.name} ({s.academic_year_name})</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={openAdd}
            disabled={!selectedSection}
          >
            Add Routine Slot
          </Button>
        </CardContent>
      </Card>

      {selectedSection && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell width="15%"><strong>Day</strong></TableCell>
                  <TableCell><strong>Routine Slots</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 5 }}>Loading...</TableCell>
                  </TableRow>
                ) : groupedSlots.every(g => g.slots.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No classes scheduled. Click "Add Routine Slot" to build the timetable.
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedSlots.map((group) => {
                    if (group.slots.length === 0) return null;
                    return (
                      <TableRow key={group.day}>
                        <TableCell sx={{ verticalAlign: 'top', pt: 3 }}>
                          <Typography fontWeight="bold" color="primary">{group.day}</Typography>
                        </TableCell>
                        <TableCell sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {group.slots.map(slot => (
                              <Card 
                                key={slot.id} 
                                variant="outlined" 
                                sx={{ 
                                  p: 1.5, 
                                  minWidth: 200,
                                  borderColor: slot.is_break ? 'grey.300' : 'primary.light',
                                  bgcolor: slot.is_break ? 'grey.50' : '#fff',
                                  position: 'relative',
                                  "&:hover .slot-actions": { opacity: 1 }
                                }}
                              >
                                <Box className="slot-actions" sx={{ position: 'absolute', top: 4, right: 4, opacity: 0, transition: 'opacity 0.2s', bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 1 }}>
                                  <IconButton size="small" onClick={() => openEdit(slot)} color="primary"><EditIcon fontSize="small" /></IconButton>
                                  <IconButton size="small" onClick={() => handleDelete(slot.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                                </Box>

                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                  {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)} (P{slot.period})
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {slot.is_break ? "Break / Lunch" : slot.subject_name || "—"}
                                </Typography>
                                {!slot.is_break && (
                                  <Typography variant="caption" display="block" mt={0.5}>
                                    {slot.teacher_name ? slot.teacher_name : "No Teacher"}
                                    {slot.room && ` • Rm: ${slot.room}`}
                                  </Typography>
                                )}
                              </Card>
                            ))}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? "Edit Routine Slot" : "Add Routine Slot"}</DialogTitle>
        <DialogContent dividers>
          {formError && <Typography color="error" sx={{ mb: 2, fontSize: '0.875rem' }}>{formError}</Typography>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                <InputLabel>Day of Week</InputLabel>
                <Select value={form.day_of_week} label="Day of Week" onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
                  {DAYS.map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth size="small" type="number" label="Period Number" 
                value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth size="small" type="time" label="Start Time" InputLabelProps={{ shrink: true }}
                value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth size="small" type="time" label="End Time" InputLabelProps={{ shrink: true }}
                value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel 
                control={<Checkbox checked={form.is_break} onChange={(e) => setForm({ ...form, is_break: e.target.checked })} />}
                label="This is a break/lunch period (No subject/teacher)"
              />
            </Grid>

            {!form.is_break && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Subject</InputLabel>
                    <Select value={form.subject} label="Subject" onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Teacher</InputLabel>
                    <Select value={form.teacher} label="Teacher" onChange={(e) => setForm({ ...form, teacher: e.target.value })}>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {teachers.map(t => <MenuItem key={t.id} value={t.id}>{t.display_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth size="small" label="Room (Optional)" 
                    value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveSlot} disabled={saving}>{saving ? "Saving..." : "Save Slot"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
