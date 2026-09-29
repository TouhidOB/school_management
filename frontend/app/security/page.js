// frontend/app/security/page.js
"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";

import {
  Box, Container, Typography, Grid, Card, CardContent, Button,
  Chip, Stack, Paper, Accordion, AccordionSummary, AccordionDetails, Divider
} from "@mui/material";

// Icons
import ShieldIcon from '@mui/icons-material/Shield';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import LockIcon from '@mui/icons-material/Lock';
import StorageIcon from '@mui/icons-material/Storage';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SpeedIcon from '@mui/icons-material/Speed';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

export default function SecurityPage() {
  const { t, isBangla } = useLanguage();

  const securityPillars = [
    {
      id: "pillar1",
      icon: <StorageIcon sx={{ fontSize: 32 }} />,
      badge: t('securityPage.pillar1Badge', 'Strict Tenant Separation'),
      title: t('securityPage.pillar1Title', 'Multi-Tenant Database Isolation'),
      desc: t('securityPage.pillar1Desc', 'Every school on SMSCloud operates in strict logical data isolation. Teachers and administrators from School A can never view, query, or access records belonging to School B.'),
    },
    {
      id: "pillar2",
      icon: <CloudDoneIcon sx={{ fontSize: 32 }} />,
      badge: t('securityPage.pillar2Badge', 'Zero Data Loss Guarantee'),
      title: t('securityPage.pillar2Title', 'Daily Automated Cloud Backups'),
      desc: t('securityPage.pillar2Desc', 'All school databases are backed up automatically every night to geographically distributed, encrypted off-site cloud storage. Point-in-time recovery ensures no record is ever lost.'),
    },
    {
      id: "pillar3",
      icon: <LockIcon sx={{ fontSize: 32 }} />,
      badge: t('securityPage.pillar3Badge', 'Granular Permissions'),
      title: t('securityPage.pillar3Title', 'Role-Based Access Control (RBAC)'),
      desc: t('securityPage.pillar3Desc', 'Strict permission guardrails prevent unauthorized actions. Teachers only see their classes; accountants only see financial fees; students cannot alter marks; and Superadmins maintain audit logs.'),
    },
    {
      id: "pillar4",
      icon: <HistoryEduIcon sx={{ fontSize: 32 }} />,
      badge: t('securityPage.pillar4Badge', 'Tamper-Proof Accounting'),
      title: t('securityPage.pillar4Title', 'Financial Immutability & Audit Trail'),
      desc: t('securityPage.pillar4Desc', 'Every money receipt generated and teacher salary disbursed creates a permanent ledger entry with timestamp, user ID, and cash counter identification. Eliminates fee leakage.'),
    },
    {
      id: "pillar5",
      icon: <FileDownloadIcon sx={{ fontSize: 32 }} />,
      badge: t('securityPage.pillar5Badge', 'No Vendor Lock-in'),
      title: t('securityPage.pillar5Title', '100% Data Sovereignty & Portability'),
      desc: t('securityPage.pillar5Desc', 'Your school retains unconditional ownership of all records. You can export complete student databases, fee collection archives, and mark sheets to Excel, CSV, or PDF whenever you choose.'),
    },
    {
      id: "pillar6",
      icon: <SpeedIcon sx={{ fontSize: 32 }} />,
      badge: t('securityPage.pillar6Badge', '99.9% Cloud SLA'),
      title: t('securityPage.pillar6Title', '99.9% High Availability SLA'),
      desc: t('securityPage.pillar6Desc', 'Hosted on resilient cloud infrastructure with automated health monitoring, SSL encryption in transit (HTTPS), and zero downtime deployments.'),
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <PublicNavbar />

      {/* Header */}
      <Box sx={{ bgcolor: "#ffffff", borderBottom: "1px solid #e2e8f0", pt: { xs: 6, md: 9 }, pb: { xs: 5, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: "center" }}>
          <Chip 
            icon={<ShieldIcon sx={{ fontSize: 16 }} />}
            label={t('securityPage.badge', 'Institutional Trust & Protection')} 
            size="small" 
            sx={{ bgcolor: "rgba(22, 163, 74, 0.1)", color: "#15803d", fontWeight: 700, mb: 2, px: 1 }} 
          />
          <Typography variant="h3" fontWeight="900" sx={{ color: "#0f172a", letterSpacing: -1, mb: 2, fontSize: { xs: "2rem", md: "2.75rem" } }}>
            {t('securityPage.title', 'Enterprise Security Built for School Boards & Principals')}
          </Typography>
          <Typography variant="h6" sx={{ color: "#64748b", maxWidth: 820, mx: "auto", fontWeight: 400, lineHeight: 1.6 }}>
            {t('securityPage.subtitle', 'We understand that your student records, examination marks, and financial cash ledgers represent decades of institutional trust. Here is how SMSCloud keeps them completely safe.')}
          </Typography>
        </Container>
      </Box>

      {/* Security Pillars */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, flexGrow: 1 }}>
        <Grid container spacing={3.5}>
          {securityPillars.map((pillar) => (
            <Grid item xs={12} md={4} key={pillar.id}>
              <Card 
                sx={{ 
                  height: "100%", 
                  borderRadius: 3.5, 
                  border: "1px solid #e2e8f0", 
                  boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
                  p: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 14px 28px -4px rgba(15, 23, 42, 0.08)",
                    borderColor: "#cbd5e1"
                  }
                }}
              >
                <CardContent sx={{ p: 2.5, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                    <Box 
                      sx={{ 
                        width: 52, 
                        height: 52, 
                        borderRadius: 3, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        bgcolor: "rgba(29, 78, 216, 0.08)", 
                        color: "#1d4ed8" 
                      }}
                    >
                      {pillar.icon}
                    </Box>
                    <Chip 
                      label={pillar.badge} 
                      size="small" 
                      sx={{ bgcolor: "#f1f5f9", color: "#334155", fontWeight: 700, fontSize: "0.72rem" }} 
                    />
                  </Box>

                  <Typography variant="h6" fontWeight="bold" sx={{ color: "#0f172a", mb: 1.5, fontSize: "1.1rem" }}>
                    {pillar.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, flexGrow: 1 }}>
                    {pillar.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Institutional Verification Box */}
        <Paper 
          sx={{ 
            mt: 7, 
            p: { xs: 3, md: 5 }, 
            bgcolor: "#ffffff", 
            borderRadius: 3.5, 
            border: "1px solid #cbd5e1",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.06)"
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <VerifiedUserIcon sx={{ color: "#16a34a", fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a" }}>
                  {isBangla ? "ডেটা প্রাইভেসি ও আইনি নিরাপত্তা প্রতিশ্রুতি" : "Data Privacy & Institutional Compliance Commitment"}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2 }}>
                {isBangla
                  ? "আপনার প্রতিষ্ঠানের কোনো তথ্য কখনো তৃতীয় পক্ষের কাছে বিক্রয় বা কোনো বাণিজ্যিক বিজ্ঞাপনের জন্য ব্যবহৃত হবে না। আপনার স্কুলের ডেটাবেজ কেবল আপনার অনুমোদিত শিক্ষক ও কর্মকর্তাদের ব্যবহারের জন্যই সুরক্ষিত রাখা হয়।"
                  : "Under no circumstances are student phone numbers, marks, or financial records shared with third parties or advertisers. Your institutional database is operated strictly in service of your educational management."}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 18 }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#334155" }}>
                    {isBangla ? "২৪/৭ ক্লাউড অটো-মনিটরিং" : "24/7 Automated Monitoring"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 18 }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#334155" }}>
                    {isBangla ? "পোস্টগ্রেএসকিউএল এনক্রিপ্টেড ব্যাকআপ" : "PostgreSQL Encrypted Backups"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 18 }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#334155" }}>
                    {isBangla ? "জিরো ভেন্ডর লক-ইন" : "Zero Vendor Lock-in"}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: "left", md: "right" } }}>
              <Button
                variant="contained"
                component={Link}
                href="/contact"
                size="large"
                sx={{
                  bgcolor: "#1d4ed8",
                  color: "#ffffff",
                  fontWeight: 700,
                  px: 3.5,
                  py: 1.4,
                  borderRadius: 2.5,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#1e40af" }
                }}
              >
                {t('securityPage.ctaBtn', 'Talk to Our Security Specialists')}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Security FAQ */}
        <Box sx={{ mt: 8, maxWidth: 850, mx: "auto" }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a", mb: 3, textAlign: "center" }}>
            {t('securityPage.faqTitle', 'Security & Compliance Questions')}
          </Typography>

          <Stack spacing={2}>
            <Accordion sx={{ borderRadius: "12px !important", border: "1px solid #e2e8f0", boxShadow: "none", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1e293b" }}>
                  {t('securityPage.faq1Q', 'What happens if our school decides to leave the platform?')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('securityPage.faq1A', 'You can download all your student records, parent contacts, financial transaction history, and exam results in standard Excel/CSV spreadsheets at any time. We do not hold your data hostage.')}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ borderRadius: "12px !important", border: "1px solid #e2e8f0", boxShadow: "none", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1e293b" }}>
                  {t('securityPage.faq2Q', 'Can an accountant alter past fee receipts without notice?')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('securityPage.faq2A', 'No. All financial transactions write permanent records in the central ledger with user timestamps and receipt numbers. Any adjustments require supervisor authorization.')}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ borderRadius: "12px !important", border: "1px solid #e2e8f0", boxShadow: "none", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1e293b" }}>
                  {t('securityPage.faq3Q', 'Is student personal data shared with third parties or advertisers?')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('securityPage.faq3A', 'Never. We do not monetize student data or run advertisements. Your institutional data is strictly used to power your school management system.')}
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
