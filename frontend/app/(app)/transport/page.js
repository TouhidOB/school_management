"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Avatar } from "@mui/material";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import MapIcon from "@mui/icons-material/Map";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";

export default function TransportOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalVehicles: 0,
    totalCapacity: 0,
    totalRoutes: 0,
    totalAllocatedStudents: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vehiclesRes, routesRes, allocRes] = await Promise.all([
        api.get("/transport/vehicles/?page_size=500"),
        api.get("/transport/routes/?page_size=500"),
        api.get("/transport/allocations/?page_size=2000")
      ]);

      const vehicles = vehiclesRes.results || vehiclesRes;
      const routes = routesRes.results || routesRes;
      const alloc = allocRes.results || allocRes;

      let capacity = 0;
      vehicles.forEach(v => {
        capacity += (parseInt(v.capacity) || 0);
      });

      setMetrics({
        totalVehicles: vehicles.length,
        totalCapacity: capacity,
        totalRoutes: routes.length,
        totalAllocatedStudents: alloc.length
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
        Transport Fleet Status
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="body2" color="primary.dark" fontWeight="medium">Total Vehicles</Typography>
              <Typography variant="h4" color="primary.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <DirectionsBusIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.totalVehicles}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'success.50' }}>
            <CardContent>
              <Typography variant="body2" color="success.dark" fontWeight="medium">Fleet Capacity</Typography>
              <Typography variant="h4" color="success.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <EmojiPeopleIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.totalCapacity}
              </Typography>
              <Typography variant="caption" color="text.secondary">Total seats</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'warning.50' }}>
            <CardContent>
              <Typography variant="body2" color="warning.dark" fontWeight="medium">Active Routes</Typography>
              <Typography variant="h4" color="warning.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <MapIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.totalRoutes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'info.50' }}>
            <CardContent>
              <Typography variant="body2" color="info.dark" fontWeight="medium">Allocated Students</Typography>
              <Typography variant="h4" color="info.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <EmojiPeopleIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.totalAllocatedStudents}
              </Typography>
              <Typography variant="caption" color="text.secondary">Using transport</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
