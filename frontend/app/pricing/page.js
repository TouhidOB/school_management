// frontend/app/pricing/page.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";

import {
  Box, Container, Typography, Grid, Card, CardContent, Button,
  Chip, Stack, Paper, Slider, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Accordion, AccordionSummary, AccordionDetails, Divider
} from "@mui/material";

// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveIcon from '@mui/icons-material/Remove';
import CalculateIcon from '@mui/icons-material/Calculate';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SavingsIcon from '@mui/icons-material/Savings';
import SpeedIcon from '@mui/icons-material/Speed';

export default function PricingPage() {
  const { t, isBangla } = useLanguage();

  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"
  const [studentCount, setStudentCount] = useState(500);

  // Dynamic calculations based on ৳10 / student / mo
  const perStudentRate = 10;
  const calculatedMonthly = studentCount * perStudentRate;
  const calculatedYearly = calculatedMonthly * 10; // 2 months free

  const plans = [
    {
      id: "pilot",
      name: isBangla ? "১৪ দিনের পাইলট" : "14-Day Free Pilot",
      price: "৳0",
      period: isBangla ? "বিনামূল্যে" : "Free Trial",
      subtitle: isBangla ? "কোনো পেমেন্ট ছাড়াই পরখ করে দেখুন" : "Zero upfront payment needed",
      features: [
        isBangla ? "সর্বোচ্চ ১০০ জন শিক্ষার্থী" : "Up to 100 Students",
        isBangla ? "শিক্ষার্থী ও শিক্ষক ডিরেক্টরি" : "Student & Faculty Directory",
        isBangla ? "দৈনিক ক্লাস হাজিরা" : "Daily Attendance",
        isBangla ? "ফি আদায় ও ক্যাশ রসিদ" : "Fees Collection & Receipt Slips",
        isBangla ? "পরীক্ষার নম্বর ও গ্রেডিং" : "Exams & GPA Grading",
      ],
      cta: isBangla ? "ফ্রি ট্রায়াল শুরু করুন" : "Start Free Pilot",
      popular: false,
    },
    {
      id: "standard",
      name: isBangla ? "স্ট্যান্ডার্ড স্কুল প্ল্যান" : "Standard School",
      price: billingCycle === "monthly" ? "৳10" : "৳100",
      period: billingCycle === "monthly" 
        ? (isBangla ? "/ শিক্ষার্থী / মাস" : "/ student / mo") 
        : (isBangla ? "/ শিক্ষার্থী / বছর" : "/ student / year"),
      subtitle: isBangla ? "সাধারণ ও মাঝারি স্কুলের জন্য সেরা" : "Ideal for standard high schools",
      features: [
        isBangla ? "সকল শিক্ষার্থী ও শিক্ষক" : "All Enrolled Students",
        isBangla ? "সকল ১৮টি সমন্বিত মডিউল" : "All 18 System Modules",
        isBangla ? "সেন্ট্রাল ওয়ালেট ও শিক্ষক বেতন" : "Central Wallet & Staff Payroll",
        isBangla ? "স্বয়ংক্রিয় এসএমএস গেটওয়ে" : "Automated SMS Integration",
        isBangla ? "দৈনিক ক্লাউড অটো-ব্যাকআপ" : "Daily Cloud Auto-Backups",
        isBangla ? "ফোন ও হোয়াটসঅ্যাপ সহায়তা" : "Phone & WhatsApp Support",
      ],
      cta: isBangla ? "এই প্যাকেজটি বেছে নিন" : "Select Standard Plan",
      popular: true,
    },
    {
      id: "enterprise",
      name: isBangla ? "মাল্টি-ব্রাঞ্চ এন্টারপ্রাইজ" : "Multi-Branch Network",
      price: billingCycle === "monthly" ? "৳5,000" : "৳50,000",
      period: billingCycle === "monthly" 
        ? (isBangla ? "/ ক্যাম্পাস / মাস" : "/ campus / mo") 
        : (isBangla ? "/ ক্যাম্পাস / বছর" : "/ campus / year"),
      subtitle: isBangla ? "বড় কলেজ ও একাধিক শাখার জন্য" : "For colleges & multi-campus trusts",
      features: [
        isBangla ? "আনলিমিটেড শিক্ষার্থী ধারণক্ষমতা" : "Unlimited Students",
        isBangla ? "সকল ১৮টি মডিউল + কাস্টমাইজেশন" : "All 18 Modules + Custom Workflows",
        isBangla ? "হোস্টেল ও বাস বহর পরিচালনা" : "Hostel & Transport Fleet",
        isBangla ? "ক্যাম্পাসে সরাসরি এসে ট্রেনিং" : "Dedicated On-site Staff Training",
        isBangla ? "ডেডিকেটেড একাউন্ট ম্যানেজার" : "Priority Account Manager",
        isBangla ? "কাস্টম ডোমেইন ও ব্র্যান্ডিং" : "Custom School Domain",
      ],
      cta: isBangla ? "এন্টারপ্রাইজ যোগাযোগ" : "Contact Enterprise Team",
      popular: false,
    },
  ];

  const featureMatrix = [
    { name: isBangla ? "শিক্ষার্থী ধারণক্ষমতা" : "Student Capacity", pilot: "100", standard: isBangla ? "আনলিমিটেড" : "Flexible", enterprise: isBangla ? "আনলিমিটেড" : "Unlimited" },
    { name: isBangla ? "শ্রেণি ও বিষয় সেটআপ" : "Academic Setup", pilot: true, standard: true, enterprise: true },
    { name: isBangla ? "ফি কাউন্টার ও মানি রিসিট" : "Fee Collection Receipts", pilot: true, standard: true, enterprise: true },
    { name: isBangla ? "পরীক্ষা ও জিপিএ ৫.০০ রেজাল্ট" : "Exam Marks & GPA 5.00", pilot: true, standard: true, enterprise: true },
    { name: isBangla ? "বায়োমেট্রিক হাজিরা ও এসএমএস" : "Biometric Attendance & SMS", pilot: false, standard: true, enterprise: true },
    { name: isBangla ? "শিক্ষক-কর্মচারী বেতন ও ভাউচার" : "Staff Payroll & Vouchers", pilot: false, standard: true, enterprise: true },
    { name: isBangla ? "সেন্ট্রাল ওয়ালেট অডিট" : "Central School Wallet", pilot: false, standard: true, enterprise: true },
    { name: isBangla ? "স্কুল বাস ও রুট পরিবহন" : "School Bus Transport", pilot: false, standard: true, enterprise: true },
    { name: isBangla ? "হোস্টেল ও সিট বরাদ্দ" : "Hostel & Dormitory", pilot: false, standard: true, enterprise: true },
    { name: isBangla ? "লাইব্রেরি ও বারকোড ট্র্যাকিং" : "Library & Circulation", pilot: false, standard: true, enterprise: true },
    { name: isBangla ? "আইডি কার্ড ও সনদপত্র তৈরি" : "ID Cards & Certificates", pilot: false, standard: true, enterprise: true },
    { name: isBangla ? "ক্যাম্পাসে সরাসরি ট্রেনিং" : "On-site Campus Training", pilot: false, standard: isBangla ? "অনলাইন" : "Online Live", enterprise: isBangla ? "ক্যাম্পাসে সশরীরে" : "In-Person On-Site" },
    { name: isBangla ? "ক্লাউড অটো-ব্যাকআপ" : "Daily Cloud Backups", pilot: true, standard: true, enterprise: true },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <PublicNavbar />

      {/* Header */}
      <Box sx={{ bgcolor: "#ffffff", borderBottom: "1px solid #e2e8f0", pt: { xs: 6, md: 9 }, pb: { xs: 5, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: "center" }}>
          <Chip 
            label={t('pricingPage.badge', 'Transparent Institutional Pricing')} 
            size="small" 
            sx={{ bgcolor: "rgba(29, 78, 216, 0.08)", color: "#1d4ed8", fontWeight: 700, mb: 2, px: 1 }} 
          />
          <Typography variant="h3" fontWeight="900" sx={{ color: "#0f172a", letterSpacing: -1, mb: 2, fontSize: { xs: "2rem", md: "2.75rem" } }}>
            {t('pricingPage.title', 'Fair, Predictable Plans with Zero Hidden Hardware Fees')}
          </Typography>
          <Typography variant="h6" sx={{ color: "#64748b", maxWidth: 820, mx: "auto", fontWeight: 400, lineHeight: 1.6, mb: 4 }}>
            {t('pricingPage.subtitle', 'Choose the plan that matches your school\'s size. All packages include daily cloud backups, teacher training, and dedicated human support in Dhaka.')}
          </Typography>

          {/* Billing Switch */}
          <Box sx={{ display: "inline-flex", alignItems: "center", bgcolor: "#f1f5f9", p: 0.6, borderRadius: 3 }}>
            <Button
              size="small"
              onClick={() => setBillingCycle("monthly")}
              sx={{
                borderRadius: 2.5,
                px: 2.5,
                py: 0.8,
                fontWeight: 700,
                textTransform: "none",
                bgcolor: billingCycle === "monthly" ? "#ffffff" : "transparent",
                color: billingCycle === "monthly" ? "#1d4ed8" : "#64748b",
                boxShadow: billingCycle === "monthly" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {t('pricingPage.monthlyToggle', 'Monthly Billing')}
            </Button>
            <Button
              size="small"
              onClick={() => setBillingCycle("yearly")}
              sx={{
                borderRadius: 2.5,
                px: 2.5,
                py: 0.8,
                fontWeight: 700,
                textTransform: "none",
                bgcolor: billingCycle === "yearly" ? "#ffffff" : "transparent",
                color: billingCycle === "yearly" ? "#16a34a" : "#64748b",
                boxShadow: billingCycle === "yearly" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {t('pricingPage.yearlyToggle', 'Yearly Billing (Save 2 Months Free)')}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Pricing Cards */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Grid container spacing={3.5} alignItems="stretch">
          {plans.map((p) => (
            <Grid item xs={12} md={4} key={p.id}>
              <Card 
                sx={{ 
                  height: "100%", 
                  borderRadius: 4, 
                  border: p.popular ? "2px solid #2563eb" : "1px solid #e2e8f0", 
                  boxShadow: p.popular ? "0 14px 30px -4px rgba(37, 99, 235, 0.18)" : "0 2px 10px rgba(15, 23, 42, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  bgcolor: "#ffffff"
                }}
              >
                {p.popular && (
                  <Chip 
                    label={isBangla ? "সর্বাধিক জনপ্রিয়" : "Most Popular"} 
                    color="primary" 
                    size="small" 
                    sx={{ 
                      position: "absolute", 
                      top: 16, 
                      right: 16, 
                      fontWeight: 800, 
                      bgcolor: "#2563eb" 
                    }} 
                  />
                )}

                <CardContent sx={{ p: 3.5, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: "#0f172a", mb: 0.5 }}>
                    {p.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2.5, display: "block" }}>
                    {p.subtitle}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 3 }}>
                    <Typography variant="h3" fontWeight="900" sx={{ color: "#0f172a" }}>
                      {p.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      {p.period}
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2.5 }} />

                  <Stack spacing={1.5} sx={{ mb: 4, flexGrow: 1 }}>
                    {p.features.map((feat, idx) => (
                      <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                        <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 18, mt: 0.3 }} />
                        <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.5 }}>
                          {feat}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>

                  <Button
                    variant={p.popular ? "contained" : "outlined"}
                    component={Link}
                    href="/contact"
                    fullWidth
                    size="large"
                    sx={{
                      borderRadius: 2.5,
                      py: 1.3,
                      textTransform: "none",
                      fontWeight: 700,
                      bgcolor: p.popular ? "#1d4ed8" : "transparent",
                      borderColor: p.popular ? "#1d4ed8" : "#cbd5e1",
                      "&:hover": {
                        bgcolor: p.popular ? "#1e40af" : "rgba(0,0,0,0.04)",
                        borderColor: "#1d4ed8"
                      }
                    }}
                  >
                    {p.cta}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Interactive ROI & Savings Calculator */}
        <Paper 
          sx={{ 
            mt: 8, 
            p: { xs: 3.5, md: 5 }, 
            bgcolor: "#ffffff", 
            borderRadius: 4, 
            border: "1px solid #cbd5e1",
            boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.06)"
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Chip 
              icon={<CalculateIcon sx={{ fontSize: 18 }} />}
              label={t('pricingPage.calcBadge', 'Live Investment Calculator')} 
              size="small" 
              sx={{ bgcolor: "rgba(22, 163, 74, 0.1)", color: "#16a34a", fontWeight: 700, mb: 1.5 }} 
            />
            <Typography variant="h4" fontWeight="bold" sx={{ color: "#0f172a", mb: 1 }}>
              {t('pricingPage.calcTitle', 'Calculate Your Monthly Investment & Cost Savings')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('pricingPage.calcSubtitle', 'Drag the slider to your estimated student headcount to see your exact fee and estimated monthly operational savings.')}
            </Typography>
          </Box>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1e293b" }}>
                    {t('pricingPage.calcSliderLabel', 'Active Students Enrolled in School')}:
                  </Typography>
                  <Chip 
                    label={`${studentCount} ${isBangla ? "শিক্ষার্থী" : "Students"}`} 
                    color="primary" 
                    sx={{ fontWeight: 800, fontSize: "0.95rem" }} 
                  />
                </Box>
                <Slider
                  value={studentCount}
                  min={100}
                  max={2500}
                  step={50}
                  onChange={(e, val) => setStudentCount(val)}
                  sx={{ color: "#1d4ed8", py: 2 }}
                />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">100 Students</Typography>
                  <Typography variant="caption" color="text.secondary">1,000 Students</Typography>
                  <Typography variant="caption" color="text.secondary">2,500+ Students</Typography>
                </Box>
              </Box>

              {/* Dynamic Cost Display */}
              <Box sx={{ p: 2.5, bgcolor: "#f8fafc", borderRadius: 3, border: "1px solid #e2e8f0" }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t('pricingPage.calcMonthlyFee', 'Monthly Subscription Fee')}
                    </Typography>
                    <Typography variant="h4" fontWeight="900" sx={{ color: "#1d4ed8" }}>
                      ৳{calculatedMonthly.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('pricingPage.calcPerStudentNote', 'Based on ৳10 / active student / month')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t('pricingPage.calcYearlyFee', 'Discounted Annual Billing')}
                    </Typography>
                    <Typography variant="h4" fontWeight="900" sx={{ color: "#16a34a" }}>
                      ৳{calculatedYearly.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 700 }}>
                      {isBangla ? "২ মাস সম্পূর্ণ ফ্রি (৳" + (calculatedMonthly * 2).toLocaleString() + " ছাড়)" : `Save 2 Months Free (৳${(calculatedMonthly * 2).toLocaleString()} savings)`}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Savings Column */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 3, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 3 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#15803d", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <SavingsIcon /> {t('pricingPage.savingsTitle', 'Estimated Monthly Savings for Your Campus')}
                </Typography>

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('pricingPage.savePaper', 'Paper Money Receipt Books & Registers Saved')}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: "#166534" }}>
                      {t('pricingPage.savePaperVal', '~৳3,500 / month')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('pricingPage.saveHours', 'Staff Hours Saved in Manual Calculations')}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: "#166534" }}>
                      {t('pricingPage.saveHoursVal', '40+ hours / month')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('pricingPage.saveLeak', 'Fee Leakage & Calculation Error Prevention')}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: "#166534" }}>
                      {t('pricingPage.saveLeakVal', '100% Reconciled')}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* Feature Comparison Matrix */}
        <Box sx={{ mt: 10 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: "#0f172a", mb: 1 }}>
              {t('pricingPage.matrixTitle', 'Detailed Plan Comparison Matrix')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('pricingPage.matrixSubtitle', 'Compare capabilities across each tier to find the right fit for your campus.')}
            </Typography>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none" }}>
            <Table>
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>{t('pricingPage.colFeature', 'Platform Capability')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>{t('pricingPage.colTrial', '14-Day Pilot')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: "#1d4ed8" }}>{t('pricingPage.colStandard', 'Standard (৳10/stu)')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>{t('pricingPage.colEnterprise', 'Enterprise')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {featureMatrix.map((row, idx) => (
                  <TableRow key={idx} sx={{ "&:nth-of-type(even)": { bgcolor: "#fcfdfe" } }}>
                    <TableCell sx={{ fontWeight: 600, color: "#334155" }}>{row.name}</TableCell>
                    <TableCell align="center">
                      {typeof row.pilot === "boolean" ? (
                        row.pilot ? <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 20 }} /> : <RemoveIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                      ) : (
                        <Typography variant="caption" fontWeight={600}>{row.pilot}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: "rgba(29, 78, 216, 0.02)" }}>
                      {typeof row.standard === "boolean" ? (
                        row.standard ? <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 20 }} /> : <RemoveIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                      ) : (
                        <Typography variant="caption" fontWeight={700} color="primary">{row.standard}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {typeof row.enterprise === "boolean" ? (
                        row.enterprise ? <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 20 }} /> : <RemoveIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                      ) : (
                        <Typography variant="caption" fontWeight={600}>{row.enterprise}</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Pricing FAQ */}
        <Box sx={{ mt: 10, maxWidth: 850, mx: "auto" }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a", mb: 3, textAlign: "center" }}>
            {t('pricingPage.faqTitle', 'Frequently Asked Questions About Pricing')}
          </Typography>

          <Stack spacing={2}>
            <Accordion sx={{ borderRadius: "12px !important", border: "1px solid #e2e8f0", boxShadow: "none", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1e293b" }}>
                  {t('pricingPage.faq1Q', 'Do you charge any upfront setup or installation fees?')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('pricingPage.faq1A', 'No! There are zero setup fees. We provide free account creation, free student data import from Excel, and initial staff training at no extra charge.')}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ borderRadius: "12px !important", border: "1px solid #e2e8f0", boxShadow: "none", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1e293b" }}>
                  {t('pricingPage.faq2Q', 'What payment methods are supported for our school subscription?')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('pricingPage.faq2A', 'We accept bKash Merchant payment, Nagad, direct Bank Account Wire Transfers, and Institutional Account Payee Cheques. Invoices are generated automatically with Tax/VAT details.')}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ borderRadius: "12px !important", border: "1px solid #e2e8f0", boxShadow: "none", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1e293b" }}>
                  {t('pricingPage.faq3Q', 'What happens during school vacation months (e.g., Ramadan or Summer)?')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('pricingPage.faq3A', 'Our annual plans include 2 months completely free, making it seamless and affordable to maintain consistent access for admissions and teacher payroll throughout the holidays.')}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Box>
      </Container>

      <PublicFooter />
    </Box>
  );
}
