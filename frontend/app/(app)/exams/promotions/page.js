"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Grid, CircularProgress, Chip, Paper, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Stack, TextField, InputAdornment,
  Tabs, Tab
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SchoolIcon from "@mui/icons-material/School";
import SaveIcon from "@mui/icons-material/Save";
import ReceiptIcon from "@mui/icons-material/Receipt";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LockIcon from "@mui/icons-material/Lock";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import PrintIcon from "@mui/icons-material/Print";

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

  // Promotion Confirmation Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState(false);

  // Single Student Settle Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleStudent, setSettleStudent] = useState(null);
  const [settleTab, setSettleTab] = useState(0); // 0 = Pay Now, 1 = Admin Waiver
  const [settleAmount, setSettleAmount] = useState("");
  const [settleMethod, setSettleMethod] = useState("cash");
  const [settleTxnId, setSettleTxnId] = useState("");
  const [settleReason, setSettleReason] = useState("");
  const [settling, setSettling] = useState(false);
  const [settleError, setSettleError] = useState("");

  // Batch Settle Modal State
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchTab, setBatchTab] = useState(0); // 0 = Bulk Pay, 1 = Bulk Waive
  const [batchMethod, setBatchMethod] = useState("cash");
  const [batchReason, setBatchReason] = useState("");
  const [batchSettling, setBatchSettling] = useState(false);
  const [batchError, setBatchError] = useState("");

  useEffect(() => {
    api.get("/academic-years/?page_size=200").then(res => {
      const list = res.results || res || [];
      list.sort((a, b) => (b.is_current ? 1 : 0) - (a.is_current ? 1 : 0) || (b.name || "").localeCompare(a.name || ""));
      setAcademicYears(list);
      const curr = list.find(y => y.is_current) || list[0];
      if (curr) {
        setSelectedYear(prev => prev || String(curr.id));
      }
    }).catch(() => {});
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
    if (/^\d+$/.test(raw)) {
      nextYearName = String(parseInt(raw, 10) + 1);
    } else if (raw.includes("-")) {
      const parts = raw.split("-");
      if (parts.length === 2 && /^\d+$/.test(parts[0].trim()) && /^\d+$/.test(parts[1].trim())) {
        nextYearName = `${parseInt(parts[0].trim(), 10) + 1}-${parseInt(parts[1].trim(), 10) + 1}`;
      } else {
        nextYearName = `${raw} (Next)`;
      }
    } else {
      nextYearName = `${raw} (Next)`;
    }
  }

  const loadResults = async () => {
    setLoading(true);
    setHasLoaded(true);
    setMessage("");
    try {
      const res = await api.get(`/annual-results/?academic_year=${selectedYear}&class_id=${selectedClass}`);
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
        let msg = `✓ Promotion complete! Academic Year "${res.next_year_name}" created/selected. ` +
          `Promoted ${res.promoted_count} eligible student(s) (${res.passed_promoted_count} passed, ${res.conditional_promoted_count} conditional fee cleared) to ${res.target_class_name || 'the next class'}.`;
        if (res.retained_count > 0) {
          msg += ` Platform policy strictly retained ${res.retained_count} student(s) in ${clsName} due to unsettled fees.`;
        }
        setMessage(msg);
      } else {
        setMessage(`Successfully recorded annual results: ${res.promoted_count} promotable (${res.passed_promoted_count} pass, ${res.conditional_promoted_count} conditional fee cleared), ${res.retained_count} retained.`);
      }
      setModalOpen(false);
      // Refresh academic years list & student results
      api.get("/academic-years/?page_size=200").then(r => setAcademicYears(r.results || r)).catch(() => {});
      loadResults();
    } catch (err) {
      console.error(err);
      setMessage("Error processing promotions: " + (err.message || "Failed request"));
    } finally {
      setPromoting(false);
    }
  };

  // Settle Actions
  const handleOpenSettleModal = (stud) => {
    setSettleStudent(stud);
    setSettleAmount(String(stud.due_amount || stud.fee_amount || 500));
    setSettleMethod("cash");
    setSettleTxnId("");
    setSettleReason("");
    setSettleTab(0);
    setSettleError("");
    setSettleModalOpen(true);
  };

  const handleConfirmSettle = async () => {
    if (!settleStudent) return;
    setSettling(true);
    setSettleError("");
    try {
      const payload = {
        academic_year: selectedYear,
        student_id: settleStudent.student_id,
        settlement_type: settleTab === 0 ? "pay" : "waive",
        amount: parseFloat(settleAmount) || 500,
        payment_method: settleMethod,
        transaction_id: settleTxnId,
        reason: settleReason,
      };
      await api.post("/settle-promotion-fee/", payload);
      setSettleModalOpen(false);
      setMessage(`✓ Promotion fee for ${settleStudent.student_name} settled successfully via ${settleTab === 0 ? 'Payment' : 'Waiver'}! Promotion permission unlocked.`);
      
      // If payment, open due slip in new tab for instant printing
      if (settleTab === 0) {
        window.open(`/print/student/${settleStudent.student_id}/due-slip`, "_blank");
      }
      
      loadResults();
    } catch (err) {
      console.error(err);
      setSettleError(err.data?.error || err.message || "Failed to settle promotion fee.");
    } finally {
      setSettling(false);
    }
  };

  const handleOpenBatchSettle = () => {
    setBatchTab(0);
    setBatchMethod("cash");
    setBatchReason("");
    setBatchError("");
    setBatchModalOpen(true);
  };

  const handleConfirmBatchSettle = async () => {
    if (pendingFeeStudents.length === 0) return;
    setBatchSettling(true);
    setBatchError("");
    try {
      const studentIds = pendingFeeStudents.map(s => s.student_id);
      const payload = {
        academic_year: selectedYear,
        student_ids: studentIds,
        settlement_type: batchTab === 0 ? "pay" : "waive",
        payment_method: batchMethod,
        reason: batchReason,
      };
      const res = await api.post("/settle-promotion-fee/", payload);
      setBatchModalOpen(false);
      setMessage(`✓ Successfully batch-settled ${res.settled_count || studentIds.length} students via ${batchTab === 0 ? 'Payment' : 'Waiver'}! All promotion permissions unlocked.`);
      loadResults();
    } catch (err) {
      console.error(err);
      setBatchError(err.data?.error || err.message || "Failed to batch settle students.");
    } finally {
      setBatchSettling(false);
    }
  };

  // Metrics
  const totalStudents = results.length;
  const passedStudents = results.filter(r => r.status === "Pass");
  const partialStudents = results.filter(r => r.status === "Partial");
  const failStudents = results.filter(r => r.status === "Fail");
  const feePaidStudents = results.filter(r => r.status !== "Pass" && r.fee_status === "Paid");
  const feeWaivedStudents = results.filter(r => r.status !== "Pass" && r.fee_status === "Waived");
  const pendingFeeStudents = results.filter(r => r.status !== "Pass" && r.fee_status !== "Paid" && r.fee_status !== "Waived");
  
  const totalEligibleCount = passedStudents.length + feePaidStudents.length + feeWaivedStudents.length;
  const totalRetainedCount = pendingFeeStudents.length;

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
            <Box>
              <Typography variant="h6" fontWeight="bold">Overall Class Results</Typography>
              <Typography variant="caption" color="text.secondary">
                Pass = Free Direct Promotion • Partial / Fail = Requires Conditional Promotion Fee (৳500)
              </Typography>
            </Box>
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

          {/* Metrics summary banner */}
          {results.length > 0 && (
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
                <Chip label={`Total: ${totalStudents}`} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />
                <Chip 
                  icon={<CheckCircleOutlineIcon />} 
                  label={`Passed (Eligible): ${passedStudents.length}`} 
                  size="small" 
                  sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 'bold', border: '1px solid #86efac' }} 
                />
                <Chip 
                  icon={<MonetizationOnIcon />} 
                  label={`Fee Paid: ${feePaidStudents.length}`} 
                  size="small" 
                  sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 'bold', border: '1px solid #93c5fd' }} 
                />
                {feeWaivedStudents.length > 0 && (
                  <Chip 
                    icon={<CheckCircleOutlineIcon />} 
                    label={`Fee Waived / Settled: ${feeWaivedStudents.length}`} 
                    size="small" 
                    sx={{ bgcolor: '#f3e8ff', color: '#7e22ce', fontWeight: 'bold', border: '1px solid #d8b4fe' }} 
                  />
                )}
                <Chip 
                  icon={<LockIcon fontSize="small" />} 
                  label={`Blocked (Unpaid): ${totalRetainedCount}`} 
                  size="small" 
                  sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 'bold', border: '1px solid #fca5a5' }} 
                />
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                {totalRetainedCount > 0 && (
                  <Button
                    size="small"
                    variant="contained"
                    color="warning"
                    startIcon={<DoneAllIcon />}
                    onClick={handleOpenBatchSettle}
                    sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}
                  >
                    Settle All Pending ({totalRetainedCount})
                  </Button>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  href="/finance/collection"
                  startIcon={<ReceiptIcon />}
                  sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  Accounts Due Ledger
                </Button>
              </Stack>
            </Box>
          )}

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
                  <TableCell align="center"><strong>Total Marks</strong></TableCell>
                  <TableCell align="center"><strong>Percentage</strong></TableCell>
                  <TableCell align="center"><strong>Result Status</strong></TableCell>
                  <TableCell align="center"><strong>Promotion Eligibility & Accounts Status</strong></TableCell>
                  <TableCell align="center"><strong>Settle & Receipts</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell>
                  </TableRow>
                ) : results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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
                            minWidth: 60
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {s.status === "Pass" ? (
                          <Chip 
                            size="small" 
                            icon={<CheckCircleOutlineIcon />} 
                            label="Eligible (Passed)" 
                            sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 'bold', border: '1px solid #86efac' }} 
                          />
                        ) : s.fee_status === "Waived" ? (
                          <Chip 
                            size="small" 
                            icon={<CheckCircleOutlineIcon />} 
                            label="Eligible (Fee Waived / Settled)" 
                            sx={{ bgcolor: '#f3e8ff', color: '#7e22ce', fontWeight: 'bold', border: '1px solid #d8b4fe' }} 
                          />
                        ) : s.fee_status === "Paid" ? (
                          <Chip 
                            size="small" 
                            icon={<CheckCircleOutlineIcon />} 
                            label="Eligible (Fee Paid in Accounts)" 
                            sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 'bold', border: '1px solid #93c5fd' }} 
                          />
                        ) : (
                          <Chip 
                            size="small" 
                            icon={<LockIcon fontSize="small" />} 
                            label={`Blocked: Unpaid ৳${s.due_amount || s.fee_amount || 500}`} 
                            sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 'bold', border: '1px solid #fca5a5' }} 
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {s.status === "Pass" ? (
                          <Typography variant="caption" color="text.secondary">Free Direct Promo</Typography>
                        ) : (s.fee_status === "Paid" || s.fee_status === "Waived") ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="info"
                            startIcon={<ReceiptIcon fontSize="small" />}
                            onClick={() => window.open(`/print/student/${s.student_id}/due-slip`, "_blank")}
                            sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '0.75rem', py: 0.2 }}
                          >
                            Receipt Slip
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            color="warning"
                            startIcon={<MonetizationOnIcon fontSize="small" />}
                            onClick={() => handleOpenSettleModal(s)}
                            sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '0.75rem', py: 0.2 }}
                          >
                            Settle Fee
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Single Student Settle Modal Dialog */}
      <Dialog
        open={settleModalOpen}
        onClose={() => !settling && setSettleModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', py: 2, px: 3, borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ bgcolor: '#fef3c7', color: '#b45309', p: 1, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MonetizationOnIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Settle Promotion Fee</Typography>
              <Typography variant="caption" color="text.secondary">
                {settleStudent?.student_name} • Roll: {settleStudent?.roll_number || '—'}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setSettleModalOpen(false)} disabled={settling}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {settleError && <Alert severity="error" sx={{ mb: 2 }}>{settleError}</Alert>}
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Settling this fee clears the student&apos;s personal account balance and grants platform permission for promotion to the next class.
            </Typography>
            <Tabs 
              value={settleTab} 
              onChange={(e, val) => setSettleTab(val)}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="1. Collect Payment (Pay Now)" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
              <Tab label="2. Administrative Waiver" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
            </Tabs>
          </Box>

          {settleTab === 0 ? (
            <Stack spacing={2}>
              <TextField
                label="Amount to Pay (৳)"
                fullWidth
                size="small"
                type="number"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={settleMethod}
                  label="Payment Method"
                  onChange={(e) => setSettleMethod(e.target.value)}
                >
                  <MenuItem value="cash">Cash In Hand</MenuItem>
                  <MenuItem value="bank">Bank Transfer</MenuItem>
                  <MenuItem value="online">Online / Mobile Banking (bKash / Nagad / Rocket)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Transaction ID / Receipt Note (Optional)"
                fullWidth
                size="small"
                placeholder="e.g. CASH-REC-01 or bKash TrxID"
                value={settleTxnId}
                onChange={(e) => setSettleTxnId(e.target.value)}
              />
              <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                Payment will be credited to the School Treasury Wallet and recorded on the student&apos;s personal billing ledger. Printable receipt will open upon completion.
              </Alert>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Alert severity="warning" sx={{ fontSize: '0.85rem' }}>
                <strong>Administrative Fee Exemption:</strong> This will officially waive the ৳{settleStudent?.due_amount || settleStudent?.fee_amount || 500} conditional fee and immediately grant promotion eligibility.
              </Alert>
              <TextField
                label="Waiver Authorization Reason"
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="e.g. Approved fee waiver by Principal for financial hardship / special scholarship"
                value={settleReason}
                onChange={(e) => setSettleReason(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" color="inherit" onClick={() => setSettleModalOpen(false)} disabled={settling} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={settleTab === 0 ? "success" : "secondary"}
            onClick={handleConfirmSettle}
            disabled={settling}
            startIcon={settling ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >
            {settling ? "Processing..." : (settleTab === 0 ? "Collect Payment & Grant Permission" : "Apply Waiver & Grant Permission")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Batch Settle Modal Dialog */}
      <Dialog
        open={batchModalOpen}
        onClose={() => !batchSettling && setBatchModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', py: 2, px: 3, borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ bgcolor: '#dbeafe', color: '#1e40af', p: 1, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DoneAllIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Batch Settle Unpaid Students</Typography>
              <Typography variant="caption" color="text.secondary">
                {pendingFeeStudents.length} student(s) currently pending settlement
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setBatchModalOpen(false)} disabled={batchSettling}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {batchError && <Alert severity="error" sx={{ mb: 2 }}>{batchError}</Alert>}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose how to settle all {pendingFeeStudents.length} students simultaneously:
          </Typography>

          <Tabs 
            value={batchTab} 
            onChange={(e, val) => setBatchTab(val)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="1. Bulk Cash Payment" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
            <Tab label="2. Bulk Administrative Waiver" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
          </Tabs>

          {batchTab === 0 ? (
            <Stack spacing={2}>
              <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
                This will mark all <strong>{pendingFeeStudents.length} students</strong> as Paid via {batchMethod.toUpperCase()} and credit total <strong>৳{pendingFeeStudents.reduce((sum, s) => sum + (s.due_amount || s.fee_amount || 500), 0)}</strong> to the Treasury Wallet.
              </Alert>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={batchMethod}
                  label="Payment Method"
                  onChange={(e) => setBatchMethod(e.target.value)}
                >
                  <MenuItem value="cash">Cash In Hand</MenuItem>
                  <MenuItem value="bank">Bank Transfer</MenuItem>
                  <MenuItem value="online">Online / Mobile Banking</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Alert severity="warning" sx={{ fontSize: '0.85rem' }}>
                This will grant an administrative fee waiver to all <strong>{pendingFeeStudents.length} students</strong>, clearing their balances and granting promotion permission.
              </Alert>
              <TextField
                label="Batch Waiver Reason"
                fullWidth
                size="small"
                placeholder="e.g. Annual school management fee exemption for 2026"
                value={batchReason}
                onChange={(e) => setBatchReason(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" color="inherit" onClick={() => setBatchModalOpen(false)} disabled={batchSettling} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={batchTab === 0 ? "success" : "secondary"}
            onClick={handleConfirmBatchSettle}
            disabled={batchSettling}
            startIcon={batchSettling ? <CircularProgress size={16} color="inherit" /> : <DoneAllIcon />}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >
            {batchSettling ? "Processing..." : (batchTab === 0 ? `Collect Payment for All (${pendingFeeStudents.length})` : `Waive All (${pendingFeeStudents.length})`)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Modal Dialog for Promotion */}
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
                  Promotion & Accounts Gating Breakdown:
                </Typography>
                <List dense disablePadding>
                  <ListItem disableGutters sx={{ py: 0.6 }}>
                    <ListItemIcon sx={{ minWidth: 28, color: '#2563eb' }}>
                      <CheckCircleOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" color="#1e293b"><strong>Target Academic Year:</strong> Advance students to <strong>{nextYearName}</strong></Typography>} 
                    />
                  </ListItem>
                  <ListItem disableGutters sx={{ py: 0.6 }}>
                    <ListItemIcon sx={{ minWidth: 28, color: '#16a34a' }}>
                      <CheckCircleOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" color="#1e293b"><strong>Regular Promotion ({passedStudents.length} Students):</strong> Pass status &mdash; automatically advanced.</Typography>} 
                    />
                  </ListItem>
                  <ListItem disableGutters sx={{ py: 0.6 }}>
                    <ListItemIcon sx={{ minWidth: 28, color: '#0284c7' }}>
                      <CheckCircleOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" color="#1e293b"><strong>Conditional Cleared ({feePaidStudents.length + feeWaivedStudents.length} Students):</strong> Fee Paid or Waived in Accounts &mdash; promotion permitted.</Typography>} 
                    />
                  </ListItem>
                  {pendingFeeStudents.length > 0 && (
                    <ListItem disableGutters sx={{ py: 0.6 }}>
                      <ListItemIcon sx={{ minWidth: 28, color: '#dc2626' }}>
                        <LockIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography variant="body2" color="#dc2626"><strong>Strictly Retained / Blocked ({pendingFeeStudents.length} Students):</strong> Unsettled fee in Accounts &mdash; platform promotion permission strictly denied.</Typography>} 
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>

              {pendingFeeStudents.length > 0 ? (
                <Alert severity="warning" sx={{ fontSize: '0.85rem' }}>
                  <strong>Platform Promotion Gate Active:</strong> <strong>{totalEligibleCount}</strong> student(s) will be promoted to the next class. <strong>{pendingFeeStudents.length}</strong> student(s) will be <strong>strictly retained in {clsName}</strong> until their fee is completed or settled in Accounts.
                </Alert>
              ) : (
                <Alert severity="success" sx={{ fontSize: '0.85rem' }}>
                  All <strong>{totalEligibleCount}</strong> student(s) are cleared and will be successfully promoted to the next class!
                </Alert>
              )}
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
          justifyContent: 'space-between', 
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            {pendingMove && pendingFeeStudents.length > 0 && (
              <Button
                variant="outlined"
                color="warning"
                onClick={() => {
                  setModalOpen(false);
                  handleOpenBatchSettle();
                }}
                disabled={promoting}
                startIcon={<DoneAllIcon />}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              >
                Settle Unpaid First
              </Button>
            )}
            <Button 
              variant="contained" 
              color={pendingMove ? "success" : "primary"}
              onClick={executePromotion}
              disabled={promoting}
              startIcon={promoting ? <CircularProgress size={16} color="inherit" /> : (pendingMove ? <UpgradeIcon /> : <SaveIcon />)}
              sx={{ textTransform: 'none', fontWeight: 'bold', minWidth: 160 }}
            >
              {promoting ? "Processing..." : (pendingMove ? `Promote Cleared (${totalEligibleCount})` : "Save Results")}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
