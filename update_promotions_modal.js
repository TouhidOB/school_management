const fs = require('fs');

const content = `"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Grid, CircularProgress, Chip, Paper, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  List, ListItem, ListItemIcon, ListItemText
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SchoolIcon from "@mui/icons-material/School";
import SaveIcon from "@mui/icons-material/Save";

export default function PromotionsPage() {
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const [promoting, setPromoting] = useState(false);
  const [message, setMessage] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState(false);

  useEffect(() => {
    api.get("/academic-years/?page_size=200").then(res => setAcademicYears(res.results || res)).catch(() => {});
    api.get("/classes/?page_size=200").then(res => setClasses(res.results || res)).catch(() => {});
  }, []);

  const selectedYrObj = academicYears.find(y => String(y.id) === String(selectedYear));
  const selectedClsObj = classes.find(c => String(c.id) === String(selectedClass));
  const yrName = selectedYrObj?.name || "current year";
  const clsName = selectedClsObj?.name || "this class";

  // Calculate projected next year name
  let nextYearName = "Next Academic Year";
  if (selectedYrObj?.name) {
    const raw = selectedYrObj.name.trim();
    if (/^\\d+$/.test(raw)) {
      nextYearName = String(parseInt(raw, 10) + 1);
    } else if (raw.includes("-")) {
      const parts = raw.split("-");
      if (parts.length === 2 && /^\\d+$/.test(parts[0].trim()) && /^\\d+$/.test(parts[1].trim())) {
        nextYearName = \`\${parseInt(parts[0].trim(), 10) + 1}-\${parseInt(parts[1].trim(), 10) + 1}\`;
      } else {
        nextYearName = \`\${raw} (Next)\`;
      }
    } else {
      nextYearName = \`\${raw} (Next)\`;
    }
  }

  const loadResults = async () => {
    setLoading(true);
    setHasLoaded(true);
    setMessage("");
    try {
      const res = await api.get(\`/annual-results/?academic_year=\${selectedYear}&class_id=\${selectedClass}\`);
      setResults(res.results || res);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load annual results.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (move) => {
    setPendingMove(move);
    setModalOpen(true);
  };

  const executePromotion = async () => {
    setPromoting(true);
    setMessage("");
    try {
      const res = await api.post("/annual-promote/", {
        academic_year: selectedYear,
        class_id: selectedClass,
        pass_percentage: 33,
        move: pendingMove
      });

      if (res.moved) {
        setMessage(
          \`✓ Promotion complete! Academic Year "\${res.next_year_name}" created/selected. \` +
          \`Promoted \${res.promoted_count} passed student(s) to \${res.target_class_name || 'the next class'}\` +
          (res.retained_count > 0 ? \` (\${res.retained_count} student(s) retained in \${clsName}).\` : '.')
        );
      } else {
        setMessage(\`Successfully recorded annual results for \${res.processed} student(s).\`);
      }
      setModalOpen(false);
      // Refresh academic years list in background
      api.get("/academic-years/?page_size=200").then(r => setAcademicYears(r.results || r)).catch(() => {});
    } catch (err) {
      console.error(err);
      setMessage("Error processing promotions: " + (err.message || "Failed request"));
    } finally {
      setPromoting(false);
    }
  };

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
            Final Annual Results & Promotion
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Academic Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {academicYears.map(ay => <MenuItem key={ay.id} value={ay.id}>{ay.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Current Class</InputLabel>
                <Select
                  value={selectedClass}
                  label="Current Class"
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <Button 
                fullWidth
                variant="contained" 
                startIcon={<SearchIcon />}
                onClick={loadResults}
                disabled={!selectedYear || !selectedClass}
              >
                Calculate Annual Results
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!hasLoaded && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Select an Academic Year and Class to view the aggregated annual results for all students.
        </Alert>
      )}

      {hasLoaded && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold">Overall Class Results</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="secondary"
                size="small"
                onClick={() => handleOpenModal(false)}
                disabled={promoting || results.length === 0}
              >
                Record Results Only
              </Button>
              <Button 
                variant="contained" 
                color="success"
                size="small"
                startIcon={<UpgradeIcon />}
                onClick={() => handleOpenModal(true)}
                disabled={promoting || results.length === 0}
              >
                Promote & Move to Next Class
              </Button>
            </Box>
          </Box>
          <Divider />
          
          {message && (
            <Alert severity={message.includes("Error") || message.includes("Failed") ? "error" : "success"} sx={{ m: 2 }}>
              {message}
            </Alert>
          )}

          <TableContainer component={Paper} elevation={0} className="tabulation-sheet">
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell><strong>Rank</strong></TableCell>
                  <TableCell><strong>Roll #</strong></TableCell>
                  <TableCell><strong>Student Name</strong></TableCell>
                  <TableCell align="center"><strong>Total Marks Obtained</strong></TableCell>
                  <TableCell align="center"><strong>Percentage</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell>
                  </TableRow>
                ) : results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No exam records found for this class and year.
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((s) => (
                    <TableRow key={s.student_id} hover>
                      <TableCell><strong>#{s.rank}</strong></TableCell>
                      <TableCell>{s.roll_number || "—"}</TableCell>
                      <TableCell>{s.student_name}</TableCell>
                      <TableCell align="center">{s.obtained} / {s.possible}</TableCell>
                      <TableCell align="center">{s.percentage}%</TableCell>
                      <TableCell align="center">
                        <Chip 
                          size="small" 
                          label={s.status} 
                          sx={{
                            fontWeight: 'bold',
                            bgcolor: s.status === 'Pass' ? '#15803d' : (s.status === 'Partial' ? '#d97706' : '#dc2626'),
                            color: '#ffffff',
                            minWidth: 55
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Bootstrap / Modern Modal Dialog */}
      <Dialog 
        open={modalOpen} 
        onClose={() => !promoting && setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 2, 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          bgcolor: '#f8fafc', 
          py: 2, 
          px: 3,
          borderBottom: '1px solid #e2e8f0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              bgcolor: pendingMove ? '#dcfce7' : '#e0f2fe', 
              color: pendingMove ? '#15803d' : '#0284c7', 
              p: 1, 
              borderRadius: '8px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SchoolIcon />
            </Box>
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
              {pendingMove ? "Confirm Student Promotion" : "Save Final Results"}
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={() => setModalOpen(false)} 
            disabled={promoting}
            sx={{ color: '#64748b' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {pendingMove ? (
            <Box>
              <Typography variant="body1" sx={{ mb: 2, color: '#334155' }}>
                Promoting students from <strong>Academic Year {yrName}</strong> in <strong>{clsName}</strong>:
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', mb: 2.5, borderRadius: 1.5, borderColor: '#e2e8f0' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#475569' }}>
                  The system will perform the following actions:
                </Typography>
                <List dense disablePadding>
                  <ListItem disableGutters sx={{ py: 0.6 }}>
                    <ListItemIcon sx={{ minWidth: 28, color: '#2563eb' }}>
                      <CheckCircleOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" color="#1e293b"><strong>Create/Advance Academic Year:</strong> Automatically transition students to <strong>{nextYearName}</strong></Typography>} 
                    />
                  </ListItem>
                  <ListItem disableGutters sx={{ py: 0.6 }}>
                    <ListItemIcon sx={{ minWidth: 28, color: '#16a34a' }}>
                      <CheckCircleOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" color="#1e293b"><strong>Promote Passed Students:</strong> Advance all students with <strong>Pass</strong> status to the next class</Typography>} 
                    />
                  </ListItem>
                  <ListItem disableGutters sx={{ py: 0.6 }}>
                    <ListItemIcon sx={{ minWidth: 28, color: '#d97706' }}>
                      <CheckCircleOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" color="#1e293b"><strong>Retain Others:</strong> Students with <strong>Partial</strong> or <strong>Fail</strong> status will remain in {clsName}</Typography>} 
                    />
                  </ListItem>
                </List>
              </Paper>

              <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
                Promotion history will be permanently recorded and students' classes will be updated immediately.
              </Alert>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" sx={{ color: '#334155', mb: 2 }}>
                Save the final annual marks and pass/fail merit records for <strong>{clsName}</strong> ({yrName}) without advancing student classes or switching the academic year.
              </Typography>
              <Alert severity="warning" sx={{ fontSize: '0.85rem' }}>
                Student classes will not be changed. Use this if you only want to record merit list standing.
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          px: 3, 
          py: 2, 
          bgcolor: '#f8fafc', 
          borderTop: '1px solid #e2e8f0', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 1.5 
        }}>
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={() => setModalOpen(false)}
            disabled={promoting}
            sx={{ textTransform: 'none', color: '#475569', borderColor: '#cbd5e1' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color={pendingMove ? "success" : "primary"}
            onClick={executePromotion}
            disabled={promoting}
            startIcon={promoting ? <CircularProgress size={16} color="inherit" /> : (pendingMove ? <UpgradeIcon /> : <SaveIcon />)}
            sx={{ textTransform: 'none', fontWeight: 'bold', minWidth: 160 }}
          >
            {promoting ? "Processing..." : (pendingMove ? "Confirm & Promote" : "Save Results")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
`;

fs.writeFileSync("frontend/app/(app)/exams/promotions/page.js", content);
console.log("Updated promotions page with modern modal");
