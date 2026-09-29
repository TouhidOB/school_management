"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Chip } from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import CelebrationIcon from "@mui/icons-material/Celebration";
import GroupsIcon from "@mui/icons-material/Groups";
import MenuBookIcon from "@mui/icons-material/MenuBook";

export default function EventsCalendarPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get("/academics/events/?page_size=50");
      setEvents(res.results || res);
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

  const getIcon = (type) => {
    switch (type) {
      case "holiday": return <CelebrationIcon color="secondary" />;
      case "meeting": return <GroupsIcon color="info" />;
      case "exam": return <MenuBookIcon color="error" />;
      default: return <EventIcon color="primary" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case "holiday": return "secondary";
      case "meeting": return "info";
      case "exam": return "error";
      default: return "primary";
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
        Upcoming Schedule
      </Typography>

      {events.length === 0 ? (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              No events scheduled yet. Switch to the List tab to add some.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {events.map((ev) => (
            <Grid item xs={12} sm={6} md={4} key={ev.id}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getIcon(ev.event_type)}
                      <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                        {ev.title}
                      </Typography>
                    </Box>
                    <Chip 
                      label={ev.event_type?.toUpperCase()} 
                      size="small" 
                      color={getColor(ev.event_type)} 
                      variant="outlined" 
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {ev.description || "No description provided."}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      START: {new Date(ev.start_date).toLocaleDateString()}
                    </Typography>
                    {ev.end_date && (
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        END: {new Date(ev.end_date).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
