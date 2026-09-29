// frontend/app/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { MODULES } from "@/lib/modules";
import { api } from "@/lib/api";
import { MODULE_TRANSLATIONS } from "@/lib/translations";

import { 
  Box, Container, Typography, Button, Grid, Card, CardContent, Avatar, Chip, 
  Stack, Divider, TextField, MenuItem, Paper, Alert, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Switch, FormControlLabel
} from "@mui/material";

// Icons
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LoginIcon from '@mui/icons-material/Login';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PrintIcon from '@mui/icons-material/Print';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CancelIcon from '@mui/icons-material/Cancel';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import SendIcon from '@mui/icons-material/Send';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

// Module Icons
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
    default: return <SchoolIcon />;
  }
};

export default function HomePage() {
  const { user } = useAuth();
  const { t, isBangla } = useLanguage();
  const router = useRouter();

  // State
  const [activeTourTab, setActiveTourTab] = useState("fee"); // "fee" | "exam" | "salary" | "modules"
  const [moduleCategory, setModuleCategory] = useState("all");
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"
  const [plans, setPlans] = useState([]);
  
  // Interactive Modular Switch Simulator State
  const [simulatedModules, setSimulatedModules] = useState({
    hostel: false,
    transport: true,
    library: true,
    inventory: false,
  });

  // Lead Form State
  const [leadForm, setLeadForm] = useState({
    name: "",
    school_name: "",
    email: "",
    phone: "",
    student_count: "500-1000",
    message: ""
  });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState("");

  useEffect(() => {
    // Fetch live public plans
    api.publicGet("/public/plans/")
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setPlans(res);
        } else {
          loadFallbackPlans();
        }
      })
      .catch(() => {
        loadFallbackPlans();
      });
  }, []);

  const loadFallbackPlans = () => {
    setPlans([
      {
        id: 1,
        name: isBangla ? "১৪ দিনের ফ্রি ট্রায়াল" : "14-Day Free Pilot",
        tier: "trial",
        price_monthly: 0,
        price_yearly: 0,
        student_limit: 100,
        description: isBangla ? "কোনো পেমেন্ট ছাড়াই আপনার স্কুলের ১০০ জন শিক্ষার্থী দিয়ে পরখ করে দেখুন।" : "Full features for up to 100 students with zero upfront payment."
      },
      {
        id: 2,
        name: isBangla ? "স্ট্যান্ডার্ড স্কুল প্ল্যান" : "Standard School",
        tier: "standard",
        price_monthly: 10,
        price_yearly: 100,
        is_per_student: true,
        student_limit: null,
        description: isBangla ? "প্রতি শিক্ষার্থী মাত্র ১০ টাকা/মাস। সাধারণ ও মাঝারি স্কুলের জন্য সেরা।" : "Flexible pricing at ৳10 per active student per month."
      },
      {
        id: 3,
        name: isBangla ? "ক্যাম্পাস ও কলেজ" : "Campus & College",
        tier: "basic",
        price_monthly: 2500,
        price_yearly: 25000,
        is_per_student: false,
        student_limit: 1000,
        description: isBangla ? "১,০০০ শিক্ষার্থী পর্যন্ত ফিক্সড রেট। ডিজিটাল হাজিরা ও রেজাল্টসহ পূর্ণাঙ্গ।" : "Fixed rate for institutes with up to 1,000 students."
      },
      {
        id: 4,
        name: isBangla ? "মাল্টি-ব্রাঞ্চ এন্টারপ্রাইজ" : "Multi-Branch Network",
        tier: "enterprise",
        price_monthly: 5000,
        price_yearly: 50000,
        is_per_student: false,
        student_limit: null,
        description: isBangla ? "একাধিক শাখা, আনলিমিটেড শিক্ষার্থী, ডেডিকেটেড সাপোর্ট ও কাস্টম ডোমেইন।" : "Unlimited students, multi-branch network, custom domain & SLA."
      }
    ]);
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setLeadSubmitting(true);
    setLeadError("");
    setLeadSuccess(false);

    try {
      await api.publicPost("/public/contact/", {
        name: leadForm.name,
        school_name: leadForm.school_name,
        email: leadForm.email,
        phone: leadForm.phone,
        topic: `Inquiry (${leadForm.student_count} students)`,
        message: leadForm.message || "Requested demo via website form."
      });
      setLeadSuccess(true);
      setLeadForm({
        name: "",
        school_name: "",
        email: "",
        phone: "",
        student_count: "500-1000",
        message: ""
      });
    } catch (err) {
      setLeadError(err?.message || "Could not submit inquiry. Please try again or WhatsApp us directly.");
    } finally {
      setLeadSubmitting(false);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Filter modules by category
  const filteredModules = useMemo(() => {
    if (moduleCategory === "all") return MODULES;
    return MODULES.filter(m => {
      if (moduleCategory === "academic") return ["academics", "students", "teachers", "timetable", "attendance", "exams", "homework", "learning", "reports"].includes(m.key);
      if (moduleCategory === "finance") return ["finance", "hr"].includes(m.key);
      if (moduleCategory === "campus") return ["transport", "hostel", "library", "inventory"].includes(m.key);
      if (moduleCategory === "comm") return ["communication", "events", "certificates"].includes(m.key);
      return true;
    });
  }, [moduleCategory]);

  return (
    <Box sx={{ bgcolor: "#ffffff", color: "#0f172a", minHeight: "100vh", overflowX: "hidden" }}>
      
      {/* 1. TOP STICKY NAVBAR */}
      <PublicNavbar />

      {/* 2. HERO SECTION */}
      <Box 
        sx={{ 
          pt: { xs: 7, md: 10 }, 
          pb: { xs: 8, md: 10 }, 
          bgcolor: "#fafbfc",
          borderBottom: "1px solid #e2e8f0"
        }}
      >
        <Container maxWidth="lg" sx={{ textAlign: "center" }}>
          
          {/* Eyebrow Badge */}
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, bgcolor: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", px: 2, py: 0.75, borderRadius: 5, mb: 3 }}>
            <VerifiedUserIcon sx={{ fontSize: 16, color: "#2563eb" }} />
            <Typography variant="caption" fontWeight="bold">
              {t('landing.heroBadge')}
            </Typography>
          </Box>

          {/* Main Title */}
          <Typography 
            variant="h2" 
            fontWeight="900" 
            sx={{ 
              fontSize: { xs: "2.1rem", sm: "2.9rem", md: "3.5rem" }, 
              letterSpacing: -1, 
              lineHeight: 1.2,
              mb: 2.5,
              color: "#0f172a",
              maxWidth: 950,
              mx: "auto"
            }}
          >
            {t('landing.heroTitle')}
          </Typography>

          {/* Subtitle */}
          <Typography 
            variant="body1" 
            sx={{ 
              maxWidth: 780, 
              mx: "auto", 
              fontSize: { xs: "1.05rem", md: "1.2rem" }, 
              color: "#475569", 
              lineHeight: 1.7,
              mb: 4.5
            }}
          >
            {t('landing.heroSubtitle')}
          </Typography>

          {/* Action CTAs */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ mb: 6 }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => scrollToSection("contact")}
              endIcon={<ArrowForwardIcon />}
              sx={{ 
                textTransform: "none", 
                fontSize: "1.05rem", 
                fontWeight: 700, 
                py: 1.6, 
                px: 4, 
                borderRadius: 2.5,
                bgcolor: "#1d4ed8",
                boxShadow: "0 8px 20px -4px rgba(29, 78, 216, 0.35)",
                "&:hover": { bgcolor: "#1e40af" }
              }}
            >
              {t('landing.ctaDemo')}
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              onClick={() => router.push("/login")}
              startIcon={<LoginIcon />}
              sx={{ 
                textTransform: "none", 
                fontSize: "1.05rem", 
                fontWeight: 700, 
                py: 1.6, 
                px: 3.5, 
                borderRadius: 2.5,
                borderColor: "#cbd5e1",
                color: "#1e293b",
                "&:hover": { borderColor: "#94a3b8", bgcolor: "#ffffff" }
              }}
            >
              {t('landing.ctaLogin')}
            </Button>
          </Stack>

          {/* Trust Highlights Row */}
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={12} sm={6} md={3}>
              <Box 
                component={Link} 
                href="/security" 
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: 1, 
                  color: "#334155", 
                  textDecoration: "none",
                  "&:hover": { color: "#16a34a" }
                }}
              >
                <CloudDoneIcon sx={{ color: "#16a34a", fontSize: 20 }} />
                <Typography variant="body2" fontWeight={600}>{t('landing.trustBadge1')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, color: "#334155" }}>
                <SmartphoneIcon sx={{ color: "#2563eb", fontSize: 20 }} />
                <Typography variant="body2" fontWeight={600}>{t('landing.trustBadge2')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box 
                component={Link} 
                href="/security" 
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: 1, 
                  color: "#334155", 
                  textDecoration: "none",
                  "&:hover": { color: "#7c3aed" }
                }}
              >
                <CheckCircleIcon sx={{ color: "#7c3aed", fontSize: 20 }} />
                <Typography variant="body2" fontWeight={600}>{t('landing.trustBadge3')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box 
                component={Link} 
                href="/contact" 
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: 1, 
                  color: "#334155", 
                  textDecoration: "none",
                  "&:hover": { color: "#ea580c" }
                }}
              >
                <SupportAgentIcon sx={{ color: "#ea580c", fontSize: 20 }} />
                <Typography variant="body2" fontWeight={600}>{t('landing.trustBadge4')}</Typography>
              </Box>
            </Grid>
          </Grid>

        </Container>
      </Box>

      {/* 3. INTERACTIVE PRODUCT TOUR */}
      <Box id="tour" sx={{ py: { xs: 8, md: 12 }, bgcolor: "#ffffff" }}>
        <Container maxWidth="lg">
          
          <Box sx={{ textAlign: "center", mb: 5 }}>
            <Chip label={t('landing.tourBadge')} color="primary" sx={{ fontWeight: "bold", mb: 1.5 }} />
            <Typography variant="h3" fontWeight="900" sx={{ fontSize: { xs: "1.9rem", md: "2.6rem" }, letterSpacing: -0.5, mb: 1.5 }}>
              {t('landing.tourTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, mx: "auto" }}>
              {t('landing.tourSubtitle')}
            </Typography>

            {/* Tour Switch Buttons */}
            <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" sx={{ mt: 4, gap: 1 }}>
              <Button 
                variant={activeTourTab === "fee" ? "contained" : "outlined"}
                onClick={() => setActiveTourTab("fee")}
                startIcon={<ReceiptLongIcon />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 2.5, py: 1 }}
              >
                {t('landing.tabFee')}
              </Button>
              <Button 
                variant={activeTourTab === "exam" ? "contained" : "outlined"}
                onClick={() => setActiveTourTab("exam")}
                startIcon={<MilitaryTechIcon />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 2.5, py: 1 }}
              >
                {t('landing.tabExam')}
              </Button>
              <Button 
                variant={activeTourTab === "salary" ? "contained" : "outlined"}
                onClick={() => setActiveTourTab("salary")}
                startIcon={<AccountBalanceWalletIcon />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 2.5, py: 1 }}
              >
                {t('landing.tabSalary')}
              </Button>
              <Button 
                variant={activeTourTab === "modules" ? "contained" : "outlined"}
                onClick={() => setActiveTourTab("modules")}
                startIcon={<ToggleOnIcon />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 2.5, py: 1 }}
              >
                {t('landing.tabModules')}
              </Button>
            </Stack>
          </Box>

          {/* Interactive Screen Preview Container */}
          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: 3.5, 
              border: "1px solid #cbd5e1", 
              boxShadow: "0 15px 35px -5px rgba(15, 23, 42, 0.08)",
              bgcolor: "#f8fafc",
              p: { xs: 2.5, md: 4 }
            }}
          >
            {/* TAB 1: Fee Counter & Receipt */}
            {activeTourTab === "fee" && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a", mb: 0.5 }}>
                    {t('landing.tourFeeTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('landing.tourFeeDesc')}
                  </Typography>
                </Box>

                <Paper sx={{ p: 3, bgcolor: "#ffffff", borderRadius: 2.5, border: "1px solid #e2e8f0", maxWidth: 750, mx: "auto" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed #cbd5e1", pb: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" color="primary">Famous Academy</Typography>
                      <Typography variant="caption" color="text.secondary">Money Receipt #REC-2026-09412 · Date: 14 Sep 2026</Typography>
                    </Box>
                    <Chip label={t('landing.tourFeePaidBadge')} color="success" size="small" sx={{ fontWeight: 800 }} />
                  </Box>

                  <Typography variant="body2" fontWeight={600} sx={{ mb: 2, color: "#1e293b" }}>
                    {t('landing.tourFeeStudent')}
                  </Typography>

                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Monthly Tuition Fee (September)</Typography>
                      <Typography variant="body2" fontWeight={600}>৳1,200.00</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">2nd Term Examination Fee</Typography>
                      <Typography variant="body2" fontWeight={600}>৳500.00</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Science Lab Charge</Typography>
                      <Typography variant="body2" fontWeight={600}>৳300.00</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                      <Typography variant="body2">{t('landing.tourFeeDiscount')}</Typography>
                      <Typography variant="body2" fontWeight={600}>-৳400.00</Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Received by Cashier: M. Rahman</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">{t('landing.tourFeeTotal')}</Typography>
                    </Box>
                    <Button variant="outlined" size="small" startIcon={<PrintIcon />} sx={{ textTransform: "none", fontWeight: 700 }}>
                      {t('landing.tourFeePrintBtn')}
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}

            {/* TAB 2: Exam Marks & GPA Card */}
            {activeTourTab === "exam" && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a", mb: 0.5 }}>
                    {t('landing.tourExamTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('landing.tourExamDesc')}
                  </Typography>
                </Box>

                <Paper sx={{ p: 3, bgcolor: "#ffffff", borderRadius: 2.5, border: "1px solid #e2e8f0", maxWidth: 750, mx: "auto" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", pb: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{t('landing.tourExamCardStudent')}</Typography>
                      <Typography variant="caption" color="text.secondary">Annual Model Examination 2026</Typography>
                    </Box>
                    <Chip label={t('landing.tourExamGPA')} color="warning" size="small" sx={{ fontWeight: 800 }} />
                  </Box>

                  <Grid container spacing={1.5} sx={{ textAlign: "center" }}>
                    <Grid item xs={3}>
                      <Paper sx={{ p: 1.5, bgcolor: "#f1f5f9", borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Bangla</Typography>
                        <Typography variant="h6" fontWeight="bold">92</Typography>
                        <Typography variant="caption" color="success.main" fontWeight="bold">A+ (5.00)</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper sx={{ p: 1.5, bgcolor: "#f1f5f9", borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">English</Typography>
                        <Typography variant="h6" fontWeight="bold">88</Typography>
                        <Typography variant="caption" color="success.main" fontWeight="bold">A+ (5.00)</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper sx={{ p: 1.5, bgcolor: "#f1f5f9", borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Mathematics</Typography>
                        <Typography variant="h6" fontWeight="bold">96</Typography>
                        <Typography variant="caption" color="success.main" fontWeight="bold">A+ (5.00)</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper sx={{ p: 1.5, bgcolor: "#f1f5f9", borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Science</Typography>
                        <Typography variant="h6" fontWeight="bold">91</Typography>
                        <Typography variant="caption" color="success.main" fontWeight="bold">A+ (5.00)</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3, pt: 2, borderTop: "1px dashed #cbd5e1" }}>
                    <Typography variant="body2" color="text.secondary">Total Marks: <strong>367 / 400</strong> · Status: <strong>PASSED</strong></Typography>
                    <Button variant="outlined" size="small" startIcon={<PrintIcon />} sx={{ textTransform: "none", fontWeight: 700 }}>
                      {isBangla ? "মার্কশিট প্রিন্ট (PDF)" : "Print Marksheet (PDF)"}
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}

            {/* TAB 3: Teacher Salary Voucher */}
            {activeTourTab === "salary" && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a", mb: 0.5 }}>
                    {t('landing.tourSalaryTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('landing.tourSalaryDesc')}
                  </Typography>
                </Box>

                <Paper sx={{ p: 3, bgcolor: "#ffffff", borderRadius: 2.5, border: "1px solid #e2e8f0", maxWidth: 750, mx: "auto" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", pb: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{t('landing.tourSalaryTeacher')}</Typography>
                      <Typography variant="caption" color="text.secondary">{t('landing.tourSalaryWalletDebit')}</Typography>
                    </Box>
                    <Chip label="PAID & SIGNED" color="success" size="small" sx={{ fontWeight: 800 }} />
                  </Box>

                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Basic Salary (Government Scale Mapped)</Typography>
                      <Typography variant="body2" fontWeight={600}>৳38,878.00</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Medical & Transport Allowance</Typography>
                      <Typography variant="body2" fontWeight={600}>+৳1,500.00</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", color: "#dc2626" }}>
                      <Typography variant="body2">Provident Fund Contribution</Typography>
                      <Typography variant="body2" fontWeight={600}>-৳1,500.00</Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Disbursed via Central School Treasury Wallet</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">{t('landing.tourSalaryDisbursed')}</Typography>
                    </Box>
                    <Button variant="outlined" size="small" startIcon={<PrintIcon />} sx={{ textTransform: "none", fontWeight: 700 }}>
                      {isBangla ? "বেতন ভাউচার প্রিন্ট" : "Print Salary Voucher"}
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}

            {/* TAB 4: Modular Switch Simulator */}
            {activeTourTab === "modules" && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a", mb: 0.5 }}>
                    {t('landing.tourModTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('landing.tourModDesc')}
                  </Typography>
                </Box>

                <Paper sx={{ p: 3, bgcolor: "#ffffff", borderRadius: 2.5, border: "1px solid #e2e8f0", maxWidth: 750, mx: "auto" }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "#1e293b" }}>
                    {isBangla ? "নিজে পরীক্ষা করে দেখুন: টগল অন বা অফ করলে সাইডবার কেমন হবে" : "Interactive Simulator: Toggle modules on/off to see how the school sidebar adapts"}
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={simulatedModules.hostel} 
                              onChange={(e) => setSimulatedModules({ ...simulatedModules, hostel: e.target.checked })} 
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight="bold">{isBangla ? "হোস্টেল ও ছাত্রাবাস" : "Hostel & Dormitory"}</Typography>
                              <Typography variant="caption" color="text.secondary">{simulatedModules.hostel ? (isBangla ? "সাইডবারে সক্রিয় ✅" : "Active in sidebar ✅") : (isBangla ? "লুকানো ❌" : "Hidden from sidebar ❌")}</Typography>
                            </Box>
                          }
                        />
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={simulatedModules.transport} 
                              onChange={(e) => setSimulatedModules({ ...simulatedModules, transport: e.target.checked })} 
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight="bold">{isBangla ? "স্কুল বাস ও পরিবহন" : "School Bus & Vans"}</Typography>
                              <Typography variant="caption" color="text.secondary">{simulatedModules.transport ? (isBangla ? "সাইডবারে সক্রিয় ✅" : "Active in sidebar ✅") : (isBangla ? "লুকানো ❌" : "Hidden from sidebar ❌")}</Typography>
                            </Box>
                          }
                        />
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={simulatedModules.library} 
                              onChange={(e) => setSimulatedModules({ ...simulatedModules, library: e.target.checked })} 
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight="bold">{isBangla ? "লাইব্রেরি ও বই" : "Library System"}</Typography>
                              <Typography variant="caption" color="text.secondary">{simulatedModules.library ? (isBangla ? "সাইডবারে সক্রিয় ✅" : "Active in sidebar ✅") : (isBangla ? "লুকানো ❌" : "Hidden from sidebar ❌")}</Typography>
                            </Box>
                          }
                        />
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={simulatedModules.inventory} 
                              onChange={(e) => setSimulatedModules({ ...simulatedModules, inventory: e.target.checked })} 
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight="bold">{isBangla ? "মালামাল ও ইনভেন্টরি" : "Campus Inventory"}</Typography>
                              <Typography variant="caption" color="text.secondary">{simulatedModules.inventory ? (isBangla ? "সাইডবারে সক্রিয় ✅" : "Active in sidebar ✅") : (isBangla ? "লুকানো ❌" : "Hidden from sidebar ❌")}</Typography>
                            </Box>
                          }
                        />
                      </Paper>
                    </Grid>
                  </Grid>

                  <Alert severity="info" sx={{ mt: 2.5, borderRadius: 2 }}>
                    <Typography variant="caption">
                      {isBangla 
                        ? "সুপারঅ্যাডমিন যে মডিউল বন্ধ করবেন, স্কুল অ্যাডমিন বা শিক্ষকরা সাইডবারে তার কোনো চিহ্নও দেখবেন না। ফলে ছোট স্কুলের কাছে সফটওয়্যার কখনও জটিল মনে হবে না।" 
                        : "When a module is toggled OFF by the Superadmin, it vanishes from the school's sidebar menu completely. Teachers will never see confusing buttons they do not need."}
                    </Typography>
                  </Alert>
                </Paper>
              </Box>
            )}

          </Paper>
        </Container>
      </Box>

      {/* 4. BEFORE VS AFTER COMPARISON */}
      <Box id="comparison" sx={{ py: { xs: 8, md: 12 }, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Chip label={t('landing.compareBadge')} color="secondary" sx={{ fontWeight: "bold", mb: 1.5 }} />
            <Typography variant="h3" fontWeight="900" sx={{ fontSize: { xs: "1.9rem", md: "2.6rem" }, letterSpacing: -0.5, mb: 1.5 }}>
              {t('landing.compareTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: "auto" }}>
              {t('landing.compareSubtitle')}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* The Old Way */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, borderRadius: 3, border: "1px solid #fecaca", bgcolor: "#fff5f5", height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                  <CancelIcon sx={{ color: "#ef4444", fontSize: 28 }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: "#991b1b" }}>
                    {t('landing.beforeTitle')}
                  </Typography>
                </Box>
                <Stack spacing={2.5}>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#ef4444", fontWeight: "bold" }}>✕</Typography>
                    <Typography variant="body2" color="#7f1d1d">{t('landing.before1')}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#ef4444", fontWeight: "bold" }}>✕</Typography>
                    <Typography variant="body2" color="#7f1d1d">{t('landing.before2')}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#ef4444", fontWeight: "bold" }}>✕</Typography>
                    <Typography variant="body2" color="#7f1d1d">{t('landing.before3')}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#ef4444", fontWeight: "bold" }}>✕</Typography>
                    <Typography variant="body2" color="#7f1d1d">{t('landing.before4')}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* The New Way */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, borderRadius: 3, border: "1px solid #bbf7d0", bgcolor: "#f0fdf4", height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                  <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 28 }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: "#166534" }}>
                    {t('landing.afterTitle')}
                  </Typography>
                </Box>
                <Stack spacing={2.5}>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#16a34a", fontWeight: "bold" }}>✓</Typography>
                    <Typography variant="body2" color="#14532d">{t('landing.after1')}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#16a34a", fontWeight: "bold" }}>✓</Typography>
                    <Typography variant="body2" color="#14532d">{t('landing.after2')}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#16a34a", fontWeight: "bold" }}>✓</Typography>
                    <Typography variant="body2" color="#14532d">{t('landing.after3')}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#16a34a", fontWeight: "bold" }}>✓</Typography>
                    <Typography variant="body2" color="#14532d">{t('landing.after4')}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: "center", mt: 5 }}>
            <Button
              variant="text"
              component={Link}
              href="/about"
              endIcon={<ArrowForwardIcon />}
              sx={{ fontWeight: 700, color: "#1d4ed8", textTransform: "none", fontSize: "0.95rem" }}
            >
              {isBangla ? "আমাদের সম্পর্কে ও লক্ষ্য বিস্তারিত পড়ুন" : "Read Our Full Story, Mission & Principles"}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* 5. 18 PURPOSE-BUILT MODULES */}
      <Box id="modules" sx={{ py: { xs: 8, md: 12 }, bgcolor: "#ffffff" }}>
        <Container maxWidth="lg">
          
          <Box sx={{ textAlign: "center", mb: 5 }}>
            <Chip label={t('landing.modulesBadge')} color="primary" sx={{ fontWeight: "bold", mb: 1.5 }} />
            <Typography variant="h3" fontWeight="900" sx={{ fontSize: { xs: "1.9rem", md: "2.6rem" }, letterSpacing: -0.5, mb: 1.5 }}>
              {t('landing.modulesTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: "auto" }}>
              {t('landing.modulesSubtitle')}
            </Typography>

            {/* Filter Category Chips */}
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ mt: 3.5, gap: 1 }}>
              <Chip 
                label={t('common.all')}
                clickable 
                color={moduleCategory === "all" ? "primary" : "default"}
                onClick={() => setModuleCategory("all")}
                sx={{ fontWeight: "bold", px: 1 }}
              />
              <Chip 
                label={t('landing.modCatAcademic')} 
                clickable 
                color={moduleCategory === "academic" ? "primary" : "default"}
                onClick={() => setModuleCategory("academic")}
                sx={{ fontWeight: "bold", px: 1 }}
              />
              <Chip 
                label={t('landing.modCatFinance')} 
                clickable 
                color={moduleCategory === "finance" ? "primary" : "default"}
                onClick={() => setModuleCategory("finance")}
                sx={{ fontWeight: "bold", px: 1 }}
              />
              <Chip 
                label={t('landing.modCatCampus')} 
                clickable 
                color={moduleCategory === "campus" ? "primary" : "default"}
                onClick={() => setModuleCategory("campus")}
                sx={{ fontWeight: "bold", px: 1 }}
              />
              <Chip 
                label={t('landing.modCatComm')} 
                clickable 
                color={moduleCategory === "comm" ? "primary" : "default"}
                onClick={() => setModuleCategory("comm")}
                sx={{ fontWeight: "bold", px: 1 }}
              />
            </Stack>
          </Box>

          <Grid container spacing={3}>
            {filteredModules.map((m) => {
              const modBn = MODULE_TRANSLATIONS[m.key];
              const displayLabel = isBangla && modBn ? modBn.label : m.label;
              const displayDesc = isBangla && modBn ? modBn.description : m.description;
              const displayBadge = isBangla && modBn ? modBn.badge : m.badge;

              return (
                <Grid item xs={12} sm={6} md={4} key={m.key}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      height: "100%",
                      p: 1,
                      border: "1px solid #e2e8f0", 
                      borderRadius: 3,
                      transition: "all 0.2s ease",
                      "&:hover": { 
                        borderColor: "#2563eb",
                        boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.08)"
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Avatar sx={{ width: 44, height: 44, bgcolor: "#eff6ff", color: "#1d4ed8" }}>
                          {getModuleIcon(m.key)}
                        </Avatar>
                        <Chip 
                          label={displayBadge} 
                          size="small" 
                          sx={{ 
                            fontSize: "0.7rem", 
                            fontWeight: 700, 
                            bgcolor: "#f1f5f9", 
                            color: "#475569" 
                          }} 
                        />
                      </Box>

                      <Typography variant="h6" fontWeight="bold" sx={{ color: "#0f172a", mb: 0.5, fontSize: "1.05rem" }}>
                        {displayLabel}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, minHeight: 44 }}>
                        {displayDesc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ textAlign: "center", mt: 5 }}>
            <Button
              variant="outlined"
              component={Link}
              href="/features"
              endIcon={<ArrowForwardIcon />}
              size="large"
              sx={{
                borderRadius: 2.5,
                px: 3.5,
                py: 1.2,
                fontWeight: 700,
                textTransform: "none",
                borderColor: "#cbd5e1",
                color: "#1e293b",
                "&:hover": { borderColor: "#1d4ed8", color: "#1d4ed8", bgcolor: "rgba(29, 78, 216, 0.04)" }
              }}
            >
              {isBangla ? "সকল ১৮টি মডিউলের বিস্তারিত ডিরেক্টরি দেখুন" : "Explore Complete 18-Module Deep Dive & Workflows"}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* 6. TRANSPARENT PRICING PLANS */}
      <Box id="pricing" sx={{ py: { xs: 8, md: 12 }, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <Container maxWidth="lg">
          
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Chip label={t('landing.pricingBadge')} color="primary" sx={{ fontWeight: "bold", mb: 1.5 }} />
            <Typography variant="h3" fontWeight="900" sx={{ fontSize: { xs: "1.9rem", md: "2.6rem" }, letterSpacing: -0.5, mb: 1.5 }}>
              {t('landing.pricingTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: "auto", mb: 3 }}>
              {t('landing.pricingSubtitle')}
            </Typography>

            {/* Monthly / Yearly Switch */}
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
              <Button 
                variant={billingCycle === "monthly" ? "contained" : "outlined"}
                onClick={() => setBillingCycle("monthly")}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              >
                {t('landing.billingMonthly')}
              </Button>
              <Button 
                variant={billingCycle === "yearly" ? "contained" : "outlined"}
                onClick={() => setBillingCycle("yearly")}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              >
                {t('landing.billingYearly')}
              </Button>
            </Stack>
          </Box>

          <Grid container spacing={3}>
            {plans.map((p, idx) => {
              const price = billingCycle === "yearly" ? p.price_yearly : p.price_monthly;
              const isPopular = p.tier === "standard" || idx === 1;

              return (
                <Grid item xs={12} sm={6} md={3} key={p.id || idx}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      height: "100%",
                      p: 1.5,
                      border: isPopular ? "2px solid #1d4ed8" : "1px solid #e2e8f0",
                      borderRadius: 3.5,
                      bgcolor: "#ffffff",
                      position: "relative",
                      boxShadow: isPopular ? "0 10px 25px -4px rgba(29,78,216,0.15)" : "none"
                    }}
                  >
                    {isPopular && (
                      <Chip 
                        label={isBangla ? "সর্বাধিক জনপ্রিয়" : "MOST POPULAR"} 
                        size="small" 
                        color="primary" 
                        sx={{ position: "absolute", top: 12, right: 12, fontWeight: 800, fontSize: "0.68rem" }} 
                      />
                    )}

                    <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: "#0f172a" }}>
                        {p.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ minHeight: 36, mb: 2 }}>
                        {p.description}
                      </Typography>

                      <Box sx={{ my: 2 }}>
                        <Typography variant="h3" fontWeight="900" sx={{ color: "#0f172a", display: "inline" }}>
                          ৳{price}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.price_monthly === 0 ? " (14 days)" : billingCycle === "yearly" ? t('landing.pricingPerYear') : (p.is_per_student ? t('landing.pricingPerStudent') : t('landing.pricingPerMonth'))}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: "#16a34a" }} />
                          <Typography variant="caption" fontWeight={600}>
                            {p.student_limit ? (isBangla ? `${p.student_limit} জন শিক্ষার্থী পর্যন্ত` : `Up to ${p.student_limit} Students`) : (isBangla ? "আনলিমিটেড শিক্ষার্থী" : "Unlimited Students")}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: "#16a34a" }} />
                          <Typography variant="caption" fontWeight={600}>
                            {isBangla ? "ফি আদায় ও সেন্ট্রাল ওয়ালেট" : "Fee Collection & Wallet"}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: "#16a34a" }} />
                          <Typography variant="caption" fontWeight={600}>
                            {isBangla ? "ডিজিটাল হাজিরা ও এসএমএস" : "Daily Attendance & SMS Alerts"}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: "#16a34a" }} />
                          <Typography variant="caption" fontWeight={600}>
                            {isBangla ? "পরীক্ষা, মার্কশিট ও ফলাফল" : "Exam Marks & GPA Cards"}
                          </Typography>
                        </Box>
                      </Stack>

                      <Button 
                        fullWidth
                        variant={isPopular ? "contained" : "outlined"}
                        onClick={() => scrollToSection("contact")}
                        sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, py: 1 }}
                      >
                        {p.price_monthly === 0 ? t('landing.trialBtn') : t('landing.planBtn')}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ textAlign: "center", mt: 6 }}>
            <Button
              variant="outlined"
              component={Link}
              href="/pricing"
              endIcon={<ArrowForwardIcon />}
              size="large"
              sx={{
                borderRadius: 2.5,
                px: 3.5,
                py: 1.2,
                fontWeight: 700,
                textTransform: "none",
                borderColor: "#cbd5e1",
                color: "#1e293b",
                "&:hover": { borderColor: "#1d4ed8", color: "#1d4ed8", bgcolor: "rgba(29, 78, 216, 0.04)" }
              }}
            >
              {isBangla ? "লাইভ খরচ ও সাশ্রয় ক্যালকুলেটর ব্যবহার করুন" : "Calculate Your School's ROI & Full Feature Matrix"}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* 7. REAL FAQ ACCORDION */}
      <Box id="faq" sx={{ py: { xs: 8, md: 12 }, bgcolor: "#ffffff" }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Chip label={t('landing.faqBadge')} color="info" sx={{ fontWeight: "bold", mb: 1.5 }} />
            <Typography variant="h3" fontWeight="900" sx={{ fontSize: { xs: "1.9rem", md: "2.6rem" }, letterSpacing: -0.5, mb: 1.5 }}>
              {t('landing.faqTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('landing.faqSubtitle')}
            </Typography>
          </Box>

          <Stack spacing={2}>
            <Accordion elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "12px !important", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="bold">{t('landing.faq1Q')}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('landing.faq1A')}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "12px !important", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="bold">{t('landing.faq2Q')}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('landing.faq2A')}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "12px !important", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="bold">{t('landing.faq3Q')}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('landing.faq3A')}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "12px !important", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="bold">{t('landing.faq4Q')}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('landing.faq4A')}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "12px !important", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="bold">{t('landing.faq5Q')}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('landing.faq5A')}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Container>
      </Box>

      {/* 8. HUMAN DEMO & DIRECT CONTACT */}
      <Box id="contact" sx={{ py: { xs: 8, md: 12 }, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <Container maxWidth="lg">
          <Grid container spacing={5} alignItems="center">
            
            {/* Left Column: Direct Human Contact */}
            <Grid item xs={12} md={5}>
              <Chip label={t('landing.contactBadge')} color="primary" sx={{ fontWeight: "bold", mb: 2 }} />
              <Typography variant="h3" fontWeight="900" sx={{ fontSize: { xs: "1.9rem", md: "2.5rem" }, letterSpacing: -0.5, mb: 2 }}>
                {t('landing.contactTitle')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                {t('landing.contactSubtitle')}
              </Typography>

              {/* WhatsApp Direct Chat Button */}
              <Button
                variant="contained"
                size="large"
                startIcon={<WhatsAppIcon />}
                href="https://wa.me/8801700000000"
                target="_blank"
                sx={{ 
                  bgcolor: "#25D366", 
                  color: "#ffffff", 
                  fontWeight: 700, 
                  textTransform: "none",
                  py: 1.5,
                  px: 3,
                  borderRadius: 2.5,
                  mb: 4,
                  "&:hover": { bgcolor: "#1ebc59" }
                }}
              >
                {t('landing.whatsappBtn')}
              </Button>

              <Stack spacing={2.5}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#eff6ff", color: "#1d4ed8" }}>
                    <PhoneInTalkIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">{t('landing.directCallLabel')}</Typography>
                    <Typography variant="body1" fontWeight="bold">{t('landing.contactPhone')}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#eff6ff", color: "#1d4ed8" }}>
                    <EmailIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Email Support</Typography>
                    <Typography variant="body1" fontWeight="bold">{t('landing.contactEmail')}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#eff6ff", color: "#1d4ed8" }}>
                    <LocationOnIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Dhaka Office</Typography>
                    <Typography variant="body1" fontWeight="bold">{t('landing.contactAddress')}</Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>

            {/* Right Column: Interactive Demo Booking Form */}
            <Grid item xs={12} md={7}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 3, md: 4.5 }, 
                  borderRadius: 3.5, 
                  border: "1px solid #cbd5e1", 
                  bgcolor: "#ffffff",
                  boxShadow: "0 10px 30px -5px rgba(15,23,42,0.06)"
                }}
              >
                <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a", mb: 0.5 }}>
                  {t('landing.formTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('landing.formSubtitle')}
                </Typography>

                {leadSuccess ? (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {t('landing.formSuccess')}
                    </Typography>
                  </Alert>
                ) : (
                  <form onSubmit={handleLeadSubmit}>
                    {leadError && (
                      <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                        {leadError}
                      </Alert>
                    )}

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          fullWidth 
                          required
                          label={t('landing.formName')} 
                          size="small" 
                          value={leadForm.name}
                          onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField 
                          fullWidth 
                          required
                          label={t('landing.formSchool')} 
                          size="small" 
                          value={leadForm.school_name}
                          onChange={(e) => setLeadForm({ ...leadForm, school_name: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField 
                          fullWidth 
                          required
                          type="email"
                          label={t('landing.formEmail')} 
                          size="small" 
                          value={leadForm.email}
                          onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField 
                          fullWidth 
                          required
                          label={t('landing.formPhone')} 
                          size="small" 
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField 
                          select
                          fullWidth 
                          label={t('landing.formSize')} 
                          size="small" 
                          value={leadForm.student_count}
                          onChange={(e) => setLeadForm({ ...leadForm, student_count: e.target.value })}
                        >
                          <MenuItem value="Under 200">Under 200 Students</MenuItem>
                          <MenuItem value="200-500">200 to 500 Students</MenuItem>
                          <MenuItem value="500-1000">500 to 1,000 Students</MenuItem>
                          <MenuItem value="1000-2500">1,000 to 2,500 Students</MenuItem>
                          <MenuItem value="2500+">2,500+ Students (Multiple Campuses)</MenuItem>
                        </TextField>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField 
                          fullWidth 
                          multiline 
                          rows={3}
                          label={t('landing.formMessage')} 
                          size="small" 
                          value={leadForm.message}
                          onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                          placeholder={isBangla ? "যেমন: আমরা ফি আদায় ও ডিজিটাল হাজিরা দিয়ে শুরু করতে চাই..." : "e.g. We want to start with fee collection and attendance..."}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Button 
                          type="submit" 
                          variant="contained" 
                          fullWidth 
                          size="large"
                          disabled={leadSubmitting}
                          endIcon={leadSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                          sx={{ 
                            textTransform: "none", 
                            fontWeight: 700, 
                            py: 1.4, 
                            borderRadius: 2, 
                            bgcolor: "#1d4ed8",
                            "&:hover": { bgcolor: "#1e40af" }
                          }}
                        >
                          {leadSubmitting ? t('landing.formSubmitting') : t('landing.formSubmit')}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                )}
              </Paper>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* 9. AUTHENTIC EDUCATIONAL FOOTER */}
      <PublicFooter />

    </Box>
  );
}
