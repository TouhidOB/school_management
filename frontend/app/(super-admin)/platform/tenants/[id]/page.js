"use client";
import { useState, useEffect, useMemo } from "react";
import { 
  Box, Typography, Paper, Grid, Button, Tabs, Tab, Avatar, Chip, CircularProgress, Divider, Menu, MenuItem,
  Switch, Card, CardContent, IconButton, Tooltip, TextField, InputAdornment, Snackbar, Alert, Stack
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import WorkIcon from '@mui/icons-material/Work';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import HotelIcon from '@mui/icons-material/Hotel';
import InventoryIcon from '@mui/icons-material/Inventory';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventIcon from '@mui/icons-material/Event';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BarChartIcon from '@mui/icons-material/BarChart';
import PaidIcon from '@mui/icons-material/Paid';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import CancelIcon from '@mui/icons-material/Cancel';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';

import KPICard from "@/components/ui/KPICard";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { MODULES, MODULE_MAP } from "@/lib/modules";


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

const getModuleIcon = (key) => {
  switch (key) {
    case "hr": return <WorkIcon />;
    case "library": return <LocalLibraryIcon />;
    case "transport": return <DirectionsBusIcon />;
    case "hostel": return <HotelIcon />;
    case "inventory": return <InventoryIcon />;
    case "communication": return <CampaignIcon />;
    case "events": return <EventIcon />;
    case "certificates": return <EmojiEventsIcon />;
    case "reports": return <BarChartIcon />;
    case "finance": return <PaidIcon />;
    case "exams": return <AssignmentIcon />;
    case "homework": return <HomeWorkIcon />;
    case "learning": return <AutoStoriesIcon />;
    case "attendance": return <FactCheckIcon />;
    case "timetable": return <CalendarMonthIcon />;
    case "academics": return <MenuBookIcon />;
    case "teachers": return <PersonIcon />;
    case "students": return <PeopleIcon />;
    default: return <TuneIcon />;
  }
};

export default function SchoolDetail() {
  const { enterSchool } = useAuth();
  const { id } = useParams();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  // Modules State
  const [schoolModules, setSchoolModules] = useState({});
  const [updatingModule, setUpdatingModule] = useState(null);
  const [moduleToast, setModuleToast] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const activeModulesCount = useMemo(() => {
    return MODULES.filter(m => (schoolModules || {})[m.key] !== false).length;
  }, [schoolModules]);

  const addonActiveCount = useMemo(() => {
    return MODULES.filter(m => m.category === "addon" && (schoolModules || {})[m.key] !== false).length;
  }, [schoolModules]);

  const filteredModules = useMemo(() => {
    return MODULES.filter(m => {
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      if (moduleSearch) {
        const q = moduleSearch.toLowerCase().trim();
        return (
          m.label.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.path.toLowerCase().includes(q) ||
          m.key.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [categoryFilter, moduleSearch]);

  const groupedModules = useMemo(() => {
    const groups = {
      addon: {
        title: "Specialized Add-on Modules (Circled Extensions)",
        subtitle: "Optional modules for specialized school requirements. Toggling OFF hides them from the sidebar.",
        color: "#6366f1",
        items: []
      },
      academic: {
        title: "Academic & Operational Modules",
        subtitle: "Coursework, examination, homework, schedules, and financial collections.",
        color: "#0284c7",
        items: []
      },
      core: {
        title: "Core Foundation Directory Modules",
        subtitle: "Essential directories for students, faculty, and academic classes.",
        color: "#059669",
        items: []
      }
    };

    filteredModules.forEach(m => {
      if (groups[m.category]) {
        groups[m.category].items.push(m);
      }
    });

    return groups;
  }, [filteredModules]);

  useEffect(() => {
    fetchSchoolData();
  }, [id]);

  const fetchSchoolData = async () => {
    try {
      const res = await api.get(`/platform/schools/${id}/command_center/`);
      setData(res);
      setSchoolModules(res.modules || res.school?.modules || {});
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

  const handleToggleModule = async (key, currentStatus) => {
    const newStatus = !currentStatus;
    setUpdatingModule(key);
    setSchoolModules(prev => ({ ...prev, [key]: newStatus }));
    try {
      const res = await api.post(`/platform/schools/${id}/set_modules/`, {
        modules: { [key]: newStatus }
      });
      if (res && res.modules) {
        setSchoolModules(res.modules);
      }
      setModuleToast(`Module "${MODULE_MAP[key]?.label || key}" ${newStatus ? 'activated' : 'deactivated'} successfully.`);
    } catch (err) {
      console.error(err);
      setSchoolModules(prev => ({ ...prev, [key]: currentStatus }));
      alert("Failed to update module state.");
    } finally {
      setUpdatingModule(null);
    }
  };

  const handleBulkToggle = async (mode) => {
    let payload = {};
    if (mode === "enable_all") {
      MODULES.forEach(m => { payload[m.key] = true; });
    } else if (mode === "disable_addons") {
      MODULES.forEach(m => {
        if (m.category === "addon") payload[m.key] = false;
      });
    } else if (mode === "enable_addons") {
      MODULES.forEach(m => {
        if (m.category === "addon") payload[m.key] = true;
      });
    }

    setUpdatingModule("bulk");
    setSchoolModules(prev => ({ ...prev, ...payload }));
    try {
      const res = await api.post(`/platform/schools/${id}/set_modules/`, { modules: payload });
      if (res && res.modules) {
        setSchoolModules(res.modules);
      }
      setModuleToast(`Modules updated successfully.`);
    } catch (err) {
      console.error(err);
      fetchSchoolData();
      alert("Failed to update modules.");
    } finally {
      setUpdatingModule(null);
    }
  };

  if (loading || !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const school = data.school || {};
  const stats = data.stats || {};
  const subscription = data.subscription || {};
  const usage = data.usage || {};

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
            <Box sx={{ display: 'flex', gap: 2, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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
              <Typography variant="body2" color="text.secondary">|</Typography>
              <Chip 
                label={`${activeModulesCount} Modules Active`} 
                size="small" 
                color="primary" 
                variant="filled" 
                sx={{ fontWeight: 'bold', fontSize: '0.75rem' }} 
              />
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" onClick={() => router.push(`/platform/tenants/${id}/edit`)}>Edit</Button>
              <Button variant="outlined" size="small" startIcon={<OpenInNewIcon />} onClick={() => { enterSchool(id); router.push(`/dashboard`); }}>Login as Admin</Button>
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
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Modules</span>
                  <Chip 
                    label={`${activeModulesCount}/${MODULES.length}`} 
                    size="small" 
                    color={activeModulesCount === MODULES.length ? "success" : "primary"}
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }} 
                  />
                </Box>
              } 
              {...a11yProps(4)} 
            />
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

        {/* TAB 4: SUPERADMIN MODULES CONTROL */}
        <CustomTabPanel value={tabValue} index={4}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#0f172a" }}>
                  School Feature Modules & Sidebar Control
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enable or disable modules for <strong>{school.name}</strong>. Modules turned OFF are immediately hidden from the school sidebar and inaccessible.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="primary"
                  startIcon={<ToggleOnIcon />}
                  onClick={() => handleBulkToggle("enable_all")}
                  disabled={updatingModule !== null}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Enable All Modules
                </Button>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="warning"
                  startIcon={<CancelIcon />}
                  onClick={() => handleBulkToggle("disable_addons")}
                  disabled={updatingModule !== null}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Deactivate Add-ons (9)
                </Button>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => handleBulkToggle("enable_addons")}
                  disabled={updatingModule !== null}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Activate Add-ons (9)
                </Button>
              </Stack>
            </Box>

            {/* Quick KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block">
                    ACTIVE MODULES
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: "#16a34a" }}>
                    {activeModulesCount} / {MODULES.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Currently visible on school sidebar
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block">
                    SPECIALIZED ADD-ONS (CIRCLED)
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: "#4f46e5" }}>
                    {addonActiveCount} / 9 Active
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    HR, Library, Transport, Hostel, Inventory, etc.
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block">
                    DEACTIVATED MODULES
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: MODULES.length - activeModulesCount > 0 ? "#e11d48" : "#64748b" }}>
                    {MODULES.length - activeModulesCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hidden & blocked from school staff
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Toolbar Filter */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <TextField 
                size="small"
                placeholder="Search module name, path (/hr, /library)..."
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
                sx={{ width: { xs: '100%', sm: 300 } }}
              />

              <Stack direction="row" spacing={1}>
                <Chip 
                  label={`All (${MODULES.length})`}
                  clickable
                  color={categoryFilter === "all" ? "primary" : "default"}
                  onClick={() => setCategoryFilter("all")}
                />
                <Chip 
                  label={`Add-ons (9)`}
                  clickable
                  color={categoryFilter === "addon" ? "primary" : "default"}
                  onClick={() => setCategoryFilter("addon")}
                />
                <Chip 
                  label={`Academic & Ops (6)`}
                  clickable
                  color={categoryFilter === "academic" ? "primary" : "default"}
                  onClick={() => setCategoryFilter("academic")}
                />
                <Chip 
                  label={`Core (3)`}
                  clickable
                  color={categoryFilter === "core" ? "primary" : "default"}
                  onClick={() => setCategoryFilter("core")}
                />
              </Stack>
            </Box>

            {/* Modules Render List by Category */}
            <Stack spacing={4}>
              {Object.entries(groupedModules).map(([catKey, group]) => {
                if (group.items.length === 0) return null;

                return (
                  <Box key={catKey}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 8, height: 24, bgcolor: group.color, borderRadius: 1 }} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#0f172a" }}>
                          {group.title} ({group.items.length})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {group.subtitle}
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      {group.items.map((m) => {
                        const isEnabled = schoolModules[m.key] !== false;
                        const isUpdating = updatingModule === m.key || updatingModule === "bulk";

                        return (
                          <Grid item xs={12} md={6} key={m.key}>
                            <Card 
                              elevation={0} 
                              sx={{ 
                                border: isEnabled ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                                bgcolor: isEnabled ? "#ffffff" : "#f8fafc",
                                borderRadius: 2.5,
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                  borderColor: isEnabled ? "#94a3b8" : "#cbd5e1",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                                }
                              }}
                            >
                              <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar 
                                      sx={{ 
                                        width: 44, 
                                        height: 44, 
                                        bgcolor: isEnabled ? `${group.color}15` : "#f1f5f9", 
                                        color: isEnabled ? group.color : "#94a3b8" 
                                      }}
                                    >
                                      {getModuleIcon(m.key)}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: isEnabled ? "#0f172a" : "#64748b", lineHeight: 1.2 }}>
                                        {m.label}
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                                        <Chip 
                                          label={m.path} 
                                          size="small" 
                                          sx={{ 
                                            fontFamily: 'monospace', 
                                            fontSize: '0.72rem', 
                                            height: 20, 
                                            bgcolor: isEnabled ? '#f1f5f9' : '#e2e8f0', 
                                            color: '#475569' 
                                          }} 
                                        />
                                        <Chip 
                                          label={m.badge} 
                                          size="small" 
                                          variant="outlined" 
                                          sx={{ 
                                            fontSize: '0.68rem', 
                                            height: 20, 
                                            color: isEnabled ? group.color : '#94a3b8',
                                            borderColor: isEnabled ? `${group.color}50` : '#cbd5e1'
                                          }} 
                                        />
                                      </Box>
                                    </Box>
                                  </Box>

                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isUpdating && <CircularProgress size={18} />}
                                    <Switch 
                                      checked={isEnabled}
                                      onChange={() => handleToggleModule(m.key, isEnabled)}
                                      disabled={isUpdating}
                                      color="primary"
                                    />
                                  </Box>
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ minHeight: 38, mb: 1.5, fontSize: '0.85rem' }}>
                                  {m.description}
                                </Typography>

                                <Divider sx={{ my: 1.5 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isEnabled ? (
                                      <Chip 
                                        icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                        label="ACTIVE ON SIDEBAR" 
                                        size="small" 
                                        color="success"
                                        sx={{ fontWeight: 'bold', fontSize: '0.7rem', height: 22 }}
                                      />
                                    ) : (
                                      <Chip 
                                        icon={<CancelIcon sx={{ fontSize: '14px !important' }} />}
                                        label="DISABLED / HIDDEN" 
                                        size="small" 
                                        sx={{ fontWeight: 'bold', fontSize: '0.7rem', height: 22, bgcolor: '#fee2e2', color: '#b91c1c' }}
                                      />
                                    )}
                                  </Box>

                                  <Typography variant="caption" sx={{ color: isEnabled ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                                    {isEnabled ? "Module Enabled" : "Module Deactivated"}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </CustomTabPanel>
      </Paper>

      {/* Instant Notification Toast */}
      <Snackbar
        open={Boolean(moduleToast)}
        autoHideDuration={3000}
        onClose={() => setModuleToast("")}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setModuleToast("")} severity="success" sx={{ width: '100%' }}>
          {moduleToast}
        </Alert>
      </Snackbar>

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
