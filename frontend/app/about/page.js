// frontend/app/about/page.js
"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";

import {
  Box, Container, Typography, Grid, Card, CardContent, Button,
  Chip, Stack, Paper, Divider, Avatar
} from "@mui/material";

// Icons
import SchoolIcon from '@mui/icons-material/School';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ShieldIcon from '@mui/icons-material/Shield';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GroupsIcon from '@mui/icons-material/Groups';

export default function AboutPage() {
  const { t, isBangla } = useLanguage();

  const principles = [
    {
      icon: <LightbulbIcon sx={{ fontSize: 28 }} />,
      title: t('aboutPage.p1Title', 'Zero Learning Curve for Staff'),
      desc: t('aboutPage.p1Desc', 'Teachers and staff shouldn\'t need weeks of training. If you can use a smartphone, you can master SMSCloud in 15 minutes.'),
    },
    {
      icon: <ShieldIcon sx={{ fontSize: 28 }} />,
      title: t('aboutPage.p2Title', '100% Data Sovereignty'),
      desc: t('aboutPage.p2Desc', 'Your school owns all of its records. Export complete student directories, fee collection logs, and marks sheets to Excel or PDF with one click at any time.'),
    },
    {
      icon: <SupportAgentIcon sx={{ fontSize: 28 }} />,
      title: t('aboutPage.p3Title', 'Direct Human Support'),
      desc: t('aboutPage.p3Desc', 'No robotic automated chatbots. Real human support engineers based in Banani, Dhaka are just a phone call or WhatsApp message away.'),
    },
    {
      icon: <LoyaltyIcon sx={{ fontSize: 28 }} />,
      title: t('aboutPage.p4Title', 'Fair & Transparent Pricing'),
      desc: t('aboutPage.p4Desc', 'Only pay for active enrolled students. Zero hidden activation fees, zero server maintenance surcharges, and zero lock-in contracts.'),
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <PublicNavbar />

      {/* Header */}
      <Box sx={{ bgcolor: "#ffffff", borderBottom: "1px solid #e2e8f0", pt: { xs: 6, md: 9 }, pb: { xs: 5, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: "center" }}>
          <Chip 
            icon={<SchoolIcon sx={{ fontSize: 16 }} />}
            label={t('aboutPage.badge', 'Our Story & Educational Mission')} 
            size="small" 
            sx={{ bgcolor: "rgba(29, 78, 216, 0.08)", color: "#1d4ed8", fontWeight: 700, mb: 2, px: 1 }} 
          />
          <Typography variant="h3" fontWeight="900" sx={{ color: "#0f172a", letterSpacing: -1, mb: 2, fontSize: { xs: "2rem", md: "2.75rem" } }}>
            {t('aboutPage.title', 'Built for Teachers, Administrators, and the Future of Education')}
          </Typography>
          <Typography variant="h6" sx={{ color: "#64748b", maxWidth: 820, mx: "auto", fontWeight: 400, lineHeight: 1.6 }}>
            {t('aboutPage.subtitle', 'We started SMSCloud to replace error-prone registers and scattered Excel files with an intuitive, reliable cloud platform that any school can run with confidence.')}
          </Typography>
        </Container>
      </Box>

      {/* Story Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, flexGrow: 1 }}>
        <Grid container spacing={5} alignItems="center">
          <Grid item xs={12} md={6}>
            <Chip 
              label={t('aboutPage.storyBadge', 'Our Origins')} 
              size="small" 
              sx={{ bgcolor: "#f1f5f9", color: "#334155", fontWeight: 700, mb: 2 }} 
            />
            <Typography variant="h4" fontWeight="bold" sx={{ color: "#0f172a", mb: 3 }}>
              {t('aboutPage.storyTitle', 'Why We Started SMSCloud')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2 }}>
              {t('aboutPage.storyP1')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2 }}>
              {t('aboutPage.storyP2')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {t('aboutPage.storyP3')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper 
              sx={{ 
                p: 4, 
                bgcolor: "#ffffff", 
                borderRadius: 4, 
                border: "1px solid #cbd5e1",
                boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.08)"
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" color="primary" sx={{ mb: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {t('aboutPage.statsTitle', 'Trusted Infrastructure by the Numbers')}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                    <Typography variant="h4" fontWeight="900" color="primary">280+</Typography>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {t('aboutPage.statStudents', 'Active Students Managed')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                    <Typography variant="h4" fontWeight="900" sx={{ color: "#16a34a" }}>18</Typography>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {t('aboutPage.statModules', 'Integrated Modules')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                    <Typography variant="h4" fontWeight="900" sx={{ color: "#0284c7" }}>99.9%</Typography>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {t('aboutPage.statUptime', 'Uptime Availability SLA')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                    <Typography variant="h4" fontWeight="900" sx={{ color: "#7c3aed" }}>100%</Typography>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {t('aboutPage.statBackup', 'Automated Off-site Backups')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* 4 Core Principles */}
        <Box sx={{ mt: 10 }}>
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Chip 
              label={t('aboutPage.principlesBadge', 'Our Core Principles')} 
              size="small" 
              sx={{ bgcolor: "rgba(29, 78, 216, 0.08)", color: "#1d4ed8", fontWeight: 700, mb: 1.5 }} 
            />
            <Typography variant="h4" fontWeight="bold" sx={{ color: "#0f172a" }}>
              {t('aboutPage.principlesTitle', 'The Values That Guide Every Feature We Build')}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {principles.map((p, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Card 
                  sx={{ 
                    height: "100%", 
                    borderRadius: 3.5, 
                    border: "1px solid #e2e8f0", 
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                    p: 2
                  }}
                >
                  <CardContent>
                    <Box 
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: 2.5, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        bgcolor: "rgba(29, 78, 216, 0.08)", 
                        color: "#1d4ed8",
                        mb: 2
                      }}
                    >
                      {p.icon}
                    </Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: "#0f172a", mb: 1 }}>
                      {p.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {p.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Physical Office & Visiting Invitation */}
        <Paper 
          sx={{ 
            mt: 10, 
            p: { xs: 3.5, md: 5 }, 
            bgcolor: "#ffffff", 
            borderRadius: 4, 
            border: "1px solid #cbd5e1",
            boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.06)"
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip 
                label={t('aboutPage.officeBadge', 'Physical Presence & Legitimacy')} 
                size="small" 
                sx={{ bgcolor: "#f1f5f9", color: "#334155", fontWeight: 700, mb: 1.5 }} 
              />
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a", mb: 1.5 }}>
                {t('aboutPage.officeTitle', 'Dhaka Engineering & Support Office')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>
                {t('aboutPage.officeDesc', 'We invite school directors, principals, and governing body members to visit our office or schedule an on-site consultation at your campus.')}
              </Typography>

              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <LocationOnIcon sx={{ color: "#1d4ed8", fontSize: 22 }} />
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#1e293b" }}>
                    {t('aboutPage.officeLocation')}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <PhoneInTalkIcon sx={{ color: "#1d4ed8", fontSize: 22 }} />
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#1e293b" }}>
                    {t('aboutPage.officePhone')}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <AccessTimeIcon sx={{ color: "#1d4ed8", fontSize: 22 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('aboutPage.officeHours')}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5} sx={{ textAlign: { xs: "left", md: "right" } }}>
              <Button
                variant="contained"
                component={Link}
                href="/contact"
                size="large"
                sx={{
                  bgcolor: "#1d4ed8",
                  color: "#ffffff",
                  fontWeight: 700,
                  px: 4,
                  py: 1.6,
                  borderRadius: 2.5,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#1e40af" }
                }}
              >
                {t('aboutPage.ctaDemoBtn', 'Schedule a School Campus Visit')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      <PublicFooter />
    </Box>
  );
}
