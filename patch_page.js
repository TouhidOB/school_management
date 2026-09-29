const fs = require('fs');

const content = `"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Grid, CircularProgress, Chip, Paper, Divider
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import UpgradeIcon from "@mui/icons-material/Upgrade";

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

  useEffect(() => {
    api.get("/academic-years/?page_size=200").then(res => setAcademicYears(res.results || res)).catch(() => {});
    api.get("/classes/?page_size=200").then(res => setClasses(res.results || res)).catch(() => {});
  }, []);

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

  const promoteStudents = async (move) => {
    if (!confirm(move ? "Are you sure you want to finalize and move passed students to the next class?" : "Are you sure you want to record the pass/fail results without moving students?")) return;
    setPromoting(true);
    setMessage("Processing promotions...");
    try {
      const res = await api.post("/annual-promote/", {
        academic_year: selectedYear,
        class_id: selectedClass,
        pass_percentage: 33,
        move: move
      });
      setMessage(\`Successfully processed \${res.processed} students. \${res.moved ? "Classes updated." : ""}\`);
    } catch (err) {
      console.error(err);
      setMessage("Error processing promotions.");
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
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6">Overall Class Results</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                color="secondary"
                size="small"
                onClick={() => promoteStudents(false)}
                disabled={promoting || results.length === 0}
              >
                Record Results Only
              </Button>
              <Button 
                variant="contained" 
                color="success"
                size="small"
                startIcon={<UpgradeIcon />}
                onClick={() => promoteStudents(true)}
                disabled={promoting || results.length === 0}
              >
                {promoting ? "Processing..." : "Promote & Move to Next Class"}
              </Button>
            </Box>
          </Box>
          <Divider />
          
          {message && (
            <Alert severity={message.includes("Error") || message.includes("Failed") ? "error" : "success"} sx={{ m: 2 }}>
              {message}
            </Alert>
          )}

          <TableContainer component={Paper} elevation={0}>
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
                          color={s.status === "Pass" ? "success" : "error"} 
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
    </Box>
  );
}
`;

fs.writeFileSync("frontend/app/(app)/exams/promotions/page.js", content);
