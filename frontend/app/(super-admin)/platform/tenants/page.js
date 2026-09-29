"use client";
import { useState, useEffect } from "react";
import { 
  Box, Typography, Tabs, Tab, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Menu, MenuItem
} from "@mui/material";
import { useRouter } from "next/navigation";
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { api } from "@/lib/api"; // Assuming there's a lib/api.js

function a11yProps(index) {
  return {
    id: `tenant-tab-${index}`,
    'aria-controls': `tenant-tabpanel-${index}`,
  };
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Verification' },
  { value: 'trial', label: 'Trial Active' },
  { value: 'active', label: 'Active' },
  { value: 'trial_expired', label: 'Trial Expired' },
  { value: 'payment_failed', label: 'Payment Failed' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function TenantsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await api.get("/platform/schools/");
      setSchools(res.results || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStatusClick = (event, school) => {
    setAnchorEl(event.currentTarget);
    setSelectedSchool(school);
  };

  const handleStatusClose = () => {
    setAnchorEl(null);
    setSelectedSchool(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedSchool) return;
    try {
      await api.patch(`/platform/schools/${selectedSchool.id}/`, { status: newStatus });
      fetchSchools();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
    handleStatusClose();
  };

  const statusFilter = (status) => {
    if (status === "All") return schools;
    return schools.filter(s => s.status_display === status);
  };

  const getStatusColor = (status) => {
    const map = {
      "Active": "success",
      "Trial Active": "info",
      "Pending Verification": "warning",
      "Suspended": "error",
      "Cancelled": "error",
      "Trial Expired": "default"
    };
    return map[status] || "default";
  };

  const tabs = [
    { label: "All Schools", filter: "All" },
    { label: "Pending", filter: "Pending Verification" },
    { label: "Trial", filter: "Trial Active" },
    { label: "Active", filter: "Active" },
    { label: "Suspended", filter: "Suspended" },
    { label: "Expired", filter: "Trial Expired" },
  ];

  const currentSchools = statusFilter(tabs[tabValue].filter);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#0f172a' }}>
            Tenants (Schools)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage all schools on the platform.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/platform/tenants/new')}
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          Add School
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="tenant tabs" sx={{ px: 2 }}>
            {tabs.map((tab, idx) => (
              <Tab key={idx} label={tab.label} {...a11yProps(idx)} />
            ))}
          </Tabs>
        </Box>
        
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>School</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Students</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentSchools.map((school) => (
                <TableRow key={school.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">{school.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{school.admin_email}</Typography>
                  </TableCell>
                  <TableCell>{school.plan_display || 'N/A'}</TableCell>
                  <TableCell>{school.student_count || 0}</TableCell>
                  <TableCell>
                    <Chip 
                      label={school.status_display} 
                      color={getStatusColor(school.status_display)} 
                      size="small" 
                      variant="outlined" 
                      onClick={(e) => handleStatusClick(e, school)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => router.push(`/platform/tenants/${school.id}`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {currentSchools.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    No schools found in this category.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleStatusClose}
      >
        {STATUS_OPTIONS.map((option) => (
          <MenuItem 
            key={option.value} 
            selected={selectedSchool?.status === option.value}
            onClick={() => handleStatusChange(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
