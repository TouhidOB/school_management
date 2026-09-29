"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from "@mui/material";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TeacherTimetablePage() {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/teachers/?page_size=200").then((res) => {
      setTeachers(res.results || []);
    });
  }, []);

  useEffect(() => {
    if (!selectedTeacher) {
      setSlots([]);
      return;
    }
    setLoading(true);
    api.get(`/routine-slots/?teacher=${selectedTeacher}&page_size=500`).then((res) => {
      setSlots(res.results || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedTeacher]);

  // Group slots by day
  const groupedSlots = DAYS.map((day, idx) => ({
    day,
    slots: slots.filter(s => s.day_of_week === idx).sort((a, b) => a.period - b.period)
  }));

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            Select Teacher:
          </Typography>
          <FormControl sx={{ minWidth: 300 }} size="small">
            <InputLabel>Teacher</InputLabel>
            <Select
              value={selectedTeacher}
              label="Teacher"
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {teachers.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.display_name} {t.employee_id ? `(${t.employee_id})` : ''}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {selectedTeacher && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell width="15%"><strong>Day</strong></TableCell>
                  <TableCell><strong>Schedule</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 5 }}>Loading...</TableCell>
                  </TableRow>
                ) : groupedSlots.every(g => g.slots.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No classes scheduled for this teacher.
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedSlots.map((group) => {
                    if (group.slots.length === 0) return null;
                    return (
                      <TableRow key={group.day}>
                        <TableCell sx={{ verticalAlign: 'top', pt: 3 }}>
                          <Typography fontWeight="bold" color="primary">{group.day}</Typography>
                        </TableCell>
                        <TableCell sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {group.slots.map(slot => (
                              <Card 
                                key={slot.id} 
                                variant="outlined" 
                                sx={{ 
                                  p: 1.5, 
                                  minWidth: 160,
                                  borderColor: slot.is_break ? 'grey.300' : 'primary.light',
                                  bgcolor: slot.is_break ? 'grey.50' : '#fff'
                                }}
                              >
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                  {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)} (P{slot.period})
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {slot.is_break ? "Break" : slot.subject_name || "—"}
                                </Typography>
                                {!slot.is_break && (
                                  <Typography variant="caption" display="block" mt={0.5}>
                                    Section: {slot.section_name || "—"}
                                    {slot.room && ` • Room: ${slot.room}`}
                                  </Typography>
                                )}
                              </Card>
                            ))}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
