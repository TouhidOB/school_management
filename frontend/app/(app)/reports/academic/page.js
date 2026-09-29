"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Box, Card, CardContent, Typography, Grid, CircularProgress } from "@mui/material";
import ClassIcon from "@mui/icons-material/Class";
import SubjectIcon from "@mui/icons-material/Subject";
import ViewModuleIcon from "@mui/icons-material/ViewModule";

export default function AcademicReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    classes: 0,
    sections: 0,
    subjects: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clsRes, secRes, subRes] = await Promise.all([
        api.get("/academics/classes/?page_size=500"),
        api.get("/academics/sections/?page_size=500"),
        api.get("/academics/subjects/?page_size=1000")
      ]);

      setMetrics({
        classes: clsRes.results ? clsRes.results.length : clsRes.length,
        sections: secRes.results ? secRes.results.length : secRes.length,
        subjects: subRes.results ? subRes.results.length : subRes.length
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
        Academic Overview
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'warning.50', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="warning.dark" fontWeight="medium">Total Classes</Typography>
              <Typography variant="h3" color="warning.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <ClassIcon sx={{ mr: 1, fontSize: 36 }} /> {metrics.classes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'secondary.50', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="secondary.dark" fontWeight="medium">Total Sections</Typography>
              <Typography variant="h3" color="secondary.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <ViewModuleIcon sx={{ mr: 1, fontSize: 36 }} /> {metrics.sections}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'info.50', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="info.dark" fontWeight="medium">Subjects Taught</Typography>
              <Typography variant="h3" color="info.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <SubjectIcon sx={{ mr: 1, fontSize: 36 }} /> {metrics.subjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
