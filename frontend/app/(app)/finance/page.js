"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Box, Grid, Card, CardContent, Typography, List, ListItem, ListItemText, ListItemIcon, 
  Button, CircularProgress, Chip, Stack, Divider, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Alert, Tooltip
} from "@mui/material";
import PaidIcon from '@mui/icons-material/Paid';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TuneIcon from '@mui/icons-material/Tune';
import RefreshIcon from '@mui/icons-material/Refresh';
import Link from 'next/link';

export default function FinanceOverview() {
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Adjust balance modal
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustBalance, setAdjustBalance] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const loadWalletSummary = async () => {
    setLoading(true);
    try {
      const data = await api.get("/school-wallet/summary/");
      setWalletData(data);
      if (data) {
        setAdjustBalance(data.initial_balance?.toString() || "0");
      }
    } catch (err) {
      console.error("Failed to load wallet summary", err);
      setErrorMsg("Failed to load central school wallet data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletSummary();
  }, []);

  const handleAdjustBalance = async () => {
    setAdjusting(true);
    try {
      await api.post("/school-wallet/adjust/", {
        initial_balance: parseFloat(adjustBalance) || 0,
        notes: adjustNotes
      });
      setAdjustOpen(false);
      loadWalletSummary();
    } catch (err) {
      alert("Failed to update wallet initial balance.");
    } finally {
      setAdjusting(false);
    }
  };

  const formatMoney = (amount) => {
    return '৳' + parseFloat(amount || 0).toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  if (loading && !walletData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  const currentBalance = walletData?.current_balance || 0;
  const totalCollected = walletData?.total_collected || 0;
  const totalSalaries = walletData?.total_salaries || 0;
  const totalExpenses = walletData?.total_expenses || 0;
  const totalOutflow = walletData?.total_outflow || 0;
  const initialBalance = walletData?.initial_balance || 0;
  const salaryBreakdown = walletData?.salary_breakdown || { teachers: 0, staff: 0, daily_wage: 0 };
  const recentTransactions = walletData?.recent_transactions || [];

  return (
    <Box>
      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      {/* Main Central School Wallet Master Banner */}
      <Card 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3, 
          background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)", 
          color: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.3)"
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex" }}>
                <AccountBalanceWalletIcon sx={{ color: "#ffffff", fontSize: 28 }} />
              </Box>
              <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 700, opacity: 0.9 }}>
                SCHOOL CENTRAL TREASURY WALLET
              </Typography>
            </Stack>

            <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: -1, mb: 1 }}>
              {formatMoney(currentBalance)}
            </Typography>

            <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 520 }}>
              Live real-time treasury balance: Automatically credited by student fee collections and debited by staff/teacher salaries and daily operational expenses.
            </Typography>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1.5} justifyContent={{ xs: "flex-start", md: "flex-end" }} flexWrap="wrap" gap={1}>
              <Button 
                variant="contained" 
                size="small"
                onClick={() => setAdjustOpen(true)}
                startIcon={<TuneIcon />}
                sx={{ 
                  bgcolor: "rgba(255, 255, 255, 0.2)", 
                  color: "#ffffff", 
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
                  textTransform: "none",
                  fontWeight: 600,
                  backdropFilter: "blur(8px)"
                }}
              >
                Opening Balance
              </Button>

              <Button 
                variant="contained" 
                size="small"
                onClick={loadWalletSummary}
                startIcon={<RefreshIcon />}
                sx={{ 
                  bgcolor: "rgba(255, 255, 255, 0.2)", 
                  color: "#ffffff", 
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
                  textTransform: "none",
                  fontWeight: 600,
                  backdropFilter: "blur(8px)"
                }}
              >
                Refresh
              </Button>

              <Button 
                component={Link}
                href="/finance/collection"
                variant="contained" 
                size="small"
                startIcon={<PaidIcon />}
                sx={{ 
                  bgcolor: "#ffffff", 
                  color: "#1e3a8a", 
                  "&:hover": { bgcolor: "#f8fafc" },
                  textTransform: "none",
                  fontWeight: 700
                }}
              >
                Collect Dues
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* 4 Core Financial KPI Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Collections (Inflow) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, bgcolor: "#ffffff", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Student Collections (+)
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#dcfce7", color: "#16a34a", display: "flex" }}>
                  <ArrowUpwardIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#15803d" }}>
                {formatMoney(totalCollected)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Credited directly to Central Wallet
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Teacher & Staff Salaries (Outflow) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, bgcolor: "#ffffff", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Salaries Disbursed (-)
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#fee2e2", color: "#dc2626", display: "flex" }}>
                  <PeopleAltIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#dc2626" }}>
                {formatMoney(totalSalaries)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Monthly, annual & daily wage payouts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Expenses (Outflow) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, bgcolor: "#ffffff", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Daily Expenses (-)
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#ffedd5", color: "#ea580c", display: "flex" }}>
                  <TrendingDownIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#ea580c" }}>
                {formatMoney(totalExpenses)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Operational & utility expenditures
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Outflow & Reserve */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, bgcolor: "#ffffff", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Total Outflow Sum
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#f1f5f9", color: "#475569", display: "flex" }}>
                  <ArrowDownwardIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a" }}>
                {formatMoney(totalOutflow)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Salaries + Expenses combined
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Outflow Breakdown & Recent Wallet Transactions */}
      <Grid container spacing={3}>
        {/* Left: Outflow Breakdown */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, bgcolor: "#ffffff", mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#0f172a", mb: 2 }}>
                Payroll & Outflow Distribution
              </Typography>

              <Stack spacing={2.5}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Teachers Monthly/Annual</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatMoney(salaryBreakdown.teachers)}</Typography>
                  </Box>
                  <Box sx={{ width: "100%", bgcolor: "#f1f5f9", height: 8, borderRadius: 4, overflow: "hidden" }}>
                    <Box sx={{ 
                      width: totalOutflow > 0 ? `${Math.min(100, (salaryBreakdown.teachers / totalOutflow) * 100)}%` : "0%", 
                      bgcolor: "#3b82f6", 
                      height: "100%" 
                    }} />
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">General & Admin Staff</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatMoney(salaryBreakdown.staff)}</Typography>
                  </Box>
                  <Box sx={{ width: "100%", bgcolor: "#f1f5f9", height: 8, borderRadius: 4, overflow: "hidden" }}>
                    <Box sx={{ 
                      width: totalOutflow > 0 ? `${Math.min(100, (salaryBreakdown.staff / totalOutflow) * 100)}%` : "0%", 
                      bgcolor: "#8b5cf6", 
                      height: "100%" 
                    }} />
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Daily Wage Staff / Workers</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatMoney(salaryBreakdown.daily_wage)}</Typography>
                  </Box>
                  <Box sx={{ width: "100%", bgcolor: "#f1f5f9", height: 8, borderRadius: 4, overflow: "hidden" }}>
                    <Box sx={{ 
                      width: totalOutflow > 0 ? `${Math.min(100, (salaryBreakdown.daily_wage / totalOutflow) * 100)}%` : "0%", 
                      bgcolor: "#f59e0b", 
                      height: "100%" 
                    }} />
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">School Daily Expenses</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatMoney(totalExpenses)}</Typography>
                  </Box>
                  <Box sx={{ width: "100%", bgcolor: "#f1f5f9", height: 8, borderRadius: 4, overflow: "hidden" }}>
                    <Box sx={{ 
                      width: totalOutflow > 0 ? `${Math.min(100, (totalExpenses / totalOutflow) * 100)}%` : "0%", 
                      bgcolor: "#ef4444", 
                      height: "100%" 
                    }} />
                  </Box>
                </Box>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={1.5}>
                <Button 
                  component={Link} 
                  href="/finance/salaries" 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<PeopleAltIcon />}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Manage Salaries & Payroll
                </Button>
                <Button 
                  component={Link} 
                  href="/finance/expenses" 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<TrendingDownIcon />}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Manage Daily Expenses
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Unified Central Wallet Transaction Ledger */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, bgcolor: "#ffffff" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#0f172a" }}>
                  Recent Central Wallet Activity
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Live Credit (+) & Debit (-) Feed
                </Typography>
              </Box>

              {recentTransactions.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                  <AccountBalanceWalletIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 1 }} />
                  <Typography variant="body2">No wallet transactions recorded yet.</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {recentTransactions.map((txn, index) => {
                    const isCredit = txn.type === "credit";
                    return (
                      <Box key={txn.id || index}>
                        <ListItem 
                          sx={{ 
                            px: 1, 
                            py: 1.5,
                            borderRadius: 1.5,
                            "&:hover": { bgcolor: "#f8fafc" }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 44 }}>
                            <Box 
                              sx={{ 
                                p: 0.8, 
                                borderRadius: 1.5, 
                                bgcolor: isCredit ? "#dcfce7" : "#fee2e2", 
                                color: isCredit ? "#16a34a" : "#dc2626",
                                display: "flex"
                              }}
                            >
                              {isCredit ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ color: "#1e293b" }}>
                                  {txn.title}
                                </Typography>
                                <Chip 
                                  label={txn.source} 
                                  size="small" 
                                  sx={{ 
                                    fontSize: "0.65rem", 
                                    height: 18, 
                                    fontWeight: 700, 
                                    bgcolor: isCredit ? "#f0fdf4" : "#fef2f2",
                                    color: isCredit ? "#16a34a" : "#dc2626"
                                  }} 
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {txn.subtitle} · {formatDate(txn.date)} · Method: {txn.method} {txn.reference !== "—" && `· Ref: ${txn.reference}`}
                              </Typography>
                            }
                          />
                          <Typography 
                            variant="body2" 
                            fontWeight="bold" 
                            sx={{ 
                              color: isCredit ? "#16a34a" : "#dc2626",
                              fontFamily: "monospace",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {isCredit ? `+${formatMoney(txn.amount)}` : `-${formatMoney(txn.amount)}`}
                          </Typography>
                        </ListItem>
                        {index < recentTransactions.length - 1 && <Divider component="li" />}
                      </Box>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Adjust Initial Balance Dialog */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>Adjust Opening Treasury Balance</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set the school wallet initial opening balance or capital reserve.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Opening Balance (BDT ৳)"
            type="number"
            value={adjustBalance}
            onChange={(e) => setAdjustBalance(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            size="small"
            label="Adjustment Note / Reason"
            placeholder="e.g. Session 2026 Opening Reserve"
            value={adjustNotes}
            onChange={(e) => setAdjustNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAdjustOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleAdjustBalance} 
            variant="contained" 
            disabled={adjusting}
          >
            {adjusting ? "Saving..." : "Save Balance"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
