// frontend/app/features/page.js
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { MODULES } from "@/lib/modules";
import { MODULE_TRANSLATIONS } from "@/lib/translations";

import {
  Box, Container, Typography, Grid, Card, CardContent, Button,
  Chip, Stack, TextField, InputAdornment, Paper, Divider
} from "@mui/material";

// Icons
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PaidIcon from '@mui/icons-material/Paid';
import WorkIcon from '@mui/icons-material/Work';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import HotelIcon from '@mui/icons-material/Hotel';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import InventoryIcon from '@mui/icons-material/Inventory';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventIcon from '@mui/icons-material/Event';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BarChartIcon from '@mui/icons-material/BarChart';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';

const getModuleIcon = (key) => {
  switch (key) {
    case "academics": return <MenuBookIcon />;
    case "students": return <PeopleIcon />;
    case "teachers": return <PersonIcon />;
    case "attendance": return <FactCheckIcon />;
    case "timetable": return <CalendarMonthIcon />;
    case "exams": return <AssignmentIcon />;
    case "homework": return <HomeWorkIcon />;
    case "learning": return <AutoStoriesIcon />;
    case "finance": return <PaidIcon />;
    case "hr": return <WorkIcon />;
    case "transport": return <DirectionsBusIcon />;
    case "hostel": return <HotelIcon />;
    case "library": return <LocalLibraryIcon />;
    case "inventory": return <InventoryIcon />;
    case "communication": return <CampaignIcon />;
    case "events": return <EventIcon />;
    case "certificates": return <EmojiEventsIcon />;
    case "reports": return <BarChartIcon />;
    default: return <SchoolIcon />;
  }
};

