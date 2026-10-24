"use client";
import { useState, useEffect, useMemo } from "react";
import { 
  Box, Typography, Paper, Button, TextField, Grid, MenuItem, Switch, FormControlLabel,
  CircularProgress, Chip, Stack, Card, CardContent, InputAdornment, Tooltip
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { MODULES, MODULE_CATEGORIES, MANDATORY_MODULE_KEYS } from "@/lib/modules";

export default function EditPlan() {
  const router = useRouter();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [moduleSearch, setModuleSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "", plan_code: "", description: "", tier: "basic", currency: "USD",
    price_monthly: 0, price_yearly: 0, trial_days: 14,
    student_limit: "", teacher_limit: "", storage_limit_gb: 10, sms_limit: 1000,
    is_active: true, is_per_student: false,
    features: {}
  });

  useEffect(() => {
    fetchPlan();
  }, [id]);

  const fetchPlan = async () => {
    try {
      const res = await api.get(`/platform/billing/plans/${id}/`);
      const data = { ...res };
      if (data.student_limit === null) data.student_limit = "";
      if (data.teacher_limit === null) data.teacher_limit = "";
      if (!data.features || typeof data.features !== "object") {
        data.features = {};
      }
      setFormData(data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch plan details.");
      router.push('/platform/plans');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleModuleToggle = (moduleKey) => {
    if (MANDATORY_MODULE_KEYS.has(moduleKey)) return;
    const currentVal = formData.features?.[moduleKey] !== false;
    setFormData({
      ...formData,
      features: {
        ...(formData.features || {}),
        [moduleKey]: !currentVal
      }
    });
  };

  const handleSetAllOptional = (enable) => {
    const updatedFeatures = { ...(formData.features || {}) };
    MODULES.forEach(m => {
      if (!MANDATORY_MODULE_KEYS.has(m.key)) {
        updatedFeatures[m.key] = enable;
      }
    });
    setFormData({ ...formData, features: updatedFeatures });
  };

  const filteredModules = useMemo(() => {
    return MODULES.filter((m) => {
      const matchesSearch =
        m.label.toLowerCase().includes(moduleSearch.toLowerCase()) ||
        m.description.toLowerCase().includes(moduleSearch.toLowerCase()) ||
        m.key.toLowerCase().includes(moduleSearch.toLowerCase());
      const matchesCat = categoryFilter === "all" || m.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [categoryFilter, moduleSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (payload.student_limit === "") payload.student_limit = null;
    if (payload.teacher_limit === "") payload.teacher_limit = null;
    
    // Ensure mandatory modules are always true in features
    const finalFeatures = { ...(payload.features || {}) };
    MANDATORY_MODULE_KEYS.forEach(k => {
      finalFeatures[k] = true;
    });
    payload.features = finalFeatures;

    try {
      await api.put(`/platform/billing/plans/${id}/`, payload);
      router.push('/platform/plans');
    } catch (err) {
      console.error(err);
      alert("Failed to update plan.");
    }
  };

  if (loading) return <CircularProgress />;

  const enabledCount = MODULES.filter(m => {
    if (MANDATORY_MODULE_KEYS.has(m.key)) return true;
    return formData.features?.[m.key] !== false;
  }).length;

  return (
    <Box sx={{ pb: 6 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Edit Subscription Plan
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>General Info</Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Plan Name" name="name" value={formData.name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Plan Code" name="plan_code" value={formData.plan_code} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Description" name="description" value={formData.description} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Tier" name="tier" value={formData.tier} onChange={handleChange}>
                <MenuItem value="trial">Free Trial</MenuItem>
                <MenuItem value="basic">Basic</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="premium">Premium</MenuItem>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel 
                control={<Switch checked={formData.is_active} onChange={handleChange} name="is_active" />} 
                label="Is Active" 
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel 
                control={<Switch checked={formData.is_per_student} onChange={handleChange} name="is_per_student" />} 
                label="Per-Student Pricing" 
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Pricing</Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Currency" name="currency" value={formData.currency} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Monthly Price" name="price_monthly" value={formData.price_monthly} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Yearly Price" name="price_yearly" value={formData.price_yearly} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Trial Days" name="trial_days" value={formData.trial_days} onChange={handleChange} />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Limits (Leave blank for unlimited)</Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Student Limit" name="student_limit" value={formData.student_limit} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Teacher Limit" name="teacher_limit" value={formData.teacher_limit} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Storage Limit (GB)" name="storage_limit_gb" value={formData.storage_limit_gb} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="SMS Limit" name="sms_limit" value={formData.sms_limit} onChange={handleChange} />
            </Grid>
          </Grid>

          {/* ============================================================== */}
          {/* Included Modules & Features Bundler Section                    */}
          {/* ============================================================== */}
          <Box sx={{ mt: 5, mb: 4, pt: 3, borderTop: "1px solid #e2e8f0" }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#0f172a" }}>
                  Included Plan Modules ({enabledCount}/{MODULES.length} Active)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure default modules bundled into this subscription tier. Subscribed schools inherit these feature flags.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button 
                  size="small" 
                  variant="outlined" 
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => handleSetAllOptional(true)}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Enable All Add-ons
                </Button>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="warning"
                  startIcon={<BlockIcon />}
                  onClick={() => handleSetAllOptional(false)}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Disable All Add-ons
                </Button>
              </Stack>
            </Box>

            {/* Filter and Search Bar */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
              <TextField 
                size="small"
                placeholder="Search modules by name or key..."
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

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                <Chip 
                  label={`All (${MODULES.length})`}
                  clickable
                  color={categoryFilter === "all" ? "primary" : "default"}
                  onClick={() => setCategoryFilter("all")}
                />
                {MODULE_CATEGORIES.map(cat => {
                  const count = MODULES.filter(m => m.category === cat.key).length;
                  return (
                    <Chip 
                      key={cat.key}
                      label={`${cat.label} (${count})`}
                      clickable
                      color={categoryFilter === cat.key ? "primary" : "default"}
                      onClick={() => setCategoryFilter(cat.key)}
                    />
                  );
                })}
              </Stack>
            </Box>

            {/* Module Cards Grid */}
            <Grid container spacing={2}>
              {filteredModules.map((m) => {
                const isMandatory = MANDATORY_MODULE_KEYS.has(m.key);
                const isEnabled = isMandatory ? true : (formData.features?.[m.key] !== false);

                return (
                  <Grid item xs={12} sm={6} md={4} key={m.key}>
                    <Card
                      elevation={0}
                      sx={{
                        border: isEnabled ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                        bgcolor: isEnabled ? "#ffffff" : "#f8fafc",
                        borderRadius: 2,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.15s ease-in-out"
                      }}
                    >
                      <CardContent sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column", "&:last-child": { pb: 2 } }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                          <Box sx={{ pr: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: isEnabled ? "#0f172a" : "#64748b" }}>
                              {m.label}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#94a3b8", fontFamily: "monospace" }}>
                              {m.key}
                            </Typography>
                          </Box>

                          {isMandatory ? (
                            <Tooltip title="Core foundation module - mandatory for institution operations">
                              <Chip
                                icon={<LockIcon sx={{ fontSize: "14px !important" }} />}
                                label="Mandatory"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ height: 24, fontSize: "0.72rem", fontWeight: 600 }}
                              />
                            </Tooltip>
                          ) : (
                            <Switch
                              size="small"
                              checked={isEnabled}
                              onChange={() => handleModuleToggle(m.key)}
                              color="primary"
                            />
                          )}
                        </Box>

                        <Typography variant="body2" sx={{ color: isEnabled ? "#475569" : "#94a3b8", fontSize: "0.8rem", mt: "auto", pt: 1 }}>
                          {m.description}
                        </Typography>

                        {m.dependencies && m.dependencies.length > 0 && (
                          <Box sx={{ mt: 1, pt: 1, borderTop: "1px dashed #e2e8f0" }}>
                            <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                              Requires: {m.dependencies.join(", ")}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button variant="contained" type="submit" size="large" sx={{ px: 4 }}>Update Plan</Button>
            <Button variant="outlined" onClick={() => router.push('/platform/plans')} size="large">Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
