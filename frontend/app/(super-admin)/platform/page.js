"use client";
import { useState, useEffect } from "react";
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Button, IconButton
} from "@mui/material";
import KPICard from "@/components/ui/KPICard";
import { RevenueChart, SubscriptionPieChart } from "@/components/ui/DashboardCharts";

import { api } from "@/lib/api";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/platform/stats/");
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Box sx={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const { kpis, charts, attention_center, recent_schools, recent_transactions, recent_activity } = data;

  const getSeverityIcon = (severity) => {
    if (severity === 'high') return <ErrorOutlineIcon color="error" fontSize="small" />;
    return <WarningAmberIcon color="warning" fontSize="small" />;
  };

  const getStatusColor = (status) => {
    const map = {
      "Active": "success",
      "Trial Active": "info",
      "Pending Verification": "warning",
      "Suspended": "error",
      "Cancelled": "error",
      "Trial Expired": "default",
      "Paid": "success",
      "Failed": "error",
    };
    return map[status] || "default";
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#0f172a' }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Command center for platform metrics and system health.
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}><KPICard title="Total Schools" value={kpis.total_schools.value} trend={kpis.total_schools.trend} trendValue={`${kpis.total_schools.pct}%`} period={kpis.total_schools.period} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard title="Active Schools" value={kpis.active_schools.value} trend={kpis.active_schools.trend} trendValue={`${kpis.active_schools.pct}%`} period={kpis.active_schools.period} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard title="Trial Schools" value={kpis.trial_schools.value} trend={kpis.trial_schools.trend} trendValue={`${kpis.trial_schools.pct}%`} period={kpis.trial_schools.period} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard title="Suspended Schools" value={kpis.suspended_schools.value} trend={kpis.suspended_schools.trend} trendValue={`${kpis.suspended_schools.pct}%`} period={kpis.suspended_schools.period} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard title="Total Students" value={kpis.total_students.value} trend={kpis.total_students.trend} trendValue={`${kpis.total_students.pct}%`} period={kpis.total_students.period} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard title="Total Teachers" value={kpis.total_teachers.value} trend={kpis.total_teachers.trend} trendValue={`${kpis.total_teachers.pct}%`} period={kpis.total_teachers.period} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard title="MRR" value={kpis.mrr.value} trend={kpis.mrr.trend} trendValue={`${kpis.mrr.pct}%`} period={kpis.mrr.period} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard title="Active Users" value={kpis.active_users.value} trend={kpis.active_users.trend} trendValue={`${kpis.active_users.pct}%`} period={kpis.active_users.period} /></Grid>
      </Grid>

      {/* Attention Center & Charts Placeholder */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Attention Center</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Issue</TableCell>
                    <TableCell>Tenant</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attention_center.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 10, color: "text.secondary" }}>
                        🎉 All clear! No issues require your attention right now.
                      </TableCell>
                    </TableRow>
                  )}

                  {attention_center.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getSeverityIcon(item.severity)} {item.issue}
                      </TableCell>
                      <TableCell>{item.tenant}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>
                        <Chip label={item.status} size="small" color={item.severity === 'high' ? 'error' : 'warning'} variant="outlined" />
                      </TableCell>
                      <TableCell><Button size="small" variant="outlined">Resolve</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Revenue Overview</Typography>
                <RevenueChart data={charts.revenue} />
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Subscription Dist.</Typography>
                <SubscriptionPieChart data={charts.subscription_distribution} />
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Tables Row 1: Recent Schools & Recent Transactions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Recent Schools</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>School</TableCell>
                    <TableCell>Students</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recent_schools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell>{school.name}</TableCell>
                      <TableCell>{school.student_count || 0}</TableCell>
                      <TableCell><Chip label={school.status_display} size="small" color={getStatusColor(school.status_display)} variant="outlined" /></TableCell>
                      <TableCell><Button size="small">View</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Recent Transactions</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>School</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recent_transactions.map((trx) => (
                    <TableRow key={trx.id}>
                      <TableCell>{trx.school}</TableCell>
                      <TableCell>{trx.amount}</TableCell>
                      <TableCell><Chip label={trx.status} size="small" color={getStatusColor(trx.status)} variant="outlined" /></TableCell>
                      <TableCell>{trx.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Recent Activity</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Activity</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell>Module</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Date/Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recent_activity.map((act) => (
                <TableRow key={act.id}>
                  <TableCell>{act.activity}</TableCell>
                  <TableCell>{act.user}</TableCell>
                  <TableCell>{act.tenant}</TableCell>
                  <TableCell>{act.module}</TableCell>
                  <TableCell>{act.ip}</TableCell>
                  <TableCell>{act.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
