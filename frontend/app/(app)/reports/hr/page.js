"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Box, Card, CardContent, Typography, Grid, CircularProgress } from "@mui/material";
import BadgeIcon from "@mui/icons-material/Badge";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import WorkIcon from "@mui/icons-material/Work";

export default function HRReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalTeachers: 0,
    activeTeachers: 0,
    pendingLeaves: 0,
    approvedLeaves: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teachersRes, leavesRes] = await Promise.all([
        api.get("/teachers/?page_size=500"),
        api.get("/staff-leaves/?page_size=500")
      ]);

      const teachers = teachersRes.results || teachersRes;
      const leaves = leavesRes.results || leavesRes;

      let activeTeachers = 0;
      teachers.forEach(t => {
        if (t.status === "active" || t.is_active !== false) {
          activeTeachers++;
        }
      });

      let pendingLeaves = 0;
      let approvedLeaves = 0;
      leaves.forEach(l => {
        if (l.status === "pending") pendingLeaves++;
        if (l.status === "approved") approvedLeaves++;
      });

      setMetrics({
        totalTeachers: teachers.length,
        activeTeachers,
        pendingLeaves,
        approvedLeaves
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
        Human Resources Overview
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'primary.50', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="primary.dark" fontWeight="medium">Total Staff / Teachers</Typography>
              <Typography variant="h3" color="primary.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <BadgeIcon sx={{ mr: 1, fontSize: 36 }} /> {metrics.totalTeachers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'warning.50', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="warning.dark" fontWeight="medium">Pending Leave Requests</Typography>
              <Typography variant="h3" color="warning.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <EventBusyIcon sx={{ mr: 1, fontSize: 36 }} /> {metrics.pendingLeaves}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'success.50', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="success.dark" fontWeight="medium">Approved Leaves</Typography>
              <Typography variant="h3" color="success.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <WorkIcon sx={{ mr: 1, fontSize: 36 }} /> {metrics.approvedLeaves}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
