"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { 
  Box, Typography, Grid, Card, CardContent, CardHeader, Button, 
  TextField, MenuItem, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Divider, Alert, IconButton, CircularProgress
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BadgeIcon from '@mui/icons-material/Badge';

export default function ExamSessionDetail() {
  const { id } = useParams();
  const router = useRouter();
  
  const [session, setSession] = useState(null);
  const [examSubjects, setExamSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [form, setForm] = useState({
    subject: "",
    school_class: "",
    total_marks: 100,
    pass_marks: 33,
    exam_date: ""
  });

  // Marks Entry State
  const [marksFor, setMarksFor] = useState(null);
  const [selectedSection, setSelectedSection] = useState("");
  const [roster, setRoster] = useState([]);
  const [marks, setMarks] = useState({});
  const [msg, setMsg] = useState("");

  // Merit List State
  const [merit, setMerit] = useState(null);
  const [promoteMsg, setPromoteMsg] = useState("");

  useEffect(() => {
    Promise.all([
      api.get(`/exam-sessions/${id}/`),
      api.get(`/exam-subjects/?exam_session=${id}&page_size=200`),
      api.get("/classes/?page_size=200"),
      api.get("/subjects/?page_size=500")
    ]).then(([sRes, esRes, cRes, subRes]) => {
      setSession(sRes);
      setExamSubjects(esRes.results || esRes);
      setClasses(cRes.results || cRes);
      setSubjects(subRes.results || subRes);
      setLoading(false);
    }).catch(console.error);
  }, [id]);

  async function addExamSubject(e) {
    e.preventDefault();
    try {
      const res = await api.post("/exam-subjects/", {
        ...form,
        exam_session: id
      });
      setExamSubjects([...examSubjects, res]);
      setForm({ ...form, subject: "", school_class: "", exam_date: "" });
    } catch (err) {
      alert("Error adding exam subject.");
      console.error(err);
    }
  }

  async function openMarks(es) {
    setMarksFor(es);
    setSelectedSection("");
    setMsg("Loading...");
    try {
      const [stuRes, resRes] = await Promise.all([
        api.get(`/students/?current_class=${es.school_class}&page_size=500`),
        api.get(`/exam-results/?exam_subject=${es.id}&page_size=500`)
      ]);
      const students = stuRes.results || stuRes;
      const results = resRes.results || resRes;

      const mDict = {};
      for (const st of students) mDict[st.id] = { marks: "", recordId: null };
      for (const r of results) {
        if (mDict[r.student]) {
          mDict[r.student] = { marks: r.marks_obtained, recordId: r.id };
        }
      }
      setRoster(students);
      setMarks(mDict);
      setMsg("");
    } catch (err) {
      setMsg("Failed to load data.");
    }
  }

  async function saveMarks() {
    if (!marksFor) return;
    setMsg("Saving...");
    try {
      for (const s of roster) {
        const mk = marks[s.id];
        if (mk.marks === "" || mk.marks == null) continue;
        const body = { exam_subject: marksFor.id, student: s.id, marks_obtained: mk.marks };
        if (mk.recordId) {
          await api.patch(`/exam-results/${mk.recordId}/`, { marks_obtained: mk.marks });
        } else {
          await api.post("/exam-results/", body);
        }
      }
      setMsg("Saved Successfully ✓");
      await openMarks(marksFor); // refresh
    } catch (err) {
      setMsg(`Failed: ${err.message || err.data?.detail || err}`); console.error(err);
    }
  }

  async function loadMerit() {
    setPromoteMsg("Generating merit list...");
    try {
      const res = await api.get(`/exam-sessions/${id}/merit/`);
      setMerit(res.results || res);
      setPromoteMsg("");
    } catch (err) {
      setPromoteMsg("Failed to generate merit list.");
    }
  }

  async function promote(moveUp) {
    if (!confirm(moveUp ? "Finalize promotions and increment student classes?" : "Save promotion results (without changing classes)?")) return;
    setPromoteMsg("Processing promotions...");
    try {
      const res = await api.post(`/exam-sessions/${id}/promote/`, { move: moveUp });
      setPromoteMsg(`Processed ${res.processed} students.`);
    } catch (err) {
      setPromoteMsg("Failed to process promotions.");
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton component={Link} href="/exams" color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight="bold">{session?.name || "Exam Session Detail"}</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage exam subjects, mark entry, and view reports.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Add Subject Form */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardHeader title="Add Exam Subject" titleTypographyProps={{ variant: 'h6' }} />
            <Divider />
            <CardContent>
              <form onSubmit={addExamSubject}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField 
                    select 
                    label="Subject" 
                    value={form.subject} 
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                    size="small"
                  >
                    {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>)}
                  </TextField>

                  <TextField 
                    select 
                    label="Class" 
                    value={form.school_class} 
                    onChange={(e) => setForm({ ...form, school_class: e.target.value })}
                    required
                    size="small"
                  >
                    {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </TextField>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField 
                        label="Total Marks" 
                        type="number" 
                        value={form.total_marks} 
                        onChange={(e) => setForm({ ...form, total_marks: Number(e.target.value) })}
                        required
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField 
                        label="Pass Marks" 
                        type="number" 
                        value={form.pass_marks} 
                        onChange={(e) => setForm({ ...form, pass_marks: Number(e.target.value) })}
                        required
                        size="small"
                        fullWidth
                      />
                    </Grid>
                  </Grid>

                  <TextField 
                    label="Exam Date" 
                    type="date" 
                    InputLabelProps={{ shrink: true }}
                    value={form.exam_date} 
                    onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                    size="small"
                  />

                  <Button type="submit" variant="contained" color="primary" fullWidth>
                    Add Subject
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Existing Subjects Table */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardHeader title="Exam Subjects" titleTypographyProps={{ variant: 'h6' }} />
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell><strong>Subject</strong></TableCell>
                    <TableCell><strong>Class</strong></TableCell>
                    <TableCell><strong>Marks (Total/Pass)</strong></TableCell>
                    <TableCell align="right"><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {examSubjects.length === 0 ? (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No subjects added yet.</TableCell></TableRow>
                  ) : (
                    examSubjects.map(es => (
                      <TableRow key={es.id} hover>
                        <TableCell>{es.subject_name}</TableCell>
                        <TableCell>{es.class_name}</TableCell>
                        <TableCell>{es.total_marks} / pass {es.pass_marks}</TableCell>
                        <TableCell align="right">
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<EditIcon />}
                            onClick={() => openMarks(es)}
                          >
                            Enter Marks
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Marks Entry Section */}
      {marksFor && (() => {
        const uniqueSections = Array.from(new Set(roster.map(s => s.current_section).filter(Boolean)))
          .map(secId => ({ id: secId, name: roster.find(s => s.current_section === secId)?.section_name }));
        
        const filteredRoster = selectedSection 
          ? roster.filter(s => String(s.current_section) === String(selectedSection))
          : roster;

        return (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'primary.main', mt: 3, mb: 3 }}>
            <CardHeader 
              title={`Marks Entry: ${marksFor.subject_name} (${marksFor.class_name})`} 
              titleTypographyProps={{ variant: 'h6', color: 'primary.main' }}
              action={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {msg && <Typography variant="body2" sx={{ color: 'text.secondary' }}>{msg}</Typography>}
                  {uniqueSections.length > 0 && (
                    <TextField
                      select
                      size="small"
                      label="Filter by Section"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      sx={{ minWidth: 150 }}
                    >
                      <MenuItem value="">All Sections</MenuItem>
                      {uniqueSections.map(sec => (
                        <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                      ))}
                    </TextField>
                  )}
                </Box>
              }
            />
            <Divider />
            <CardContent>
              {filteredRoster.length === 0 ? (
                <Typography color="text.secondary">No students found in this class/section.</Typography>
              ) : (
                <Box>
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell><strong>Roll #</strong></TableCell>
                          <TableCell><strong>Student Name</strong></TableCell>
                          <TableCell sx={{ width: 200 }}><strong>Marks Obtained (/${marksFor.total_marks})</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredRoster.map(s => (
                          <TableRow key={s.id} hover>
                            <TableCell>{s.roll_number || "—"}</TableCell>
                            <TableCell>{s.full_name}</TableCell>
                            <TableCell>
                              <TextField 
                                type="number"
                                size="small"
                                fullWidth
                                value={marks[s.id]?.marks ?? ""}
                                onChange={(e) => {
                                  let valStr = e.target.value;
                                  if (valStr !== "") {
                                    let val = Number(valStr);
                                    if (val < 0) valStr = "0";
                                    else if (val > (marksFor.total_marks || 100)) valStr = String(marksFor.total_marks || 100);
                                  }
                                  setMarks(m => ({ ...m, [s.id]: { ...m[s.id], marks: valStr } }));
                                }}
                                InputProps={{ inputProps: { max: marksFor.total_marks || 100, min: 0 } }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={saveMarks}>
                      Save All Marks
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Reports & Promotion */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mt: 3 }}>
        <CardHeader 
          title="Reports & Promotion" 
          titleTypographyProps={{ variant: 'h6' }} 
          action={
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button component="a" href={`/print/exam/${id}/routine`} target="_blank" variant="outlined" size="small" startIcon={<PrintIcon />}>
                Routine
              </Button>
              <Button variant="outlined" size="small" startIcon={<EmojiEventsIcon />} onClick={loadMerit}>
                Merit List
              </Button>
              <Button variant="outlined" color="success" size="small" onClick={() => promote(false)}>
                Record Promotions
              </Button>
              <Button variant="contained" color="success" size="small" startIcon={<UpgradeIcon />} onClick={() => promote(true)}>
                Promote & Move Up
              </Button>
            </Box>
          }
        />
        <Divider />
        <CardContent>
          {promoteMsg && <Alert severity="info" sx={{ mb: 2 }}>{promoteMsg}</Alert>}
          
          {merit && (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell><strong>Rank</strong></TableCell>
                    <TableCell><strong>Student</strong></TableCell>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell><strong>%</strong></TableCell>
                    <TableCell align="right"><strong>Documents</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {merit.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>No results entered yet.</TableCell></TableRow>
                  ) : merit.map(m => (
                    <TableRow key={m.student_id} hover>
                      <TableCell><strong>#{m.rank}</strong></TableCell>
                      <TableCell>{m.student_name}</TableCell>
                      <TableCell>{m.obtained} / {m.possible}</TableCell>
                      <TableCell>{m.percentage}%</TableCell>
                      <TableCell align="right">
                        <IconButton component="a" href={`/print/exam/${id}/transcript/${m.student_id}`} target="_blank" color="primary" title="Transcript" size="small">
                          <ReceiptIcon fontSize="small" />
                        </IconButton>
                        <IconButton component="a" href={`/print/exam/${id}/admit-card/${m.student_id}`} target="_blank" color="secondary" title="Admit Card" size="small" sx={{ ml: 1 }}>
                          <BadgeIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
