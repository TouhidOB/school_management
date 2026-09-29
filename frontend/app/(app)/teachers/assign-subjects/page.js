"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
  Typography
} from "@mui/material";

export default function AssignSubjectsPage() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/teachers/?page_size=200"),
      api.get("/subjects/?page_size=500")
    ])
    .then(([tRes, sRes]) => {
      setTeachers(tRes.results);
      setSubjects(sRes.results);
      setLoading(false);
    })
    .catch(() => {
      setLoading(false);
    });
  }, []);

  const handleSubjectsChange = async (teacherId, newValue) => {
    setSavingId(teacherId);
    
    // Optimistic update
    const updatedTeachers = teachers.map(t => 
      t.id === teacherId ? { ...t, subjects: newValue.map(s => s.id) } : t
    );
    setTeachers(updatedTeachers);

    try {
      await api.patch(`/teachers/${teacherId}/`, { subjects: newValue.map(s => s.id) });
    } catch (err) {
      console.error("Failed to assign subjects", err);
      // Revert would ideally go here on failure
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Assign subjects to teachers across the school. Changes are saved automatically.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small" hover>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell width="25%">Teacher Name</TableCell>
                <TableCell width="20%">Designation</TableCell>
                <TableCell width="55%">Assigned Subjects</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No teachers found.
                  </TableCell>
                </TableRow>
              ) : (
                teachers.map((t) => {
                  const teacherSubjects = subjects.filter(s => (t.subjects || []).includes(s.id));
                  return (
                    <TableRow key={t.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {t.display_name}
                      </TableCell>
                      <TableCell>
                        {t.designation_name || "—"}
                      </TableCell>
                      <TableCell>
                        <Autocomplete
                          multiple
                          size="small"
                          options={subjects}
                          getOptionLabel={(option) => `${option.name} (${option.code}) ${option.school_class_name ? `- Class: ${option.school_class_name}` : ''}`}
                          value={teacherSubjects}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          onChange={(e, newValue) => handleSubjectsChange(t.id, newValue)}
                          disabled={savingId === t.id}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              variant="outlined" 
                              placeholder="Select subjects..." 
                            />
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                variant="outlined"
                                size="small"
                                label={`${option.name} ${option.school_class_name ? `(${option.school_class_name})` : ''}`}
                                {...getTagProps({ index })}
                                key={option.id}
                              />
                            ))
                          }
                          sx={{ width: '100%', minWidth: 300, bgcolor: 'background.paper' }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
