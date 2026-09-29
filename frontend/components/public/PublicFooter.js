// frontend/components/public/PublicFooter.js
"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Box, Container, Typography, Grid, Stack, Divider, Avatar, Button, Chip 
} from "@mui/material";

import SchoolIcon from '@mui/icons-material/School';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ShieldIcon from '@mui/icons-material/Shield';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import LockIcon from '@mui/icons-material/Lock';

export default function PublicFooter() {
  const { t, isBangla } = useLanguage();

  return (
    <Box 
      component="footer"
      sx={{ 
        bgcolor: "#0f172a", 
        color: "#f8fafc", 
        pt: { xs: 7, md: 9 }, 
        pb: 5,
        borderTop: "1px solid #1e293b"
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Brand Info & Mission */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Avatar sx={{ bgcolor: "#2563eb", width: 42, height: 42 }}>
                <SchoolIcon sx={{ color: "#fff", fontSize: 24 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="900" sx={{ letterSpacing: -0.5, color: "#fff", lineHeight: 1 }}>
                  SMS<span style={{ color: "#60a5fa" }}>Cloud</span>
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.72rem", fontWeight: 600 }}>
                  {t('landing.brandTag', 'The Operating System for Schools')}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ color: "#94a3b8", lineHeight: 1.7, mb: 3, pr: { md: 3 } }}>
              {t('landing.footerTagline', 'The trusted educational management platform for schools, colleges, and madrasahs across Bangladesh and beyond.')}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              <Chip 
                icon={<CloudDoneIcon sx={{ color: "#38bdf8 !important", fontSize: 16 }} />} 
                label={isBangla ? "দৈনিক অটো-ব্যাকআপ" : "Daily Backups"} 
                size="small" 
                sx={{ bgcolor: "#1e293b", color: "#e2e8f0", fontSize: "0.75rem" }} 
              />
              <Chip 
                icon={<ShieldIcon sx={{ color: "#4ade80 !important", fontSize: 16 }} />} 
                label={isBangla ? "৯৯.৯% আপটাইম" : "99.9% Uptime"} 
                size="small" 
                sx={{ bgcolor: "#1e293b", color: "#e2e8f0", fontSize: "0.75rem" }} 
              />
            </Stack>

            <Button
              variant="outlined"
              size="small"
              startIcon={<WhatsAppIcon sx={{ color: "#22c55e" }} />}
              href="https://wa.me/8801700000000"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                borderColor: "#334155",
                color: "#e2e8f0",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                "&:hover": { borderColor: "#22c55e", bgcolor: "rgba(34, 197, 94, 0.08)" }
              }}
            >
              {isBangla ? "হোয়াটসঅ্যাপ সাপোর্ট" : "WhatsApp Direct Support"}
            </Button>
          </Grid>

          {/* Quick Platform Links */}
          <Grid item xs={6} sm={4} md={2.5}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: "#ffffff", mb: 2.5, letterSpacing: 0.5, textTransform: "uppercase", fontSize: "0.8rem" }}>
              {isBangla ? "প্ল্যাটফর্ম লিংক" : "Platform Links"}
            </Typography>
            <Stack spacing={1.5}>
              <Typography component={Link} href="/" variant="body2" sx={{ color: "#94a3b8", textDecoration: "none", "&:hover": { color: "#60a5fa" } }}>
                {t('nav.home', 'Home')}
              </Typography>
              <Typography component={Link} href="/features" variant="body2" sx={{ color: "#94a3b8", textDecoration: "none", "&:hover": { color: "#60a5fa" } }}>
                {t('nav.features', '18 Modules & Features')}
              </Typography>
              <Typography component={Link} href="/security" variant="body2" sx={{ color: "#94a3b8", textDecoration: "none", "&:hover": { color: "#60a5fa" } }}>
                {t('nav.security', 'Security & Compliance')}
              </Typography>
              <Typography component={Link} href="/pricing" variant="body2" sx={{ color: "#94a3b8", textDecoration: "none", "&:hover": { color: "#60a5fa" } }}>
                {t('nav.pricing', 'Pricing & ROI')}
              </Typography>
              <Typography component={Link} href="/about" variant="body2" sx={{ color: "#94a3b8", textDecoration: "none", "&:hover": { color: "#60a5fa" } }}>
                {t('nav.about', 'About Us & Mission')}
              </Typography>
              <Typography component={Link} href="/contact" variant="body2" sx={{ color: "#94a3b8", textDecoration: "none", "&:hover": { color: "#60a5fa" } }}>
                {t('nav.contact', 'Contact & Book Demo')}
              </Typography>
            </Stack>
          </Grid>

          {/* Core Modules Directory */}
          <Grid item xs={6} sm={4} md={2.5}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: "#ffffff", mb: 2.5, letterSpacing: 0.5, textTransform: "uppercase", fontSize: "0.8rem" }}>
              {t('landing.footerCol1', 'Popular Modules')}
            </Typography>
            <Stack spacing={1.5}>
              <Typography component={Link} href="/features" variant="body2" sx={{ color: "#94a3b8", textDecoration: "none", "&:hover": { color: "#60a5fa" } }}>
                {isBangla ? "ফি আদায় ও সেন্ট্রাল ওয়ালেট" : "Fees & Central Wallet"}
              </Typography>
              <Typography component={Link} href="/features" variant="body2" sx={{ color: "#94a3b8", textDecoration: "none", "&:hover": { color: "#60a5fa" } }}>
                {isBangla ? "পরীক্ষা ও জিপিএ ৫.০০ মার্কশিট" : "Exams & GPA 5.00 Marksheet"}
              </Typography>
              <Typography component={Link} href="/features" variant="body2" sx={{ color: "#94a3b8", textDecoration: "none", "&:hover": { color: "#60a5fa" } }}>
                {isBangla ? "বায়োমেট্রিক ও দৈনিক হাজিরা" : "Biometric Daily Attendance"}
              </Typography>
              <Typography component={Link} href="/features" variant="body2" sx={{ color: "#94a3b8", textDecoration: "none", "&:hover": { color: "#60a5fa" } }}>
                {isBangla ? "শিক্ষক-কর্মচারী মাসিক বেতন" : "Staff Monthly Payroll"}
              </Typography>
              <Typography component={Link} href="/features" variant="body2" sx={{ color: "#94a3b8", textDecoration: "none", "&:hover": { color: "#60a5fa" } }}>
                {isBangla ? "আইডি কার্ড ও প্রশংসাপত্র প্রিন্ট" : "Student ID Cards & Certificates"}
              </Typography>
              <Typography component={Link} href="/features" variant="body2" sx={{ color: "#94a3b8", textDecoration: "none", "&:hover": { color: "#60a5fa" } }}>
                {isBangla ? "স্কুল বাস ও পরিবহন বহর" : "School Bus Transport Fleet"}
              </Typography>
            </Stack>
          </Grid>

          {/* Dhaka Headquarters & Legitimacy */}
          <Grid item xs={12} sm={4} md={3}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: "#ffffff", mb: 2.5, letterSpacing: 0.5, textTransform: "uppercase", fontSize: "0.8rem" }}>
              {isBangla ? "যোগাযোগ ও প্রধান অফিস" : "Contact & Headquarters"}
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <LocationOnIcon sx={{ color: "#60a5fa", fontSize: 20, mt: 0.2 }} />
                <Typography variant="caption" sx={{ color: "#94a3b8", lineHeight: 1.6 }}>
                  {isBangla 
                    ? "বাড়ি ৪২, রোড ১১, ব্লক ডি, বনানী মডেল টাউন, ঢাকা - ১২১৩, বাংলাদেশ"
                    : "House 42, Road 11, Block D, Banani Model Town, Dhaka - 1213, Bangladesh"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <PhoneInTalkIcon sx={{ color: "#60a5fa", fontSize: 20 }} />
                <Typography variant="caption" sx={{ color: "#e2e8f0", fontWeight: 600 }}>
                  +880 1700-000000 / +880 1800-000000
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <EmailIcon sx={{ color: "#60a5fa", fontSize: 20 }} />
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  support@smscloud.education
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LockIcon sx={{ color: "#22c55e", fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  {isBangla ? "২৫৬-বিট এনক্রিপশন ও সিকিউর এসএসএল" : "256-bit SSL Data Encryption"}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: "#1e293b", my: 3 }} />

        {/* Bottom Bar */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            © {new Date().getFullYear()} SMSCloud Education. {t('landing.footerCopy', 'Crafted for educators with care.')}
          </Typography>

          <Stack direction="row" spacing={3}>
            <Typography component={Link} href="/security" variant="caption" sx={{ color: "#64748b", textDecoration: "none", "&:hover": { color: "#94a3b8" } }}>
              {isBangla ? "প্রাইভেসি ও সিকিউরিটি" : "Privacy & Security"}
            </Typography>
            <Typography component={Link} href="/pricing" variant="caption" sx={{ color: "#64748b", textDecoration: "none", "&:hover": { color: "#94a3b8" } }}>
              {isBangla ? "টার্মস অব সার্ভিস" : "Terms of Service"}
            </Typography>
            <Typography component={Link} href="/contact" variant="caption" sx={{ color: "#64748b", textDecoration: "none", "&:hover": { color: "#94a3b8" } }}>
              {isBangla ? "সহায়তা কেন্দ্র" : "Support Desk"}
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
