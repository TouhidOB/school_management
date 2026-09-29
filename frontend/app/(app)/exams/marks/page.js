"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Checkbox, FormControlLabel, CircularProgress, Alert, Grid
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";

export default function MarksEntryPage() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [examSubjects, setExamSubjects] = useState([]);
  
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedExamSubject, setSelectedExamSubject] = useState("");
  
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({}); // student_id -> { id (if existing), marks_obtained, is_absent, grade, grade_point }
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [filterAbsentOnly, setFilterAbsentOnly] = useState(false);

  // Initial loads
  useEffect(() => {
    api.get("/exam-sessions/?page_size=200").then(res => setSessions(res.results || res)).catch(() => {});
    api.get("/classes/?page_size=200").then(res => setClasses(res.results || res)).catch(() => {});
  }, []);

  // Cascading Section & ExamSubjects based on Class
  useEffect(() => {
    setSelectedSection("");
    setSelectedExamSubject("");
    setSections([]);
    setExamSubjects([]);
    setHasLoaded(false);

    if (selectedClass) {
      api.get(`/sections/?school_class=${selectedClass}&page_size=200`).then(res => setSections(res.results || res));
      
      if (selectedSession) {
        api.get(`/exam-subjects/?exam_session=${selectedSession}&school_class=${selectedClass}&page_size=200`)
           .then(res => setExamSubjects(res.results || res));
      }
    }
  }, [selectedClass, selectedSession]);

  async function loadRoster() {
    if (!selectedSection || !selectedExamSubject) return;
    setLoading(true);
    setHasLoaded(true);
    setMessage("");
    
    try {
      const [studsRes, resultsRes] = await Promise.all([
        api.get(`/students/?current_section=${selectedSection}&page_size=500`),
        api.get(`/exam-results/?exam_subject=${selectedExamSubject}&page_size=500`)
      ]);
      
      const studs = studsRes.results || studsRes;
      const existingResults = resultsRes.results || resultsRes;
      
      const existingMap = {};
      existingResults.forEach(r => {
        existingMap[r.student] = {
          id: r.id,
          marks_obtained: r.marks_obtained,
          is_absent: r.is_absent,
          grade: r.grade || "",
          grade_point: r.grade_point || ""
        };
      });
      
      const initialMarks = {};
      studs.forEach(s => {
        if (existingMap[s.id]) {
          initialMarks[s.id] = existingMap[s.id];
        } else {
          initialMarks[s.id] = { id: null, marks_obtained: "", is_absent: false, grade: "", grade_point: "" };
        }
      });
      
      setStudents(studs);
      setMarksData(initialMarks);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load roster.");
    } finally {
      setLoading(false);
    }
  }

  const updateMark = (studentId, field, value) => {
    setMarksData(prev => {
      const studentData = { ...prev[studentId], [field]: value };
      
      if (field === 'marks_obtained') {
        let valStr = value;
        if (valStr === "" || valStr == null) {
          studentData.grade = "";
          studentData.grade_point = "";
        } else {
          let val = Number(valStr);
          const activeSubject = examSubjects.find(es => String(es.id) === String(selectedExamSubject));
          const totalMarks = activeSubject?.total_marks || 100;
          
          if (val < 0) valStr = "0";
          else if (val > totalMarks) valStr = String(totalMarks);
          
          val = Number(valStr);
          studentData.marks_obtained = valStr;

          const percentage = (val / totalMarks) * 100;
          if (percentage >= 80) { studentData.grade = "A+"; studentData.grade_point = "5.00"; }
          else if (percentage >= 70) { studentData.grade = "A"; studentData.grade_point = "4.00"; }
          else if (percentage >= 60) { studentData.grade = "A-"; studentData.grade_point = "3.50"; }
          else if (percentage >= 50) { studentData.grade = "B"; studentData.grade_point = "3.00"; }
          else if (percentage >= 40) { studentData.grade = "C"; studentData.grade_point = "2.00"; }
          else if (percentage >= 33) { studentData.grade = "D"; studentData.grade_point = "1.00"; }
          else { studentData.grade = "F"; studentData.grade_point = "0.00"; }
        }
      }
      
      return {
        ...prev,
        [studentId]: studentData
      };
    });
  };

  const saveMarks = async () => {
    setSaving(true);
    setMessage("");
    let errors = 0;
    
    for (const student of students) {
      const data = marksData[student.id];
      // Skip untouched/empty if neither absent nor marks given
      if (!data.id && data.marks_obtained === "" && !data.is_absent) continue;

      const payload = {
        exam_subject: selectedExamSubject,
        student: student.id,
        is_absent: data.is_absent,
        marks_obtained: data.is_absent ? 0 : (data.marks_obtained || 0),
        grade: data.grade || "",
        grade_point: data.grade_point || null
      };

      try {
        if (data.id) {
          await api.patch(`/exam-results/${data.id}/`, payload);
        } else {
          await api.post("/exam-results/", payload);
        }
      } catch (e) {
        console.error(e);
        errors++;
      }
    }
    
    if (errors > 0) {
      setMessage(`Saved, but encountered ${errors} error(s).`);
    } else {
      setMessage("Marks saved successfully! ✓");
    }
    
    await loadRoster(); // reload to get generated IDs
    setSaving(false);
  };

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
            Marks Entry Filters:
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Exam Session</InputLabel>
                <Select
                  value={selectedSession}
                  label="Exam Session"
                  onChange={(e) => setSelectedSession(e.target.value)}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {sessions.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" disabled={!selectedSession}>
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
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" disabled={!selectedClass || sections.length === 0}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={selectedSection}
                  label="Section"
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {sections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small" disabled={!selectedClass || examSubjects.length === 0}>
                <InputLabel>Subject Schedule</InputLabel>
                <Select
                  value={selectedExamSubject}
                  label="Subject Schedule"
                  onChange={(e) => setSelectedExamSubject(e.target.value)}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {examSubjects.map(es => <MenuItem key={es.id} value={es.id}>{es.subject_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button 
                fullWidth
                variant="contained" 
                startIcon={<SearchIcon />}
                onClick={loadRoster}
                disabled={!selectedSection || !selectedExamSubject}
              >
                Load Roster
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!hasLoaded && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Select the Exam Session, Class, Section, and the specific Subject to enter marks.
        </Alert>
      )}

      {hasLoaded && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={filterAbsentOnly ? "outlined" : "contained"}
                size="small"
                onClick={() => setFilterAbsentOnly(false)}
                sx={{ textTransform: 'none' }}
              >
                All Students ({students.length})
              </Button>
              <Button
                variant={filterAbsentOnly ? "contained" : "outlined"}
                color="warning"
                size="small"
                onClick={() => setFilterAbsentOnly(true)}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              >
                Absent & Re-exam ({students.filter(s => marksData[s.id]?.is_absent).length})
              </Button>
            </Box>
            {students.filter(s => marksData[s.id]?.is_absent).length > 0 && (
              <Chip 
                label={`${students.filter(s => marksData[s.id]?.is_absent).length} Absent Student(s) Require Re-examination`} 
                color="warning" 
                size="small" 
                variant="outlined" 
              />
            )}
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell width="10%"><strong>Roll #</strong></TableCell>
                  <TableCell width="30%"><strong>Student Name</strong></TableCell>
                  <TableCell width="15%" align="center"><strong>Absent?</strong></TableCell>
                  <TableCell width="25%"><strong>Marks Obtained</strong></TableCell>
                  <TableCell width="10%"><strong>Grade</strong></TableCell>
                  <TableCell width="10%"><strong>GPA</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell>
                  </TableRow>
                ) : (filterAbsentOnly ? students.filter(s => marksData[s.id]?.is_absent) : students).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      {filterAbsentOnly ? "No absent students in this section. All students attended!" : "No students found in this section."}
                    </TableCell>
                  </TableRow>
                ) : (
                  (filterAbsentOnly ? students.filter(s => marksData[s.id]?.is_absent) : students).map((s) => {
                    const data = marksData[s.id] || {};
                    return (
                      <TableRow key={s.id} hover>
                        <TableCell>{s.roll_number || "—"}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{s.full_name}</TableCell>
                        <TableCell align="center">
                          <Checkbox 
                            size="small"
                            color="error"
                            checked={data.is_absent || false}
                            onChange={(e) => updateMark(s.id, 'is_absent', e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          {data.is_absent ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="error" fontWeight="bold">ABSENT</Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={() => updateMark(s.id, 'is_absent', false)}
                                sx={{ textTransform: 'none', py: 0.2, px: 1, fontSize: '0.75rem' }}
                              >
                                Enter Re-exam Mark
                              </Button>
                            </Box>
                          ) : (
                            <TextField
                              size="small"
                              type="number"
                              inputProps={{ step: "0.01", min: "0" }}
                              fullWidth
                              value={data.marks_obtained}
                              onChange={(e) => updateMark(s.id, 'marks_obtained', e.target.value)}
                              placeholder="0.00"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            disabled={data.is_absent}
                            value={data.is_absent ? "F" : data.grade}
                            onChange={(e) => updateMark(s.id, 'grade', e.target.value)}
                            placeholder="e.g. A+"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ step: "0.01", min: "0", max: "5" }}
                            fullWidth
                            disabled={data.is_absent}
                            value={data.is_absent ? "0.00" : data.grade_point}
                            onChange={(e) => updateMark(s.id, 'grade_point', e.target.value)}
                            placeholder="0.0"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {hasLoaded && students.length > 0 && !loading && (
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography color={message.includes("error") ? "error.main" : "success.main"} fontWeight="bold">
                {message}
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />}
                onClick={saveMarks}
                disabled={saving}
                size="large"
              >
                {saving ? "Saving..." : "Save Marks"}
              </Button>
            </CardContent>
          )}
        </Card>
      )}
    </Box>
  );
}
