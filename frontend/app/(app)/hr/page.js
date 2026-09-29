"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, Grid, CircularProgress, Divider, Avatar
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function HROverviewPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalStaff: 0,
    activeStaff: 0,
    presentToday: 0,
    absentToday: 0,
    totalMonthlyPayroll: 0,
  });
  const [designationData, setDesignationData] = useState([]);
  const [recentHires, setRecentHires] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const [staffRes, attRes, desigRes] = await Promise.all([
        api.get("/teachers/?page_size=1000"),
        api.get(`/staff-attendance/?date=${today}&page_size=1000`),
        api.get("/designations/?page_size=100")
      ]);

      const staff = staffRes.results || staffRes;
      const attendance = attRes.results || attRes;
      const designations = desigRes.results || desigRes;

      let active = 0;
      let totalPayroll = 0;
      const desigCounts = {};

      staff.forEach(s => {
        if (s.status === "active") {
          active++;
          totalPayroll += parseFloat(s.salary_basic) || 0;
        }

        // Map designation ID to name
        const dName = designations.find(d => d.id === s.designation)?.name || "Unassigned";
        desigCounts[dName] = (desigCounts[dName] || 0) + 1;
      });

      let present = 0;
      let absent = 0;
      attendance.forEach(a => {
        if (a.is_present) present++;
        else absent++;
      });
      
      // For staff without attendance records today, assume absent or pending? 
      // Typically, attendance is marked positive. We'll just show what's recorded.
      const unrecorded = active - (present + absent);
      // We can add unrecorded to absent if strict, but let's just show explicit absent + unrecorded as missing
      const actualAbsent = absent + (unrecorded > 0 ? unrecorded : 0);

      setMetrics({
        totalStaff: staff.length,
        activeStaff: active,
        presentToday: present,
        absentToday: actualAbsent,
        totalMonthlyPayroll: totalPayroll
      });

      const dData = Object.entries(desigCounts).map(([name, value]) => ({ name, value }));
      setDesignationData(dData);

      // Grab the last 5 staff added (assuming larger ID = newer, or just slice end)
      const sortedStaff = [...staff].sort((a, b) => b.id - a.id).slice(0, 5);
      setRecentHires(sortedStaff);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return '৳' + parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="body2" color="primary.dark" fontWeight="medium">Total Active Staff</Typography>
              <Typography variant="h4" color="primary.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.activeStaff}
              </Typography>
              <Typography variant="caption" color="text.secondary">{metrics.totalStaff} total registered</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'success.50' }}>
            <CardContent>
              <Typography variant="body2" color="success.dark" fontWeight="medium">Present Today</Typography>
              <Typography variant="h4" color="success.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <AssignmentTurnedInIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.presentToday}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {metrics.activeStaff > 0 ? Math.round((metrics.presentToday / metrics.activeStaff) * 100) : 0}% Attendance Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'error.50' }}>
            <CardContent>
              <Typography variant="body2" color="error.dark" fontWeight="medium">Absent Today</Typography>
              <Typography variant="h4" color="error.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <EventBusyIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.absentToday}
              </Typography>
              <Typography variant="caption" color="text.secondary">Includes unrecorded staff</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'warning.50' }}>
            <CardContent>
              <Typography variant="body2" color="warning.dark" fontWeight="medium">Est. Monthly Payroll</Typography>
              <Typography variant="h4" color="warning.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <MonetizationOnIcon sx={{ mr: 1, fontSize: 32 }} /> {formatMoney(metrics.totalMonthlyPayroll)}
              </Typography>
              <Typography variant="caption" color="text.secondary">Based on basic salary</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Staff Distribution by Designation
              </Typography>
              {designationData.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 5 }}>No designations found.</Typography>
              ) : (
                <Box sx={{ height: 350, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={designationData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" width={120} tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                      <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
                      <Bar dataKey="value" name="Staff Count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
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
                Recently Added Staff
              </Typography>
              {recentHires.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 5 }}>No staff records found.</Typography>
              ) : (
                <Box>
                  {recentHires.map((staff, idx) => (
                    <Box key={staff.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', mr: 2 }}>
                          {staff.full_name ? staff.full_name.charAt(0).toUpperCase() : 'S'}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight="bold">{staff.full_name || "Unnamed Staff"}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {staff.employee_id ? `ID: ${staff.employee_id}` : 'No ID'} • {staff.status}
                          </Typography>
                        </Box>
                      </Box>
                      {idx < recentHires.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
