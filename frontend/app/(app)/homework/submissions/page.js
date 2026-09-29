"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Chip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";

export default function SubmissionsPage() {
  const searchParams = useSearchParams();
  const initialAssignmentId = searchParams.get("assignment") || "";
  
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(initialAssignmentId);
  
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Grading Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gradingSub, setGradingSub] = useState(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/assignments/?page_size=200").then(res => setAssignments(res.results || res)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      loadSubmissions(selectedAssignment);
    }
  }, [selectedAssignment]);

  async function loadSubmissions(assignmentId) {
    setLoading(true);
    setHasLoaded(true);
    try {
      const res = await api.get(`/assignment-submissions/?assignment=${assignmentId}&page_size=500`);
      setSubmissions(res.results || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const openGradeDialog = (sub) => {
    setGradingSub(sub);
    setMarks(sub.marks_obtained !== null ? sub.marks_obtained : "");
    setFeedback(sub.feedback || "");
    setDialogOpen(true);
  };

  const saveGrade = async () => {
    if (!gradingSub) return;
    setSaving(true);
    try {
      await api.post(`/assignment-submissions/${gradingSub.id}/grade/`, {
        marks_obtained: marks,
        feedback: feedback
      });
      setDialogOpen(false);
      loadSubmissions(selectedAssignment);
    } catch (err) {
      alert("Failed to save grade.");
    } finally {
      setSaving(false);
    }
  };

  const currentAssignmentInfo = assignments.find(a => String(a.id) === String(selectedAssignment));

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body1" fontWeight="bold">
            Filter Submissions:
          </Typography>

          <FormControl sx={{ minWidth: 300 }} size="small">
            <InputLabel>Select Assignment</InputLabel>
            <Select
              value={selectedAssignment}
              label="Select Assignment"
              onChange={(e) => setSelectedAssignment(e.target.value)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {assignments.map(a => <MenuItem key={a.id} value={a.id}>{a.title} (Room #{a.room})</MenuItem>)}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {!hasLoaded && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Select an Assignment from the dropdown to view and grade student submissions.
        </Alert>
      )}

      {hasLoaded && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell><strong>Student</strong></TableCell>
                  <TableCell><strong>Submitted At</strong></TableCell>
                  <TableCell><strong>Text Answer</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Marks</strong></TableCell>
                  <TableCell align="right"><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>Loading...</TableCell>
                  </TableRow>
                ) : submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No submissions received for this assignment yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((sub) => (
                    <TableRow key={sub.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{sub.student_name}</TableCell>
                      <TableCell>
                        {new Date(sub.submitted_at).toLocaleString()}
                        {sub.is_late && <Chip label="Late" size="small" color="error" sx={{ ml: 1, height: 20 }} />}
                      </TableCell>
                      <TableCell>
                        {sub.text_answer ? (
                          <Typography variant="body2" sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sub.text_answer}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">No text</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {sub.graded_at ? (
                          <Chip label="Graded" size="small" color="success" />
                        ) : (
                          <Chip label="Needs Grading" size="small" color="warning" />
                        )}
                      </TableCell>
                      <TableCell>
                        {sub.marks_obtained !== null ? (
                          <strong>{sub.marks_obtained} / {currentAssignmentInfo?.total_marks || '?'}</strong>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          variant="outlined" 
                          onClick={() => openGradeDialog(sub)}
                        >
                          {sub.graded_at ? "Update Grade" : "Grade"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Grading Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Grade Submission</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Student</Typography>
            <Typography variant="body1" fontWeight="bold">{gradingSub?.student_name}</Typography>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Text Answer</Typography>
            <Typography variant="body2" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 0.5, border: '1px solid', borderColor: 'divider' }}>
              {gradingSub?.text_answer || <em>No text provided.</em>}
            </Typography>
          </Box>
          <TextField
            fullWidth
            label={`Marks (out of ${currentAssignmentInfo?.total_marks || 100})`}
            type="number"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Feedback (optional)"
            multiline
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveGrade} disabled={saving}>
            {saving ? "Saving..." : "Save Grade"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
