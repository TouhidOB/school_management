"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Grid, CircularProgress, Alert, Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CloseIcon from "@mui/icons-material/Close";

export default function StudentFeesPage() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  
  const [students, setStudents] = useState([]);
  const [studentBalances, setStudentBalances] = useState({}); // student_id -> { billed, paid, due, invoices: [] }
  
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Ledger Dialog
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);

  useEffect(() => {
    api.get("/classes/?page_size=200").then(res => setClasses(res.results || res)).catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedSection("");
    setSections([]);
    setHasLoaded(false);

    if (selectedClass) {
      api.get(`/sections/?school_class=${selectedClass}&page_size=200`).then(res => setSections(res.results || res));
    }
  }, [selectedClass]);

  async function loadStudentFees() {
    if (!selectedClass || !selectedSection) return;
    setLoading(true);
    setHasLoaded(true);
    
    try {
      const [studsRes, invRes] = await Promise.all([
        api.get(`/students/?current_section=${selectedSection}&page_size=500`),
        api.get(`/invoices/?page_size=5000`) // In a real massive app we'd need a backend aggregation endpoint or section filter on invoices
      ]);
      
      const studs = studsRes.results || studsRes;
      const allInvoices = invRes.results || invRes;
      
      const balances = {};
      studs.forEach(s => {
        balances[s.id] = { billed: 0, paid: 0, due: 0, invoices: [] };
      });
      
      allInvoices.forEach(inv => {
        if (balances[inv.student]) {
          balances[inv.student].invoices.push(inv);
          
          if (inv.status !== 'cancelled') {
            const grandTotal = parseFloat(inv.grand_total) || 0;
            let paidAmount = 0;
            
            if (inv.payments && inv.payments.length > 0) {
              inv.payments.forEach(p => {
                paidAmount += (parseFloat(p.amount_paid) || 0);
              });
            }
            
            balances[inv.student].billed += grandTotal;
            balances[inv.student].paid += paidAmount;
            balances[inv.student].due += (grandTotal - paidAmount);
          }
        }
      });
      
      setStudents(studs);
      setStudentBalances(balances);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatMoney = (amount) => {
    return '৳' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const openLedger = (student) => {
    setActiveStudent(student);
    setLedgerOpen(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'success';
      case 'overdue': return 'error';
      case 'partially_paid': return 'warning';
      case 'cancelled': return 'default';
      default: return 'primary';
    }
  };

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
            Student Fee Ledger Filters:
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
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

            <Grid item xs={12} md={4}>
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

            <Grid item xs={12} md={4}>
              <Button 
                fullWidth
                variant="contained" 
                startIcon={<SearchIcon />}
                onClick={loadStudentFees}
                disabled={!selectedSection || !selectedClass}
              >
                Load Students
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!hasLoaded && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Select a Class and Section to view fee balances and ledgers for students.
        </Alert>
      )}

      {hasLoaded && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell><strong>Roll #</strong></TableCell>
                  <TableCell><strong>Student Name</strong></TableCell>
                  <TableCell><strong>Total Billed</strong></TableCell>
                  <TableCell><strong>Total Paid</strong></TableCell>
                  <TableCell><strong>Balance Due</strong></TableCell>
                  <TableCell align="right"><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No students found in this section.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((s) => {
                    const stats = studentBalances[s.id] || { billed: 0, paid: 0, due: 0 };
                    const hasDue = stats.due > 0;
                    
                    return (
                      <TableRow key={s.id} hover>
                        <TableCell>{s.roll_number || "—"}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{s.full_name}</TableCell>
                        <TableCell>{formatMoney(stats.billed)}</TableCell>
                        <TableCell sx={{ color: 'success.main', fontWeight: 'medium' }}>
                          {formatMoney(stats.paid)}
                        </TableCell>
                        <TableCell sx={{ color: hasDue ? 'error.main' : 'text.primary', fontWeight: hasDue ? 'bold' : 'normal' }}>
                          {formatMoney(stats.due)}
                        </TableCell>
                        <TableCell align="right">
                          <Button 
                            size="small" 
                            variant="outlined"
                            startIcon={<ReceiptLongIcon />}
                            onClick={() => openLedger(s)}
                          >
                            Ledger
                          </Button>
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

      {/* Ledger Dialog */}
      <Dialog open={ledgerOpen} onClose={() => setLedgerOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Student Ledger</Typography>
            <Typography variant="body2" color="text.secondary">
              {activeStudent?.full_name} (Roll: {activeStudent?.roll_number || 'N/A'})
            </Typography>
          </Box>
          <IconButton onClick={() => setLedgerOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {activeStudent && (
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell><strong>Invoice #</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Due Date</strong></TableCell>
                  <TableCell><strong>Total</strong></TableCell>
                  <TableCell><strong>Paid</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentBalances[activeStudent.id]?.invoices?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No invoices found for this student.
                    </TableCell>
                  </TableRow>
                ) : (
                  studentBalances[activeStudent.id]?.invoices?.map(inv => {
                    const paidAmount = inv.payments?.reduce((acc, p) => acc + (parseFloat(p.amount_paid) || 0), 0) || 0;
                    
                    return (
                      <TableRow key={inv.id}>
                        <TableCell sx={{ fontWeight: 500 }}>{inv.invoice_number}</TableCell>
                        <TableCell>{inv.invoice_date}</TableCell>
                        <TableCell sx={{ color: new Date(inv.due_date) < new Date() && inv.status !== 'paid' ? 'error.main' : 'text.primary' }}>
                          {inv.due_date || "—"}
                        </TableCell>
                        <TableCell>{formatMoney(parseFloat(inv.grand_total))}</TableCell>
                        <TableCell>{formatMoney(paidAmount)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={inv.status.replace('_', ' ').toUpperCase()} 
                            size="small" 
                            color={getStatusColor(inv.status)} 
                            sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLedgerOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
