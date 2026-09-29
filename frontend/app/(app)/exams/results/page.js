"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Grid
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

export default function ExamResultsPage() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  
  const [students, setStudents] = useState([]);
  const [examSubjects, setExamSubjects] = useState([]);
  const [resultsData, setResultsData] = useState({}); // student_id -> exam_subject_id -> result
  
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/exam-sessions/?page_size=200").then(res => setSessions(res.results || res)).catch(() => {});
    api.get("/classes/?page_size=200").then(res => setClasses(res.results || res)).catch(() => {});
  }, []);

  // Cascade Section based on Class
  useEffect(() => {
    setSelectedSection("");
    setSections([]);
    setHasLoaded(false);

    if (selectedClass) {
      api.get(`/sections/?school_class=${selectedClass}&page_size=200`).then(res => setSections(res.results || res));
    }
  }, [selectedClass]);

  async function generateResults() {
    if (!selectedSession || !selectedClass || !selectedSection) return;
    setLoading(true);
    setHasLoaded(true);
    setError("");
    
    try {
      // 1. Fetch Students
      const studsRes = await api.get(`/students/?current_section=${selectedSection}&page_size=500`);
      const studs = studsRes.results || studsRes;
      setStudents(studs);

      // 2. Fetch Exam Subjects for this Class + Session
      const subsRes = await api.get(`/exam-subjects/?exam_session=${selectedSession}&school_class=${selectedClass}&page_size=200`);
      const subs = subsRes.results || subsRes;
      setExamSubjects(subs);

      // 3. Fetch all Results for each Exam Subject
      const promises = subs.map(sub => api.get(`/exam-results/?exam_subject=${sub.id}&page_size=2000`));
      const resArrays = await Promise.all(promises);

      // 4. Map the results
      const resMap = {};
      resArrays.forEach((resSet, i) => {
        const results = resSet.results || resSet;
        const subId = subs[i].id;
        results.forEach(r => {
          if (!resMap[r.student]) resMap[r.student] = {};
          resMap[r.student][subId] = r;
        });
      });
      
      setResultsData(resMap);

    } catch (err) {
      console.error(err);
      setError("Failed to load tabulation data.");
    } finally {
      setLoading(false);
    }
  }

  // Calculate aggregates and rank students
  const tabulatedStudents = useMemo(() => {
    if (!students.length || !examSubjects.length) return [];
    
    const maxTotalPossible = examSubjects.reduce((sum, sub) => sum + (sub.total_marks || 100), 0);
    
    const mapped = students.map(s => {
      let obtained = 0;
      let hasFailedAny = false;
      let isAbsentAny = false;
      let failedSubjectCount = 0;
      const totalSubjects = examSubjects.length;

      examSubjects.forEach(sub => {
        const res = resultsData[s.id]?.[sub.id];
        if (res) {
          if (res.is_absent) isAbsentAny = true;
          const mark = parseFloat(res.marks_obtained) || 0;
          obtained += mark;
          if (mark < (sub.pass_marks || 33)) {
            hasFailedAny = true;
            failedSubjectCount++;
          }
        } else {
          // If no result recorded yet, treat as absent/failed
          isAbsentAny = true;
          hasFailedAny = true;
          failedSubjectCount++;
        }
      });
      
      const percent = maxTotalPossible > 0 ? (obtained / maxTotalPossible) * 100 : 0;
      
      let calculatedGrade = "F";
      if (percent >= 80) calculatedGrade = "A+";
      else if (percent >= 70) calculatedGrade = "A";
      else if (percent >= 60) calculatedGrade = "A-";
      else if (percent >= 50) calculatedGrade = "B";
      else if (percent >= 40) calculatedGrade = "C";
      else if (percent >= 33) calculatedGrade = "D";

      let statusText = "Pass";
      let finalGrade = calculatedGrade;

      if (failedSubjectCount > 0) {
        // If fails in half or fewer of all subjects, status is Partial
        if (totalSubjects > 0 && failedSubjectCount <= (totalSubjects / 2) && percent >= 33) {
          statusText = "Partial";
          finalGrade = calculatedGrade;
        } else {
          statusText = "Fail";
          finalGrade = "F";
        }
      } else if (isAbsentAny) {
        statusText = "Incomplete";
        finalGrade = "F";
      }

      return {
        ...s,
        totalObtained: obtained,
        percent: percent,
        finalGrade: finalGrade,
        statusText: statusText
      };
    });

    // Rank them
    mapped.sort((a, b) => b.totalObtained - a.totalObtained);
    
    let currentRank = 1;
    mapped.forEach((s, idx) => {
      // Handle ties
      if (idx > 0 && s.totalObtained === mapped[idx - 1].totalObtained) {
        s.rank = mapped[idx - 1].rank;
      } else {
        s.rank = currentRank;
      }
      currentRank++;
    });

    return mapped;
  }, [students, examSubjects, resultsData]);

  return (
    <Box>
      <Card className="no-print" elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
            Tabulation Sheet Filters:
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
                  {sessions.map(s => <MenuItem key={s.id} value={s.id}>{s.name} ({s.academic_year_name})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
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

            <Grid item xs={12} md={3}>
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
              <Button 
                fullWidth
                variant="contained" 
                startIcon={<SearchIcon />}
                onClick={generateResults}
                disabled={!selectedSection || !selectedSession}
              >
                Generate Sheet
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!hasLoaded && !loading && (
        <Alert className="no-print" severity="info" sx={{ mt: 2 }}>
          Select the Exam Session, Class, and Section to view the full student tabulation sheet.
        </Alert>
      )}

      {hasLoaded && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4, justifyContent: 'center' }}>
                <CircularProgress size={24} />
                <Typography color="text.secondary">Generating Tabulation Sheet…</Typography>
              </Box>
            ) : tabulatedStudents.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No students found in this section.
              </Typography>
            ) : examSubjects.length === 0 ? (
              <Typography color="warning.main" sx={{ py: 4, textAlign: 'center' }}>
                No subjects have been scheduled for this class in this exam session. <br/> Please add subjects in the "Schedule" tab first.
              </Typography>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Tabulation Sheet</Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<FileDownloadIcon />}
                    onClick={() => window.print()}
                    className="no-print"
                  >
                    Print Sheet
                  </Button>
                </Box>
                
                <TableContainer className="tabulation-sheet" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Table size="small" sx={{ minWidth: 1000 }}>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ minWidth: 150, position: 'sticky', left: 0, bgcolor: 'action.hover', zIndex: 1 }}>
                          <strong>Rank | Student</strong>
                        </TableCell>
                        
                        {examSubjects.map(sub => (
                          <TableCell key={sub.id} align="center" sx={{ borderRight: '1px dashed rgba(224, 224, 224, 1)' }}>
                            <Typography variant="caption" fontWeight="bold" display="block">{sub.subject_name}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block">({sub.total_marks})</Typography>
                          </TableCell>
                        ))}
                        
                        <TableCell align="center" sx={{ borderLeft: '2px solid rgba(224, 224, 224, 1)' }}><strong>Total</strong></TableCell>
                        <TableCell align="center"><strong>%</strong></TableCell>
                        <TableCell align="center"><strong>Grade</strong></TableCell>
                        <TableCell align="center"><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tabulatedStudents.map((s) => (
                        <TableRow key={s.id} hover>
                          <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1, whiteSpace: 'nowrap' }}>
                            <Typography component="span" fontWeight="bold" sx={{ mr: 1, color: 'primary.main' }}>#{s.rank}</Typography>
                            {s.full_name}
                            <Typography variant="caption" display="block" color="text.secondary">Roll: {s.roll_number || '—'}</Typography>
                          </TableCell>
                          
                          {examSubjects.map(sub => {
                            const res = resultsData[s.id]?.[sub.id];
                            const isFail = res && !res.is_absent && parseFloat(res.marks_obtained) < (sub.pass_marks || 33);
                            
                            return (
                              <TableCell key={sub.id} align="center" sx={{ borderRight: '1px dashed rgba(224, 224, 224, 0.4)' }}>
                                {res ? (
                                  res.is_absent ? (
                                    <Typography color="error.main" fontWeight="bold">ABS</Typography>
                                  ) : (
                                    <Box>
                                      <Typography color={isFail ? "error.main" : "text.primary"} fontWeight={isFail ? "bold" : "normal"}>
                                        {parseFloat(res.marks_obtained)}
                                      </Typography>
                                      {res.grade && <Typography variant="caption" color="text.secondary">{res.grade}</Typography>}
                                    </Box>
                                  )
                                ) : (
                                  <Typography color="text.disabled">—</Typography>
                                )}
                              </TableCell>
                            );
                          })}
                          
                          <TableCell align="center" sx={{ borderLeft: '2px solid rgba(224, 224, 224, 1)', fontWeight: 'bold' }}>
                            {s.totalObtained}
                          </TableCell>
                          <TableCell align="center">{s.percent.toFixed(1)}%</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', color: s.finalGrade === 'F' ? '#dc2626' : '#15803d' }}>
                            {s.finalGrade}
                          </TableCell>
                          <TableCell align="center">
                            <Box 
                              component="span" 
                              sx={{ 
                                display: 'inline-block',
                                minWidth: 48,
                                textAlign: 'center',
                                bgcolor: s.statusText === 'Pass' ? '#15803d' : (s.statusText === 'Fail' ? '#dc2626' : '#d97706'), 
                                color: '#ffffff',
                                px: 1.2, py: 0.4, borderRadius: 1, fontWeight: 'bold',
                                fontSize: '0.75rem'
                              }}
                            >
                              {s.statusText}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
