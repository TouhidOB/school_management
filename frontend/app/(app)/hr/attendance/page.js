"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Box, Typography, Card, CardContent, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Switch, CircularProgress, Alert
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

export default function StaffAttendancePage() {
  const [teachers, setTeachers] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [tsRes, existingRes] = await Promise.all([
        api.get("/teachers/?status=active&page_size=500"),
        api.get(`/staff-attendance/?date=${date}&page_size=500`),
      ]);
      const ts = tsRes.results || tsRes;
      const existing = existingRes.results || existingRes;

      const by = {};
      existing.forEach((r) => (by[r.teacher] = r));
      
      const m = {};
      ts.forEach((t) => {
        const ex = by[t.id];
        m[t.id] = { 
          is_present: ex ? ex.is_present : true, 
          check_in: ex?.check_in || "", 
          check_out: ex?.check_out || "", 
          recordId: ex?.id || null 
        };
      });
      setTeachers(ts);
      setMarks(m);
    } catch(err) {
      console.error(err);
      setMsg("Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [date]);

  function upd(id, patch) {
    setMarks((m) => ({ ...m, [id]: { ...m[id], ...patch } }));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      for (const t of teachers) {
        const mk = marks[t.id];
        const body = {
          teacher: t.id, date, is_present: mk.is_present,
          check_in: mk.check_in || null, check_out: mk.check_out || null,
        };
        if (mk.recordId) await api.patch(`/staff-attendance/${mk.recordId}/`, body);
        else await api.post("/staff-attendance/", body);
      }
      setMsg("Saved ✓");
      load();
    } catch(err) {
      setMsg("Error saving attendance.");
    } finally {
      setSaving(false);
    }
  }

  const presentCount = Object.values(marks).filter((m) => m.is_present).length;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Daily Staff Attendance
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Mark active staff present/absent and log check-in/out times.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
          <TextField
            label="Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            {presentCount} / {teachers.length} present
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />} 
            onClick={save} 
            disabled={loading || saving}
          >
            {saving ? "Saving..." : "Save Records"}
          </Button>
        </CardContent>
      </Card>

      {msg && <Alert severity={msg.includes("Error") || msg.includes("Failed") ? "error" : "success"} sx={{ mb: 2 }}>{msg}</Alert>}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell><strong>Staff Name</strong></TableCell>
                <TableCell><strong>Designation</strong></TableCell>
                <TableCell><strong>Present</strong></TableCell>
                <TableCell><strong>Check-in</strong></TableCell>
                <TableCell><strong>Check-out</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell>
                </TableRow>
              ) : teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No active staff found.</TableCell>
                </TableRow>
              ) : (
                teachers.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>{t.display_name}</TableCell>
                    <TableCell>{t.designation_name || "—"}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={!!marks[t.id]?.is_present} 
                        onChange={(e) => upd(t.id, { is_present: e.target.checked })} 
                        color="success"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField 
                        type="time" size="small" 
                        value={marks[t.id]?.check_in || ""} 
                        onChange={(e) => upd(t.id, { check_in: e.target.value })} 
                      />
                    </TableCell>
                    <TableCell>
                      <TextField 
                        type="time" size="small" 
                        value={marks[t.id]?.check_out || ""} 
                        onChange={(e) => upd(t.id, { check_out: e.target.value })} 
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
