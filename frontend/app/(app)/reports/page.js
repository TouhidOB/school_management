"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Divider } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import WcIcon from "@mui/icons-material/Wc";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function StudentReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    boys: 0,
    girls: 0,
    other: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch students (up to a large reasonable limit for analytics)
      const res = await api.get("/students/?page_size=2000");
      const students = res.results || res;

      let active = 0;
      let boys = 0;
      let girls = 0;
      let other = 0;

      students.forEach(s => {
        if (s.status === "active") active++;
        if (s.gender === "male") boys++;
        else if (s.gender === "female") girls++;
        else other++;
      });

      setMetrics({
        total: students.length,
        active,
        boys,
        girls,
        other
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
        Student Demographics & Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'primary.50', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="primary.dark" fontWeight="medium">Total Enrolled</Typography>
              <Typography variant="h3" color="primary.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <GroupsIcon sx={{ mr: 1, fontSize: 36 }} /> {metrics.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'success.50', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="success.dark" fontWeight="medium">Active Students</Typography>
              <Typography variant="h3" color="success.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={{ mr: 1, fontSize: 36 }} /> {metrics.active}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0}% of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'info.50', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="info.dark" fontWeight="medium">Gender Distribution</Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Boys</Typography>
                  <Typography variant="body2" fontWeight="bold">{metrics.boys}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2">Girls</Typography>
                  <Typography variant="body2" fontWeight="bold">{metrics.girls}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