export default function FeaturesPage() {
  const { t, isBangla } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { key: "all", label: t('featuresPage.allFilter', 'All Modules (18)') },
    { key: "academic", label: t('featuresPage.academicFilter', 'Academic & Students (8)') },
    { key: "finance", label: t('featuresPage.financeFilter', 'Fees & Payroll (4)') },
    { key: "campus", label: t('featuresPage.campusFilter', 'Campus & Logistics (3)') },
    { key: "comm", label: t('featuresPage.commFilter', 'Notices & Documents (3)') },
  ];

  const filteredModules = useMemo(() => {
    return MODULES.filter((m) => {
      // Category filter
      if (selectedCategory === "academic") {
        if (!["academics", "students", "teachers", "attendance", "timetable", "exams", "homework", "learning"].includes(m.key)) return false;
      } else if (selectedCategory === "finance") {
        if (!["finance", "hr", "reports"].includes(m.key)) return false;
      } else if (selectedCategory === "campus") {
        if (!["transport", "hostel", "library", "inventory"].includes(m.key)) return false;
      } else if (selectedCategory === "comm") {
        if (!["communication", "events", "certificates"].includes(m.key)) return false;
      }

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const localized = MODULE_TRANSLATIONS[m.key];
      const matchName = m.name?.toLowerCase().includes(q);
      const matchKey = m.key?.toLowerCase().includes(q);
      const matchDesc = m.description?.toLowerCase().includes(q);
      const matchLocLabel = localized?.label?.toLowerCase().includes(q);
      const matchLocDesc = localized?.description?.toLowerCase().includes(q);
      const matchLocBadge = localized?.badge?.toLowerCase().includes(q);

      return matchName || matchKey || matchDesc || matchLocLabel || matchLocDesc || matchLocBadge;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <PublicNavbar />

      {/* Hero Header */}
      <Box sx={{ bgcolor: "#ffffff", borderBottom: "1px solid #e2e8f0", pt: { xs: 6, md: 9 }, pb: { xs: 5, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: "center" }}>
          <Chip 
            label={t('featuresPage.badge', 'Complete Feature Directory')} 
            size="small" 
            sx={{ bgcolor: "rgba(37, 99, 235, 0.08)", color: "#1d4ed8", fontWeight: 700, mb: 2, px: 1 }} 
          />
          <Typography variant="h3" fontWeight="900" sx={{ color: "#0f172a", letterSpacing: -1, mb: 2, fontSize: { xs: "2rem", md: "2.75rem" } }}>
            {t('featuresPage.title', '18 Unified Modules Built Specifically for School Operations')}
          </Typography>
          <Typography variant="h6" sx={{ color: "#64748b", maxWidth: 800, mx: "auto", fontWeight: 400, lineHeight: 1.6, mb: 4 }}>
            {t('featuresPage.subtitle', 'Explore our complete educational toolkit. From classroom routines and biometric attendance to cash counter receipts, teacher payroll, and parent communication.')}
          </Typography>

          {/* Search Bar */}
          <Paper 
            elevation={0}
            sx={{ 
              maxWidth: 650, 
              mx: "auto", 
              p: 0.5, 
              border: "1px solid #cbd5e1", 
              borderRadius: 3, 
              boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.06)",
              bgcolor: "#fff"
            }}
          >
            <TextField
              fullWidth
              placeholder={t('featuresPage.searchPlaceholder', 'Search any feature (e.g., biometric, fee receipt, GPA 5.00, bus routes, scholarships, salary)...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start" sx={{ pl: 1.5, pr: 0.5 }}>
                    <SearchIcon sx={{ color: "#64748b" }} />
                  </InputAdornment>
                ),
                sx: { py: 1, px: 1, fontSize: "0.95rem" }
              }}
            />
          </Paper>

          {/* Category Filter Chips */}
          <Stack direction="row" spacing={1} sx={{ mt: 3, justifyContent: "center", flexWrap: "wrap", gap: 1 }}>
            {categories.map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <Chip
                  key={cat.key}
                  label={cat.label}
                  clickable
                  onClick={() => setSelectedCategory(cat.key)}
                  color={active ? "primary" : "default"}
                  variant={active ? "filled" : "outlined"}
                  sx={{
                    fontWeight: active ? 700 : 500,
                    borderRadius: 2,
                    px: 1,
                    py: 2,
                    fontSize: "0.85rem",
                    bgcolor: active ? "#1d4ed8" : "#ffffff",
                    borderColor: active ? "#1d4ed8" : "#cbd5e1"
                  }}
                />
              );
            })}
          </Stack>
        </Container>
      </Box>

      {/* Module Cards Grid */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, flexGrow: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {isBangla 
              ? `${filteredModules.length}টি মডিউল পাওয়া গেছে`
              : `Showing ${filteredModules.length} operational modules`}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {filteredModules.map((m) => {
            const localized = MODULE_TRANSLATIONS[m.key];
            const title = isBangla && localized ? localized.label : m.name;
            const desc = isBangla && localized ? localized.description : m.description;
            const badge = isBangla && localized ? localized.badge : m.badge;

            return (
              <Grid item xs={12} sm={6} md={4} key={m.key}>
                <Card 
                  sx={{ 
                    height: "100%", 
                    display: "flex", 
                    flexDirection: "column", 
                    borderRadius: 3, 
                    border: "1px solid #e2e8f0", 
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 24px -4px rgba(15, 23, 42, 0.1)",
                      borderColor: "#93c5fd"
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box 
                        sx={{ 
                          width: 48, 
                          height: 48, 
                          borderRadius: 2.5, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          bgcolor: "rgba(29, 78, 216, 0.08)", 
                          color: "#1d4ed8" 
                        }}
                      >
                        {getModuleIcon(m.key)}
                      </Box>
                      <Chip 
                        label={badge} 
                        size="small" 
                        sx={{ 
                          bgcolor: "#f1f5f9", 
                          color: "#334155", 
                          fontWeight: 700, 
                          fontSize: "0.72rem" 
                        }} 
                      />
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: "#0f172a", mb: 1, fontSize: "1.05rem" }}>
                      {title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, flexGrow: 1, mb: 2 }}>
                      {desc}
                    </Typography>

                    <Divider sx={{ my: 1.5, borderColor: "#f1f5f9" }} />

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {m.superadminToggleable ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <ToggleOnIcon sx={{ color: "#16a34a", fontSize: 20 }} />
                          <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 700 }}>
                            {isBangla ? "টগলযোগ্য মডিউল" : "Toggleable Module"}
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <CheckCircleIcon sx={{ color: "#2563eb", fontSize: 16 }} />
                          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                            {isBangla ? "মূল ফাউন্ডেশন" : "Core System"}
                          </Typography>
                        </Box>
                      )}

                      <Typography variant="caption" sx={{ color: "#94a3b8", fontFamily: "monospace" }}>
                        {m.path}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Bottom CTA Box */}
        <Paper 
          sx={{ 
            mt: 8, 
            p: { xs: 4, md: 6 }, 
            bgcolor: "#1d4ed8", 
            color: "#ffffff", 
            borderRadius: 4, 
            textAlign: "center",
            boxShadow: "0 20px 35px -10px rgba(29, 78, 216, 0.35)"
          }}
        >
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1.5 }}>
            {t('featuresPage.ctaTitle', 'Ready to streamline your school operations?')}
          </Typography>
          <Typography variant="body1" sx={{ color: "#bfdbfe", maxWidth: 650, mx: "auto", mb: 3 }}>
            {t('featuresPage.ctaDesc', 'Join dozens of forward-thinking institutions that have switched to SMSCloud.')}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              component={Link}
              href="/contact"
              size="large"
              sx={{
                bgcolor: "#ffffff",
                color: "#1d4ed8",
                fontWeight: 800,
                px: 3.5,
                py: 1.4,
                borderRadius: 2.5,
                textTransform: "none",
                "&:hover": { bgcolor: "#f1f5f9" }
              }}
            >
              {t('featuresPage.ctaButton', 'Schedule a Guided 15-Minute Demo')}
            </Button>
            <Button
              variant="outlined"
              component={Link}
              href="/pricing"
              size="large"
              sx={{
                borderColor: "rgba(255, 255, 255, 0.4)",
                color: "#ffffff",
                fontWeight: 700,
                px: 3.5,
                py: 1.4,
                borderRadius: 2.5,
                textTransform: "none",
                "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255, 255, 255, 0.08)" }
              }}
            >
              {isBangla ? "মূল্য তালিকা দেখুন" : "View Pricing & ROI"}
            </Button>
          </Stack>
        </Paper>
      </Container>

      <PublicFooter />
    </Box>
  );
}
