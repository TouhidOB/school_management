"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box, Typography, Grid, Card, CardContent, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  Alert, IconButton
} from "@mui/material";
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import DeleteIcon from "@mui/icons-material/Delete";

export default function LibraryIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({ book: "", student: "", issue_date: "", due_date: "" });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get("/library/issues/"),
      api.get("/library/books/"),
      api.get("/students/")
    ]).then(([issuesData, booksData, studentsData]) => {
      setIssues(issuesData.results || issuesData);
      setBooks(booksData.results || booksData);
      setStudents(studentsData.results || studentsData);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleIssueBook = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/library/issues/", form);
      setForm({ book: "", student: "", issue_date: "", due_date: "" });
      loadData();
    } catch (err) {
      setError(err.data ? JSON.stringify(err.data) : err.message);
    }
  };

  const handleReturnBook = async (issueId) => {
    if (!confirm("Confirm returning this book?")) return;
    try {
      await api.post(`/library/issues/${issueId}/return_book/`, {});
      loadData();
    } catch (err) {
      alert(err.data?.detail || "Failed to return book");
    }
  };
  
  const handleDelete = async (issueId) => {
    if (!confirm("Delete this record permanently?")) return;
    try {
      await api.del(`/library/issues/${issueId}/`);
      loadData();
    } catch (err) {
      alert("Failed to delete record");
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Library Borrowing & Returns</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Issue a Book</Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              
              <form onSubmit={handleIssueBook}>
                <TextField
                  select fullWidth size="small" sx={{ mb: 2 }} label="Select Book"
                  value={form.book} onChange={e => setForm({...form, book: e.target.value})} required
                >
                  <MenuItem value=""><em>--</em></MenuItem>
                  {books.map(b => (
                    <MenuItem key={b.id} value={b.id} disabled={b.available_quantity <= 0}>
                      {b.title} ({b.available_quantity} available)
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select fullWidth size="small" sx={{ mb: 2 }} label="Select Student"
                  value={form.student} onChange={e => setForm({...form, student: e.target.value})} required
                >
                  <MenuItem value=""><em>--</em></MenuItem>
                  {students.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.full_name} ({s.admission_number})</MenuItem>
                  ))}
                </TextField>

                <TextField
                  type="date" fullWidth size="small" sx={{ mb: 2 }} label="Issue Date"
                  InputLabelProps={{ shrink: true }} required
                  value={form.issue_date} onChange={e => setForm({...form, issue_date: e.target.value})}
                />
                
                <TextField
                  type="date" fullWidth size="small" sx={{ mb: 2 }} label="Due Date"
                  InputLabelProps={{ shrink: true }} required
                  value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                />

                <Button type="submit" variant="contained" fullWidth>Issue Book</Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell>Book</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Fine</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Loading...</TableCell></TableRow>
                  ) : issues.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>No records found.</TableCell></TableRow>
                  ) : issues.map(row => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.book_title}</TableCell>
                      <TableCell>{row.student_name}</TableCell>
                      <TableCell>{row.due_date}</TableCell>
                      <TableCell>
                        <Chip size="small" 
                          color={row.status === 'issued' ? 'primary' : 'success'} 
                          label={row.status} />
                      </TableCell>
                      <TableCell sx={{ color: row.fine_amount > 0 ? 'error.main' : 'inherit' }}>
                        ${row.fine_amount}
                      </TableCell>
                      <TableCell align="right">
                        {row.status === 'issued' && (
                          <Button size="small" color="secondary" onClick={() => handleReturnBook(row.id)}
                            startIcon={<KeyboardReturnIcon />} sx={{ textTransform: 'none' }}>
                            Return
                          </Button>
                        )}
                        <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
