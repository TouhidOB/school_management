#!/bin/bash
cat << 'INNER_EOF' > "frontend/app/(super-admin)/platform/tenants/[id]/page.js"
"use client";
import { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Grid, Button, Tabs, Tab, Avatar, Chip, CircularProgress, Divider, Menu, MenuItem
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import KPICard from "@/components/ui/KPICard";
import { api } from "@/lib/api";

function a11yProps(index) {
  return {
    id: `school-tab-${index}`,
    'aria-controls': `school-tabpanel-${index}`,
  };
}

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`school-tabpanel-${index}`}
      aria-labelledby={`school-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending Verification" },
  { value: "trial", label: "Trial Active" },
  { value: "active", label: "Active" },
  { value: "trial_expired", label: "Trial Expired" },
  { value: "payment_failed", label: "Payment Failed" },
  { value: "suspended", label: "Suspended" },
  { value: "cancelled", label: "Cancelled" },
];

export default function SchoolDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchSchoolData();
  }, [id]);

  const fetchSchoolData = async () => {
    try {
      const res = await api.get(`/platform/schools/${id}/command_center/`);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStatusClick = (event) => setAnchorEl(event.currentTarget);
  const handleStatusClose = () => setAnchorEl(null);

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/platform/schools/${id}/`, { status: newStatus });
      fetchSchoolData();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
    handleStatusClose();
  };

  if (loading || !data) return <CircularProgress />;

  const { school, stats, subscription, usage } = data;

  const getStatusColor = (status_display) => {
    const map = {
      "Active": "success",
      "Trial Active": "info",
      "Pending Verification": "warning",
      "Suspended": "error",
      "Cancelled": "error",
      "Trial Expired": "default"
    };
    return map[status_display] || "default";
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push('/platform/tenants')}
          sx={{ mr: 2, color: 'text.secondary' }}
        >
          Back
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar src={school.logo} sx={{ width: 80, height: 80 }} variant="rounded">
              {school.name?.charAt(0) || 'S'}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5" fontWeight="bold">{school.name}</Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">Code: {school.slug}</Typography>
              <Typography variant="body2" color="text.secondary">|</Typography>
              <Chip 
                label={school.status_display} 
                size="small" 
                color={getStatusColor(school.status_display)} 
                variant="outlined" 
                onClick={handleStatusClick} 
                sx={{ cursor: "pointer" }} 
              />
              <Typography variant="body2" color="text.secondary">|</Typography>
              <Typography variant="body2" color="text.secondary">Plan: {subscription.plan_name}</Typography>
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small">Edit</Button>
              <Button variant="outlined" size="small" startIcon={<OpenInNewIcon />}>Login as Admin</Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ width: '100%', borderRadius: 2, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Overview" {...a11yProps(0)} />
            <Tab label="Users" {...a11yProps(1)} />
            <Tab label="Subscription" {...a11yProps(2)} />
            <Tab label="Usage" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <CustomTabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard title="Students" value={stats.students} trend="up" trendValue="-" period="n/a" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard title="Teachers" value={stats.teachers} trend="up" trendValue="-" period="n/a" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard title="Staff" value={stats.staff} trend="up" trendValue="-" period="n/a" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard title="Admins" value={stats.admins} trend="up" trendValue="-" period="n/a" />
            </Grid>
          </Grid>
        </CustomTabPanel>
        
        <CustomTabPanel value={tabValue} index={1}>
          <Typography variant="h6">Users Overview</Typography>
          <Typography variant="body2" color="text.secondary">Detailed user lists will be managed here.</Typography>
        </CustomTabPanel>

        <CustomTabPanel value={tabValue} index={2}>
          <Typography variant="h6">Subscription Panel</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1"><strong>Plan:</strong> {subscription.plan_name}</Typography>
            <Typography variant="body1"><strong>Status:</strong> {subscription.status}</Typography>
            <Typography variant="body1"><strong>Started:</strong> {new Date(subscription.started).toLocaleDateString()}</Typography>
            {subscription.trial_ends && (
              <Typography variant="body1"><strong>Trial Ends:</strong> {new Date(subscription.trial_ends).toLocaleDateString()}</Typography>
            )}
          </Box>
        </CustomTabPanel>

        <CustomTabPanel value={tabValue} index={3}>
          <Typography variant="h6">Usage Panel</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1"><strong>Students Used:</strong> {usage.students_used} / {usage.students_limit || 'Unlimited'}</Typography>
            <Typography variant="body1"><strong>Teachers Used:</strong> {usage.teachers_used}</Typography>
            <Typography variant="body1"><strong>Storage Used:</strong> {usage.storage_used} / {usage.storage_limit}</Typography>
          </Box>
        </CustomTabPanel>
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleStatusClose}>
        {STATUS_OPTIONS.map((option) => (
          <MenuItem 
            key={option.value} 
            selected={school.status === option.value}
            onClick={() => handleStatusChange(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
INNER_EOF
