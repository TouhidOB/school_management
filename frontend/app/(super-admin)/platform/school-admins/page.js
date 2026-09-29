"use client";
import { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip
} from "@mui/material";
import { api } from "@/lib/api";

export default function SchoolAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await api.get("/platform/school-admins/");
      setAdmins(res.results || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#0f172a' }}>
            School Admins
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            View all school administrators across all tenants.
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>School</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id} hover>
                  <TableCell fontWeight="500">{admin.first_name} {admin.last_name}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{admin.school_name || "N/A"}</TableCell>
                  <TableCell>
                    <Chip 
                      label={admin.is_active ? "Active" : "Inactive"} 
                      color={admin.is_active ? "success" : "default"} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}</TableCell>
                  <TableCell>{new Date(admin.date_joined).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {admins.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    No school admins found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
