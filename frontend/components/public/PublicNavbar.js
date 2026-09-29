// frontend/components/public/PublicNavbar.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

import {
  Box, Container, Typography, Button, Stack, Avatar,
  IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Divider, Chip
} from "@mui/material";

import SchoolIcon from '@mui/icons-material/School';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LoginIcon from '@mui/icons-material/Login';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export default function PublicNavbar() {
  const { user } = useAuth();
  const { t, isBangla } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: t('nav.home', 'Home'), path: "/" },
    { label: t('nav.features', 'Features'), path: "/features" },
    { label: t('nav.security', 'Security'), path: "/security" },
    { label: t('nav.pricing', 'Pricing'), path: "/pricing" },
    { label: t('nav.about', 'About'), path: "/about" },
    { label: t('nav.contact', 'Contact'), path: "/contact" },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <Box 
      component="header"
      sx={{ 
        position: "sticky", 
        top: 0, 
        zIndex: 1100, 
        bgcolor: "rgba(255, 255, 255, 0.96)", 
        backdropFilter: "blur(12px)", 
        borderBottom: "1px solid #e2e8f0",
        height: 66,
        display: "flex",
        alignItems: "center",
        transition: "all 0.2s ease-in-out"
      }}
    >
      <Container 
        maxWidth="xl" 
        sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        {/* Brand Logo */}
        <Box 
          component={Link} 
          href="/" 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1.2, 
            textDecoration: "none",
            color: "inherit",
            flexShrink: 0
          }}
        >
          <Avatar 
            sx={{ 
              bgcolor: "#1d4ed8", 
              width: 36, 
              height: 36, 
              boxShadow: "0 3px 10px rgba(29, 78, 216, 0.22)" 
            }}
          >
            <SchoolIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Avatar>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Typography variant="h6" fontWeight="900" sx={{ letterSpacing: -0.5, color: "#0f172a", lineHeight: 1, whiteSpace: "nowrap" }}>
              SMS<span style={{ color: "#2563eb" }}>Cloud</span>
            </Typography>
            <Chip 
              label="School OS" 
              size="small" 
              sx={{ 
                height: 18, 
                fontSize: "0.65rem", 
                fontWeight: 800, 
                bgcolor: "rgba(37, 99, 235, 0.08)", 
                color: "#1d4ed8",
                borderRadius: 1,
                display: { xs: "none", sm: "inline-flex" }
              }} 
            />
          </Box>
        </Box>

        {/* Desktop Navigation Links */}
        <Stack 
          direction="row" 
          spacing={0.5} 
          sx={{ 
            display: { xs: "none", md: "flex" }, 
            alignItems: "center",
            flexShrink: 0
          }}
        >
          {navLinks.map((item) => {
            const active = isActive(item.path);
            return (
              <Button
                key={item.path}
                component={Link}
                href={item.path}
                size="small"
                sx={{
                  textTransform: "none",
                  fontWeight: active ? 700 : 600,
                  fontSize: "0.88rem",
                  color: active ? "#1d4ed8" : "#475569",
                  bgcolor: active ? "rgba(29, 78, 216, 0.08)" : "transparent",
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.6,
                  whiteSpace: "nowrap",
                  minWidth: "auto",
                  "&:hover": {
                    bgcolor: active ? "rgba(29, 78, 216, 0.12)" : "rgba(0, 0, 0, 0.04)",
                    color: "#1d4ed8"
                  }
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>

        {/* Right Actions: Language Switcher & Auth Buttons */}
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ flexShrink: 0 }}>
          <LanguageToggle size="small" />

          {/* Desktop Auth CTA */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1 }}>
            {user ? (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => router.push(user.is_super_admin ? "/platform" : "/dashboard")}
                startIcon={user.is_super_admin ? <AdminPanelSettingsIcon sx={{ fontSize: 18 }} /> : <DashboardIcon sx={{ fontSize: 18 }} />}
                sx={{ 
                  textTransform: "none", 
                  fontWeight: 700, 
                  borderRadius: 2, 
                  px: 2, 
                  py: 0.7,
                  fontSize: "0.88rem",
                  whiteSpace: "nowrap",
                  bgcolor: "#1d4ed8",
                  "&:hover": { bgcolor: "#1e40af" },
                  boxShadow: "0 4px 12px rgba(29, 78, 216, 0.22)"
                }}
              >
                {user.is_super_admin ? t('nav.platformConsole', 'SuperAdmin') : t('nav.dashboard', 'Dashboard')}
              </Button>
            ) : (
              <>
                <Button 
                  variant="text" 
                  color="inherit" 
                  onClick={() => router.push("/login")}
                  startIcon={<LoginIcon sx={{ fontSize: 17 }} />}
                  sx={{ 
                    textTransform: "none", 
                    fontWeight: 700, 
                    color: "#334155", 
                    px: 1.5,
                    fontSize: "0.88rem",
                    whiteSpace: "nowrap" 
                  }}
                >
                  {t('nav.signIn', 'Staff Login')}
                </Button>
                <Button 
                  variant="contained" 
                  component={Link}
                  href="/contact"
                  sx={{ 
                    textTransform: "none", 
                    fontWeight: 700, 
                    borderRadius: 2, 
                    px: 2, 
                    py: 0.7,
                    fontSize: "0.88rem",
                    whiteSpace: "nowrap",
                    bgcolor: "#1d4ed8",
                    "&:hover": { bgcolor: "#1e40af" },
                    boxShadow: "0 4px 12px rgba(29, 78, 216, 0.22)" 
                  }}
                >
                  {t('nav.requestDemo', 'Book Demo')}
                </Button>
              </>
            )}
          </Box>

          {/* Mobile Hamburger Menu Button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerToggle}
            sx={{ display: { md: "none" }, color: "#334155" }}
          >
            <MenuIcon />
          </IconButton>
        </Stack>
      </Container>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: { width: 280, p: 2, bgcolor: "#ffffff" }
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ bgcolor: "#1d4ed8", width: 32, height: 32 }}>
              <SchoolIcon sx={{ color: "#fff", fontSize: 18 }} />
            </Avatar>
            <Typography variant="subtitle1" fontWeight="bold">
              SMS<span style={{ color: "#2563eb" }}>Cloud</span>
            </Typography>
          </Box>
          <IconButton onClick={handleDrawerToggle} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <List sx={{ mb: 2 }}>
          {navLinks.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  href={item.path}
                  onClick={handleDrawerToggle}
                  sx={{
                    borderRadius: 2,
                    bgcolor: active ? "rgba(29, 78, 216, 0.08)" : "transparent",
                    color: active ? "#1d4ed8" : "#334155",
                  }}
                >
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ 
                      fontWeight: active ? 700 : 600,
                      fontSize: "0.95rem"
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ mb: 2 }} />

        {/* Mobile Auth Actions */}
        <Stack spacing={1.5}>
          {user ? (
            <Button 
              variant="contained" 
              fullWidth
              onClick={() => {
                handleDrawerToggle();
                router.push(user.is_super_admin ? "/platform" : "/dashboard");
              }}
              startIcon={user.is_super_admin ? <AdminPanelSettingsIcon /> : <DashboardIcon />}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: "#1d4ed8" }}
            >
              {user.is_super_admin ? t('nav.platformConsole', 'SuperAdmin') : t('nav.dashboard', 'Dashboard')}
            </Button>
          ) : (
            <>
              <Button 
                variant="outlined" 
                fullWidth
                onClick={() => {
                  handleDrawerToggle();
                  router.push("/login");
                }}
                startIcon={<LoginIcon />}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              >
                {t('nav.signIn', 'Staff Login')}
              </Button>
              <Button 
                variant="contained" 
                fullWidth
                component={Link}
                href="/contact"
                onClick={handleDrawerToggle}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: "#1d4ed8" }}
              >
                {t('nav.requestDemo', 'Book Demo')}
              </Button>
            </>
          )}
        </Stack>
      </Drawer>
    </Box>
  );
}
