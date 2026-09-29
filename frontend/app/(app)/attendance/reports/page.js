"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tooltip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

export default function AttendanceReportsPage() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [sectionId, setSectionId] = useState("");
  
  // Default to current month (YYYY-MM)
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

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

  async function generateReport() {
    if (!sectionId || !month) return;
    setLoading(true);
    setHasLoaded(true);
    setError("");
    
    try {
      const [studs, attRes] = await Promise.all([
        api.get(`/students/?current_section=${sectionId}&page_size=500`),
        api.get(`/student-attendance/?section=${sectionId}&page_size=5000`)
      ]);
      
      setStudents(studs.results || studs);
      
      // Filter attendance records to only include the selected month
      const allAtt = attRes.results || attRes;
      const monthAtt = allAtt.filter(r => r.date.startsWith(month));
      setAttendance(monthAtt);
      
    } catch (err) {
      console.error(err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Calculate days in the selected month
  const daysInMonth = useMemo(() => {
    if (!month) return [];
    const [y, m] = month.split('-');
    const numDays = new Date(parseInt(y), parseInt(m), 0).getDate();
    return Array.from({ length: numDays }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${month}-${dayNum.toString().padStart(2, '0')}`;
      return { num: dayNum, dateStr };
    });
  }, [month]);

  // Create a fast lookup map: studentId -> date -> status
  const attendanceMap = useMemo(() => {
    const map = {};
    attendance.forEach(record => {
      if (!map[record.student]) map[record.student] = {};
      map[record.student][record.date] = record.status;
    });
    return map;
  }, [attendance]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'success.main';
      case 'absent': return 'error.main';
      case 'late': return 'warning.main';
      case 'leave': return 'primary.main';
      default: return 'text.disabled';
    }
  };

  const getStatusChar = (status) => {
    switch (status) {
      case 'present': return 'P';
      case 'absent': return 'A';
      case 'late': return 'L';
      case 'leave': return 'Lv';
      default: return '-';
    }
  };

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body1" fontWeight="bold">
            Report Filters:
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
            type="month"
            size="small"
            label="Month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />

          <Button 
            variant="contained" 
            startIcon={<SearchIcon />}
            onClick={generateReport}
            disabled={!sectionId || !month}
          >
            Generate Report
          </Button>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {hasLoaded && !loading && students.length > 0 && (
            <Button 
              variant="outlined" 
              startIcon={<FileDownloadIcon />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          )}
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!hasLoaded && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Select a Class, Section, and Month to view the Monthly Attendance Report.
        </Alert>
      )}

      {hasLoaded && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4, justifyContent: 'center' }}>
                <CircularProgress size={24} />
                <Typography color="text.secondary">Generating report…</Typography>
              </Box>
            ) : students.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No students found in this section.
              </Typography>
            ) : (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Monthly Attendance: {new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Typography>
                
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Table size="small" sx={{ minWidth: 800 }}>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ minWidth: 150, position: 'sticky', left: 0, bgcolor: 'action.hover', zIndex: 1 }}>
                          <strong>Student</strong>
                        </TableCell>
                        <TableCell align="center" sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
                          <strong>P%</strong>
                        </TableCell>
                        {daysInMonth.map(day => (
                          <TableCell key={day.num} align="center" sx={{ minWidth: 35, p: '4px' }}>
                            <Typography variant="caption" fontWeight="bold">{day.num}</Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((student) => {
                        let presentCount = 0;
                        let totalCount = 0;
                        
                        // Calculate stats for this student
                        daysInMonth.forEach(day => {
                          const status = attendanceMap[student.id]?.[day.dateStr];
                          if (status) {
                            totalCount++;
                            if (status === 'present' || status === 'late') presentCount++;
                          }
                        });
                        
                        const percent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
                        
                        return (
                          <TableRow key={student.id} hover>
                            <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1, whiteSpace: 'nowrap' }}>
                              {student.full_name}
                              <Typography variant="caption" display="block" color="text.secondary">
                                Roll: {student.roll_number || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', fontWeight: 'bold' }}>
                              {totalCount > 0 ? `${percent}%` : '-'}
                            </TableCell>
                            
                            {daysInMonth.map(day => {
                              const status = attendanceMap[student.id]?.[day.dateStr];
                              return (
                                <TableCell key={day.num} align="center" sx={{ p: '4px', borderRight: '1px dashed rgba(224, 224, 224, 0.4)' }}>
                                  {status ? (
                                    <Tooltip title={`${day.dateStr}: ${status}`}>
                                      <Typography variant="body2" sx={{ color: getStatusColor(status), fontWeight: 'bold' }}>
                                        {getStatusChar(status)}
                                      </Typography>
                                    </Tooltip>
                                  ) : (
                                    <Typography variant="body2" color="text.disabled">-</Typography>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 3, display: 'flex', gap: 3, justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'bold' }}>P = Present</Typography>
                  <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 'bold' }}>A = Absent</Typography>
                  <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 'bold' }}>L = Late</Typography>
                  <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>Lv = Leave</Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
