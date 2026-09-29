"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, CircularProgress, Alert
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import AssessmentIcon from "@mui/icons-material/Assessment";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

export default function FinanceReportsPage() {
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0]
  );

  const [metrics, setMetrics] = useState({ income: 0, expenses: 0, net: 0, totalDue: 0 });
  const [trendData, setTrendData] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setErrorMsg("Please select both start and end dates.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg("Start date cannot be after end date.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setHasGenerated(true);

    try {
      // In a real app, backend filters should be used. Using client filtering for this POC scale.
      const [invRes, expRes] = await Promise.all([
        api.get("/invoices/?page_size=5000"),
        api.get("/expenses/?page_size=5000")
      ]);

      const allInvoices = invRes.results || invRes;
      const allExpenses = expRes.results || expRes;

      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      // set to end of day for exact boundaries
      eDate.setHours(23, 59, 59, 999);

      let totalIncome = 0;
      let totalExpenses = 0;
      let totalOutstanding = 0;

      const dailyMap = {};
      const categoryMap = {};

      // Process Invoices & Payments
      allInvoices.forEach(inv => {
        let paidAmount = 0;
        
        // Track payments
        if (inv.payments && inv.payments.length > 0) {
          inv.payments.forEach(p => {
            const pDate = new Date(p.paid_at);
            if (pDate >= sDate && pDate <= eDate) {
              const amt = parseFloat(p.amount_paid) || 0;
              totalIncome += amt;
              paidAmount += amt;

              const dateStr = pDate.toISOString().split("T")[0];
              if (!dailyMap[dateStr]) dailyMap[dateStr] = { date: dateStr, income: 0, expense: 0 };
              dailyMap[dateStr].income += amt;
            } else {
              // Paid outside period, but counts toward invoice completion
              paidAmount += parseFloat(p.amount_paid) || 0;
            }
          });
        }

        // Calculate total outstanding for the school overall regardless of date range?
        // Usually, reports show outstanding generated within this date range.
        const iDate = new Date(inv.invoice_date);
        if (iDate >= sDate && iDate <= eDate && inv.status !== "cancelled") {
          const grandTotal = parseFloat(inv.grand_total) || 0;
          const due = grandTotal - paidAmount;
          if (due > 0) totalOutstanding += due;
        }
      });

      // Process Expenses
      allExpenses.forEach(exp => {
        const eD = new Date(exp.expense_date);
        if (eD >= sDate && eD <= eDate) {
          const amt = parseFloat(exp.amount) || 0;
          totalExpenses += amt;

          const dateStr = exp.expense_date; // already YYYY-MM-DD
          if (!dailyMap[dateStr]) dailyMap[dateStr] = { date: dateStr, income: 0, expense: 0 };
          dailyMap[dateStr].expense += amt;

          const cat = exp.category_name || "Uncategorized";
          categoryMap[cat] = (categoryMap[cat] || 0) + amt;
        }
      });

      setMetrics({
        income: totalIncome,
        expenses: totalExpenses,
        net: totalIncome - totalExpenses,
        totalDue: totalOutstanding
      });

      // Sort trend data by date
      const tData = Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
      setTrendData(tData);

      // Pie chart data
      const cData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
      setExpenseCategories(cData);

    } catch (err) {
      console.error(err);
      setErrorMsg("Error: " + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return '৳' + parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300'];

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
            Financial Report Parameters:
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth size="small" label="Start Date" type="date"
                InputLabelProps={{ shrink: true }}
                value={startDate} onChange={(e) => setStartDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth size="small" label="End Date" type="date"
                InputLabelProps={{ shrink: true }}
                value={endDate} onChange={(e) => setEndDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                fullWidth variant="contained" startIcon={<AssessmentIcon />}
                onClick={generateReport} disabled={loading}
              >
                Generate Report
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : hasGenerated && !errorMsg ? (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'success.50' }}>
                <CardContent>
                  <Typography variant="body2" color="success.dark" fontWeight="medium">Total Income (Collections)</Typography>
                  <Typography variant="h5" color="success.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <MonetizationOnIcon sx={{ mr: 1 }} /> {formatMoney(metrics.income)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'error.50' }}>
                <CardContent>
                  <Typography variant="body2" color="error.dark" fontWeight="medium">Total Expenses</Typography>
                  <Typography variant="h5" color="error.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <MoneyOffIcon sx={{ mr: 1 }} /> {formatMoney(metrics.expenses)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'primary.50' }}>
                <CardContent>
                  <Typography variant="body2" color="primary.dark" fontWeight="medium">Net Balance</Typography>
                  <Typography variant="h5" color="primary.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <AccountBalanceIcon sx={{ mr: 1 }} /> {formatMoney(metrics.net)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'warning.50' }}>
                <CardContent>
                  <Typography variant="body2" color="warning.dark" fontWeight="medium">Outstanding (From this period)</Typography>
                  <Typography variant="h5" color="warning.main" fontWeight="bold" sx={{ mt: 1 }}>
                    {formatMoney(metrics.totalDue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                    Cash Flow Trend (Income vs Expense)
                  </Typography>
                  {trendData.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ py: 10 }}>No transactions in this period.</Typography>
                  ) : (
                    <Box sx={{ height: 350, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={false} />
                          <YAxis tickFormatter={(val) => `৳${val}`} tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={false} />
                          <RechartsTooltip formatter={(val) => [`৳${val}`, undefined]} cursor={{fill: '#f3f4f6'}} />
                          <Legend />
                          <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                    Expense Distribution
                  </Typography>
                  {expenseCategories.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ py: 10 }}>No expenses in this period.</Typography>
                  ) : (
                    <Box sx={{ height: 350, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={expenseCategories}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={80}
                            paddingAngle={5} dataKey="value"
                          >
                            {expenseCategories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(val) => `৳${val}`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{ width: '100%', mt: 2 }}>
                        {expenseCategories.map((cat, i) => (
                          <Box key={cat.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length], mr: 1 }} />
                              {cat.name}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">{formatMoney(cat.value)}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ) : null}
    </Box>
  );
}
