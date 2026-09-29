"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Box, Card, CardContent, Typography, Grid, Alert, List, ListItem, ListItemText, ListItemIcon, Chip, Divider } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

export default function ConflictsPage() {
  const [data, setData] = useState({ teacher_conflicts: [], room_conflicts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/routine-slots/conflicts/").then((res) => {
      setData(res);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const hasConflicts = data.teacher_conflicts.length > 0 || data.room_conflicts.length > 0;

  if (loading) {
    return <Typography sx={{ py: 4, textAlign: 'center' }}>Loading conflict report...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        {!hasConflicts ? (
          <Alert icon={<CheckCircleOutlineIcon fontSize="inherit" />} severity="success">
            Great news! No scheduling conflicts were found in the timetable.
          </Alert>
        ) : (
          <Alert icon={<ErrorOutlineIcon fontSize="inherit" />} severity="error">
            Scheduling conflicts detected! Review the issues below and adjust the routine slots to resolve them.
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Teacher Conflicts */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'error.50' }}>
              <Typography variant="h6" color="error.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Teacher Double-Bookings <Chip size="small" color="error" label={data.teacher_conflicts.length} />
              </Typography>
              <Typography variant="caption" color="error.main">
                Teachers assigned to multiple classes simultaneously.
              </Typography>
            </Box>
            
            <List disablePadding>
              {data.teacher_conflicts.length === 0 ? (
                <ListItem sx={{ py: 4, justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No teacher conflicts.</Typography>
                </ListItem>
              ) : (
                data.teacher_conflicts.map((c, i) => (
                  <Box key={i}>
                    <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                      <ListItemIcon sx={{ minWidth: 40, pt: 0.5 }}>
                        <ErrorOutlineIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography fontWeight="bold">
                            {c.teacher_name} - {c.day_display}, Period {c.period}
                          </Typography>
                        }
                        secondary={
                          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                            {c.details.map((d, j) => (
                              <li key={j}><Typography variant="body2" color="text.secondary">{d}</Typography></li>
                            ))}
                          </Box>
                        }
                      />
                    </ListItem>
                    {i < data.teacher_conflicts.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </List>
          </Card>
        </Grid>

        {/* Room Conflicts */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'warning.50' }}>
              <Typography variant="h6" color="warning.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Room Double-Bookings <Chip size="small" color="warning" label={data.room_conflicts.length} />
              </Typography>
              <Typography variant="caption" color="warning.main">
                Rooms booked for multiple classes simultaneously.
              </Typography>
            </Box>
            
            <List disablePadding>
              {data.room_conflicts.length === 0 ? (
                <ListItem sx={{ py: 4, justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No room conflicts.</Typography>
                </ListItem>
              ) : (
                data.room_conflicts.map((c, i) => (
                  <Box key={i}>
                    <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                      <ListItemIcon sx={{ minWidth: 40, pt: 0.5 }}>
                        <ErrorOutlineIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography fontWeight="bold">
                            Room: {c.room} - {c.day_display}, Period {c.period}
                          </Typography>
                        }
                        secondary={
                          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                            {c.details.map((d, j) => (
                              <li key={j}><Typography variant="body2" color="text.secondary">{d}</Typography></li>
                            ))}
                          </Box>
                        }
                      />
                    </ListItem>
                    {i < data.room_conflicts.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
