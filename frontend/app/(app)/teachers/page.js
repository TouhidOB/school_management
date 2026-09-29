"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import BadgeIcon from "@mui/icons-material/Badge";

export default function TeachersPage() {
  const [data, setData] = useState({ results: [], count: 0 });
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get("/teachers/?page_size=100")
      .then(setData)
      .catch(() => setData({ results: [], count: 0 }))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function remove(id, name) {
    if (!confirm(`Delete teacher "${name}"?`)) return;
    await api.del(`/teachers/${id}/`);
    load();
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<BadgeIcon />}
          component="a"
          href="/print/teachers/id-cards"
          target="_blank"
          rel="noreferrer"
        >
          Print Teacher IDs
        </Button>
        <Button 
          component={Link} 
          href="/teachers/new" 
          variant="contained" 
          startIcon={<AddIcon />}
        >
          Add Teacher
        </Button>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small" hover>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Employee&nbsp;ID</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Loading…</TableCell>
                </TableRow>
              ) : data.results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No teachers yet.</TableCell>
                </TableRow>
              ) : (
                data.results.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>{t.display_name}</TableCell>
                    <TableCell>{t.employee_id || "—"}</TableCell>
                    <TableCell>{t.designation_name || "—"}</TableCell>
                    <TableCell>{t.phone || "—"}</TableCell>
                    <TableCell>
                      <Chip 
                        label={t.status} 
                        size="small" 
                        variant="outlined" 
                        sx={{ textTransform: 'capitalize' }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        component={Link} 
                        href={`/teachers/${t.id}`} 
                        size="small" 
                        color="primary" 
                        title="View"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        component="a" 
                        href={`/print/teacher/${t.id}/id-card`} 
                        target="_blank" 
                        rel="noreferrer"
                        size="small" 
                        color="secondary" 
                        title="ID card"
                      >
                        <BadgeIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        component={Link} 
                        href={`/teachers/${t.id}/edit`} 
                        size="small" 
                        color="secondary" 
                        title="Edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => remove(t.id, t.display_name)} 
                        title="Delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
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
