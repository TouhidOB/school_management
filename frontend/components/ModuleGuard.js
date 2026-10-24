"use client";

import { useAuth } from "@/context/AuthContext";
import { MODULE_MAP } from "@/lib/modules";
import { Box, Typography, Button, Paper, CircularProgress, Chip, Stack } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";

export default function ModuleGuard({ moduleKey, children }) {
  const { user, school, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  // If no school context or moduleKey not specified, render children
  if (!school || !moduleKey) {
    return children;
  }

  const modMeta = MODULE_MAP[moduleKey] || {
    label: moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1),
    categoryLabel: "Add-on Feature",
    description: "Specialized school management feature.",
  };

  // Check if module is disabled
  const isEnabled = school.modules ? school.modules[moduleKey] !== false : true;

  if (!isEnabled) {
    const isSuper = user?.is_super_admin;

    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            textAlign: "center",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              bgcolor: "error.lighter",
              color: "error.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2.5,
              border: "2px solid",
              borderColor: "error.light",
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 36 }} />
          </Box>

          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 1.5 }}>
            <Chip
              label={modMeta.categoryLabel || "Specialized Module"}
              size="small"
              color="default"
              variant="outlined"
            />
            <Chip label="Module Deactivated" size="small" color="error" sx={{ fontWeight: 600 }} />
          </Stack>

          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: "text.primary" }}>
            {modMeta.label} is Deactivated
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 540, mx: "auto", mb: 3 }}>
            The <strong>{modMeta.label}</strong> feature is currently deactivated for{" "}
            <strong>{school.name}</strong>. It may not be included in your active subscription tier or has been
            temporarily turned off by platform administration.
          </Typography>

          {modMeta.description && (
            <Box
              sx={{
                p: 2,
                mb: 3,
                bgcolor: "action.hover",
                borderRadius: 2,
                maxWidth: 520,
                mx: "auto",
                textAlign: "left",
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                Module Overview:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                {modMeta.description}
              </Typography>
            </Box>
          )}

          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            <Button
              component={Link}
              href="/dashboard"
              variant="outlined"
              color="primary"
              startIcon={<ArrowBackIcon />}
            >
              Back to Dashboard
            </Button>

            {isSuper && (
              <Button
                component={Link}
                href={`/platform/tenants/${school.id}`}
                variant="contained"
                color="secondary"
                startIcon={<SettingsIcon />}
              >
                Configure in SuperAdmin Console
              </Button>
            )}
          </Stack>
        </Paper>
      </Box>
    );
  }

  return children;
}
