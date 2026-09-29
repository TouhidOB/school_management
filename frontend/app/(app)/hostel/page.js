"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Box, Card, CardContent, Typography, Grid, CircularProgress } from "@mui/material";
import ApartmentIcon from "@mui/icons-material/Apartment";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import HotelIcon from "@mui/icons-material/Hotel";
import PersonIcon from "@mui/icons-material/Person";

export default function HostelOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalHostels: 0,
    totalRooms: 0,
    totalCapacity: 0,
    totalAllocated: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [hostelsRes, roomsRes, allocRes] = await Promise.all([
        api.get("/hostel/hostels/?page_size=500"),
        api.get("/hostel/rooms/?page_size=500"),
        api.get("/hostel/allocations/?page_size=2000")
      ]);

      const hostels = hostelsRes.results || hostelsRes;
      const rooms = roomsRes.results || roomsRes;
      const alloc = allocRes.results || allocRes;

      let capacity = 0;
      rooms.forEach(r => {
        capacity += (parseInt(r.capacity) || 0);
      });

      setMetrics({
        totalHostels: hostels.length,
        totalRooms: rooms.length,
        totalCapacity: capacity,
        totalAllocated: alloc.length
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
        Hostel Occupancy & Status
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="body2" color="primary.dark" fontWeight="medium">Total Hostels</Typography>
              <Typography variant="h4" color="primary.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <ApartmentIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.totalHostels}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'secondary.50' }}>
            <CardContent>
              <Typography variant="body2" color="secondary.dark" fontWeight="medium">Total Rooms</Typography>
              <Typography variant="h4" color="secondary.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <MeetingRoomIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.totalRooms}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'success.50' }}>
            <CardContent>
              <Typography variant="body2" color="success.dark" fontWeight="medium">Bed Capacity</Typography>
              <Typography variant="h4" color="success.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <HotelIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.totalCapacity}
              </Typography>
              <Typography variant="caption" color="text.secondary">Total physical beds</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'warning.50' }}>
            <CardContent>
              <Typography variant="body2" color="warning.dark" fontWeight="medium">Occupied Beds</Typography>
              <Typography variant="h4" color="warning.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.totalAllocated}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {metrics.totalCapacity > 0 ? Math.round((metrics.totalAllocated / metrics.totalCapacity) * 100) : 0}% Occupancy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
