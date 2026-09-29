// frontend/app/contact/page.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";

import {
  Box, Container, Typography, Grid, Card, CardContent, Button,
  Chip, Stack, Paper, TextField, MenuItem, Alert, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Divider
} from "@mui/material";

// Icons
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

export default function ContactPage() {
  const { t, isBangla } = useLanguage();

  const [form, setForm] = useState({
    name: "",
    school_name: "",
    role: "Principal / Headmaster",
    phone: "",
    email: "",
    student_count: "500-1000",
    format: "online",
    message: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      await api.publicPost("/public/contact/", {
        name: form.name,
        school_name: form.school_name,
        email: form.email,
        phone: form.phone,
        topic: `Demo (${form.student_count} stu · ${form.format === "onsite" ? "In-Person Campus" : "Online"}) · ${form.role}`,
        message: form.message || `Preferred demo format: ${form.format}. Role: ${form.role}. Student count: ${form.student_count}`
      });

      setSuccess(true);
      setForm({
        name: "",
        school_name: "",
        role: "Principal / Headmaster",
        phone: "",
        email: "",
        student_count: "500-1000",
        format: "online",
        message: ""
      });
    } catch (err) {
      setError(err?.message || (isBangla ? "আবেদন পাঠানো সম্ভব হয়নি। অনুগ্রহ করে হোয়াটসঅ্যাপে সরাসরি যোগাযোগ করুন।" : "Could not submit inquiry. Please WhatsApp or call us directly."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <PublicNavbar />

      {/* Header */}
      <Box sx={{ bgcolor: "#ffffff", borderBottom: "1px solid #e2e8f0", pt: { xs: 6, md: 9 }, pb: { xs: 5, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: "center" }}>
          <Chip 
            icon={<SupportAgentIcon sx={{ fontSize: 16 }} />}
            label={t('contactPage.badge', 'Direct Contact & Demonstration')} 
            size="small" 
            sx={{ bgcolor: "rgba(29, 78, 216, 0.08)", color: "#1d4ed8", fontWeight: 700, mb: 2, px: 1 }} 
          />
          <Typography variant="h3" fontWeight="900" sx={{ color: "#0f172a", letterSpacing: -1, mb: 2, fontSize: { xs: "2rem", md: "2.75rem" } }}>
            {t('contactPage.title', 'We Are Ready to Help Your School Modernize')}
          </Typography>
          <Typography variant="h6" sx={{ color: "#64748b", maxWidth: 820, mx: "auto", fontWeight: 400, lineHeight: 1.6 }}>
            {t('contactPage.subtitle', 'Speak directly with our Dhaka technical team, schedule an on-site visit to your campus, or test a live guided demo.')}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, flexGrow: 1 }}>
        <Grid container spacing={4}>
          {/* Left Column: Direct Contact Details & WhatsApp */}
          <Grid item xs={12} md={5}>
            <Stack spacing={2.5}>
              {/* Phone Card */}
              <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)" }}>
                <CardContent sx={{ p: 3, display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "rgba(29, 78, 216, 0.08)", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <PhoneInTalkIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#0f172a" }}>
                      {t('contactPage.cardPhoneTitle', 'Dhaka Phone Support Hotline')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {t('contactPage.cardPhoneDesc', 'Speak directly with our team between 9:00 AM and 8:00 PM BST (Sat - Thu).')}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary">
                      {t('contactPage.cardPhoneNum', '+880 1700-000000 / +880 1800-000000')}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* WhatsApp Card */}
              <Card sx={{ borderRadius: 3, border: "1px solid #bbf7d0", bgcolor: "#f0fdf4", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)" }}>
                <CardContent sx={{ p: 3, display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "#22c55e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <WhatsAppIcon />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#166534" }}>
                      {t('contactPage.cardWhatsappTitle', 'Direct WhatsApp Line')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#15803d", mb: 1.5 }}>
                      {t('contactPage.cardWhatsappDesc', 'Fast replies within 15 minutes for quick queries, screenshots, and brochures.')}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<WhatsAppIcon />}
                      href="https://wa.me/8801700000000"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ bgcolor: "#16a34a", color: "#fff", fontWeight: 700, textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#15803d" } }}
                    >
                      {t('contactPage.cardWhatsappBtn', 'Chat on WhatsApp (+880 1700-000000)')}
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Email Card */}
              <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)" }}>
                <CardContent sx={{ p: 3, display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "rgba(29, 78, 216, 0.08)", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <EmailIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#0f172a" }}>
                      {t('contactPage.cardEmailTitle', 'Official Institutional Email')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {t('contactPage.cardEmailDesc', 'For formal board proposals, tender inquiries, and official school partnerships.')}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      support@smscloud.education
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Office Address Card */}
              <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)" }}>
                <CardContent sx={{ p: 3, display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "rgba(29, 78, 216, 0.08)", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LocationOnIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#0f172a" }}>
                      {t('contactPage.cardOfficeTitle', 'Banani Engineering Office')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {t('contactPage.cardOfficeDesc', 'House 42, Road 11, Block D, Banani Model Town, Dhaka - 1213, Bangladesh')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('contactPage.cardOfficeNote', 'In-person visits welcome by prior appointment.')}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Right Column: Demo Request Form */}
          <Grid item xs={12} md={7}>
            <Paper 
              sx={{ 
                p: { xs: 3, md: 5 }, 
                borderRadius: 4, 
                border: "1px solid #cbd5e1",
                boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.06)",
                bgcolor: "#ffffff"
              }}
            >
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a", mb: 0.5 }}>
                {t('contactPage.formTitle', 'Book a Guided 15-Minute School Demonstration')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('contactPage.formSubtitle', 'Fill out this simple form and an educational consultant will get in touch to schedule your demo.')}
              </Typography>

              {success && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  {t('contactPage.successMsg', 'Thank you! Your demo request has been received. Our team will contact you within a few hours to confirm your schedule.')}
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label={t('contactPage.fName', 'Your Full Name')}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label={t('contactPage.fSchool', 'School / College Name')}
                      value={form.school_name}
                      onChange={(e) => setForm({ ...form, school_name: e.target.value })}
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label={t('contactPage.fPhone', 'Mobile / WhatsApp Number')}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      type="email"
                      label={t('contactPage.fEmail', 'Official Email Address')}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label={t('contactPage.fStudents', 'Estimated Student Headcount')}
                      value={form.student_count}
                      onChange={(e) => setForm({ ...form, student_count: e.target.value })}
                      size="small"
                    >
                      <MenuItem value="Under 200">{isBangla ? "২০০ জনের কম" : "Under 200 Students"}</MenuItem>
                      <MenuItem value="200-500">{isBangla ? "২০০ - ৫০০ জন" : "200 - 500 Students"}</MenuItem>
                      <MenuItem value="500-1000">{isBangla ? "৫০০ - ১,০০০ জন" : "500 - 1,000 Students"}</MenuItem>
                      <MenuItem value="1000-2500">{isBangla ? "১,০০০ - ২,৫০০ জন" : "1,000 - 2,500 Students"}</MenuItem>
                      <MenuItem value="2500+">{isBangla ? "২,৫০০ জনের বেশি" : "2,500+ Students (Multi-Branch)"}</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label={t('contactPage.fFormat', 'Preferred Demo Format')}
                      value={form.format}
                      onChange={(e) => setForm({ ...form, format: e.target.value })}
                      size="small"
                    >
                      <MenuItem value="online">{t('contactPage.optOnline', 'Online Video Call (Google Meet / Zoom)')}</MenuItem>
                      <MenuItem value="onsite">{t('contactPage.optOnsite', 'In-Person Campus Visit (Dhaka & Surrounding)')}</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label={t('contactPage.fMessage', 'Any special requirements or questions?')}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={submitting}
                      startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                      sx={{
                        py: 1.4,
                        bgcolor: "#1d4ed8",
                        fontWeight: 700,
                        borderRadius: 2.5,
                        textTransform: "none",
                        fontSize: "1rem",
                        "&:hover": { bgcolor: "#1e40af" }
                      }}
                    >
                      {submitting ? t('contactPage.submittingBtn', 'Submitting Request...') : t('contactPage.submitBtn', 'Submit Demo Request')}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Onboarding FAQ */}
        <Box sx={{ mt: 10, maxWidth: 850, mx: "auto" }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a", mb: 3, textAlign: "center" }}>
            {t('contactPage.faqTitle', 'Common Questions Before Getting Started')}
          </Typography>

          <Stack spacing={2}>
            <Accordion sx={{ borderRadius: "12px !important", border: "1px solid #e2e8f0", boxShadow: "none", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1e293b" }}>
                  {t('contactPage.faq1Q', 'Can your team visit our campus to demonstrate the software to our Managing Committee?')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('contactPage.faq1A', 'Yes! For institutions located in Dhaka and nearby divisions, our educational consultants can visit your campus in person to present the software to your governing body.')}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ borderRadius: "12px !important", border: "1px solid #e2e8f0", boxShadow: "none", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1e293b" }}>
                  {t('contactPage.faq2Q', 'How quickly can our school go live after deciding to adopt?')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('contactPage.faq2A', 'Most schools go live within 24 to 48 hours. Once you share your student Excel list, we configure your classes, sections, and fee structures so your staff can start collecting fees and taking attendance immediately.')}
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
