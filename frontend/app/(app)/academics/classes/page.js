"use client";

// Classes are simple (name + level) so the list and the add/edit form live on
// one page — inline CRUD, no separate route.
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Tooltip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function ClassesPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: "", numeric_level: 0 });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.get("/classes/?page_size=200").then((d) => setRows(d.results)).catch(() => {});
  }
  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editId) await api.patch(`/classes/${editId}/`, form);
      else await api.post("/classes/", form);
      setForm({ name: "", numeric_level: 0 });
      setEditId(null);
      load();
    } catch (err) {
      if (err.data && typeof err.data === "object") {
        setError(Object.entries(err.data).map(([k, v]) => `${k}: ${v}`).join(" · "));
      } else {
        setError(err.message);
      }
    }
  }

  async function remove(id, name) {
    if (!confirm(`Delete class "${name}"?`)) return;
    await api.del(`/classes/${id}/`);
    load();
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Classes</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>{editId ? "Edit class" : "Add class"}</Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              
              <form onSubmit={submit}>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    size="small"
                  />
                </Box>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Level (order)"
                    value={form.numeric_level}
                    onChange={(e) => setForm({ ...form, numeric_level: Number(e.target.value) })}
                    size="small"
                    helperText="Controls logical sorting and student promotion order. Lower number = lower grade level (e.g. 0 = KG, 1 = Class 1)."
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button type="submit" variant="contained" size="small">
                    {editId ? "Update" : "Add"}
                  </Button>
                  {editId && (
                    <Button 
                      type="button" 
                      variant="text" 
                      size="small"
                      onClick={() => { setEditId(null); setForm({ name: "", numeric_level: 0 }); }}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell>
                      <Tooltip title="Controls logical sorting and student promotion order. Lower number = lower grade level (e.g. 0 = KG, 1 = Class 1)." placement="top">
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                          Level
                          <InfoOutlinedIcon fontSize="inherit" color="action" />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>No classes yet.</TableCell></TableRow>
                  ) : rows.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell>{c.numeric_level}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => { setEditId(c.id); setForm({ name: c.name, numeric_level: c.numeric_level }); }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => remove(c.id, c.name)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
