"use client";

import { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Grid, CircularProgress } from "@mui/material";
import SchoolIcon from '@mui/icons-material/School';
import LayersIcon from '@mui/icons-material/Layers';
import BookIcon from '@mui/icons-material/Book';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { api } from "@/lib/api";
import Link from "next/link";

export default function OverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/classes/"),
      api.get("/sections/"),
      api.get("/subjects/"),
      api.get("/academic-years/")
    ]).then(([classes, sections, subjects, years]) => {
      setStats({
        classes: classes.count || 0,
        sections: sections.count || 0,
        subjects: subjects.count || 0,
        years: years.count || 0,
        currentYear: (years.results || []).find(y => y.is_current)?.name || "Not Set"
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Box p={4} textAlign="center"><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Overview Metrics</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50', color: 'primary.main', display: 'flex' }}>
                  <SchoolIcon />
                </Box>
                <Box>
                  <Typography color="text.secondary" variant="body2" fontWeight="medium">Total Classes</Typography>
                  <Typography variant="h5" fontWeight="bold">{stats?.classes}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'secondary.50', color: 'secondary.main', display: 'flex' }}>
                  <LayersIcon />
                </Box>
                <Box>
                  <Typography color="text.secondary" variant="body2" fontWeight="medium">Total Sections</Typography>
                  <Typography variant="h5" fontWeight="bold">{stats?.sections}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.50', color: 'success.main', display: 'flex' }}>
                  <BookIcon />
                </Box>
                <Box>
                  <Typography color="text.secondary" variant="body2" fontWeight="medium">Total Subjects</Typography>
                  <Typography variant="h5" fontWeight="bold">{stats?.subjects}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.50', color: 'warning.main', display: 'flex' }}>
                  <DateRangeIcon />
                </Box>
                <Box>
                  <Typography color="text.secondary" variant="body2" fontWeight="medium">Active Academic Year</Typography>
                  <Typography variant="h6" fontWeight="bold">{stats?.currentYear}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
