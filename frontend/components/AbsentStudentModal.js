"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonIcon from "@mui/icons-material/Person";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ChatIcon from "@mui/icons-material/Chat";
import BadgeIcon from "@mui/icons-material/Badge";

export default function AbsentStudentModal({ open, onClose, studentId, date, initialData }) {
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

  useEffect(() => {
    if (!open) {
      setCopyFeedback("");
      return;
    }

    if (initialData && initialData.student_id === studentId) {
      setData(initialData);
      return;
    }

    if (studentId) {
      setLoading(true);
      const queryDate = date || new Date().toISOString().slice(0, 10);
      api
        .get(`/student-attendance/student-month-summary/?student_id=${studentId}&date=${queryDate}`)
        .then((res) => setData(res))
        .catch((err) => {
          console.error("Failed to load student attendance summary:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [open, studentId, date, initialData]);

  if (!open) return null;

  const stats = data?.monthly_stats || {};
  const rate = stats.attendance_rate ?? 100;
  const rateColor = rate >= 80 ? "success" : rate >= 65 ? "warning" : "error";

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(`${label} copied to clipboard!`);
    setTimeout(() => setCopyFeedback(""), 2500);
  };

  const getSmsTemplate = () => {
    if (!data) return "";
    const attDate = data.attendance_date || date || new Date().toISOString().slice(0, 10);
    return `Dear Parent, your child ${data.full_name} (Roll: ${data.roll_number || "—"}, Class: ${data.class_name}) was marked absent on ${attDate}. Please contact the school office.`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonIcon color="error" />
          <Typography variant="h6" fontWeight="bold">
            Absent Student & Parent Follow-up
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, gap: 2 }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">Loading student details and attendance analytics…</Typography>
          </Box>
        ) : !data ? (
          <Alert severity="warning">Student information could not be retrieved.</Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {copyFeedback && (
              <Alert severity="success" sx={{ py: 0.5 }}>
                {copyFeedback}
              </Alert>
            )}

            {/* Student Header Summary */}
            <Card variant="outlined" sx={{ bgcolor: "background.paper", borderColor: "divider" }}>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box sx={{ display: "flex", gap: 2.5, alignItems: "center", flexWrap: "wrap" }}>
                  <Avatar
                    src={data.photo || undefined}
                    sx={{ width: 68, height: 68, bgcolor: "primary.main", fontSize: "1.6rem", fontWeight: 700 }}
                  >
                    {data.full_name?.charAt(0) || "S"}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="h6" fontWeight="bold">
                        {data.full_name}
                      </Typography>
                      <Chip
                        label="Absent Today"
                        size="small"
                        color="error"
                        icon={<CancelOutlinedIcon />}
                        sx={{ fontWeight: 600 }}
                      />
                      {stats.consecutive_absent >= 2 && (
                        <Chip
                          label={`🚨 ${stats.consecutive_absent} Days Streak`}
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, mt: 0.8, color: "text.secondary", flexWrap: "wrap", fontSize: "0.875rem" }}>
                      <span><strong>Class:</strong> {data.class_name}</span>
                      <span><strong>Section:</strong> {data.section_name}</span>
                      <span><strong>Roll:</strong> #{data.roll_number || "—"}</span>
                      <span><strong>Admission No:</strong> {data.admission_number}</span>
                      {data.blood_group && <span><strong>Blood Group:</strong> {data.blood_group}</span>}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* High Priority Consecutive Absence Warning */}
            {stats.consecutive_absent >= 2 && (
              <Alert severity="error" icon={<WarningAmberIcon fontSize="inherit" />}>
                <strong>Attention Management:</strong> This student has been absent for{" "}
                <strong>{stats.consecutive_absent} consecutive days</strong>. Please reach out to their primary
                guardian to record the reason for absence.
              </Alert>
            )}

            {/* Two Columns: Contact & Parent Info | Monthly Attendance Analytics */}
            <Grid container spacing={2.5}>
              {/* Column 1: Parent & Contact Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                      <PhoneIcon color="primary" fontSize="small" />
                      Parent & Contact Information
                    </Typography>

                    {/* Primary Contact Action */}
                    {data.primary_phone ? (
                      <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1.5, mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                            Primary Contact ({data.primary_relation || "Guardian"})
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" color="primary.main">
                            {data.primary_guardian_name ? `${data.primary_guardian_name}: ` : ""}
                            {data.primary_phone}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            component="a"
                            href={`tel:${data.primary_phone}`}
                            startIcon={<PhoneIcon fontSize="small" />}
                          >
                            Call
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(data.primary_phone, "Phone number")}
                            title="Copy Phone"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <Alert severity="warning" sx={{ mb: 2, py: 0.5 }}>
                        No primary phone number on record for this student.
                      </Alert>
                    )}

                    {/* All Registered Guardians */}
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                      Guardian Registry:
                    </Typography>
                    {data.guardians && data.guardians.length > 0 ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {data.guardians.map((g) => (
                          <Box
                            key={g.id}
                            sx={{
                              p: 1.2,
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 1,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {g.name}
                                </Typography>
                                <Chip
                                  label={g.relation_display || g.relation}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: "0.7rem", height: 20, textTransform: "capitalize" }}
                                />
                                {g.is_primary_contact && (
                                  <Chip label="Primary" size="small" color="primary" sx={{ fontSize: "0.68rem", height: 18 }} />
                                )}
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {g.occupation ? `${g.occupation} • ` : ""}Phone: {g.phone || "Not provided"}
                              </Typography>
                            </Box>
                            {g.phone && (
                              <IconButton
                                size="small"
                                color="success"
                                component="a"
                                href={`tel:${g.phone}`}
                                title={`Call ${g.name}`}
                              >
                                <PhoneIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No guardian entries recorded.
                      </Typography>
                    )}

                    {/* Student Emergency Contact */}
                    {data.emergency_contact && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Emergency Contact (Direct):
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {data.emergency_contact}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Address Section */}
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                      <HomeIcon fontSize="small" color="action" />
                      Address Details
                    </Typography>
                    <Box sx={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: 0.8 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Present Address:
                        </Typography>
                        <Typography variant="body2">{data.full_present_address || "—"}</Typography>
                      </Box>
                      {data.full_perm_address && data.full_perm_address !== "—" && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Permanent Address:
                          </Typography>
                          <Typography variant="body2">{data.full_perm_address}</Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Column 2: Total Attendance of This Month */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarMonthIcon color="primary" fontSize="small" />
                      Attendance This Month ({stats.month || "Current Month"})
                    </Typography>

                    {/* 4 Stat KPIs */}
                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1.5, textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary">
                            Working Days
                          </Typography>
                          <Typography variant="h5" fontWeight="bold">
                            {stats.total_working_days ?? 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ p: 1.5, bgcolor: "success.light", color: "success.contrastText", borderRadius: 1.5, textAlign: "center", opacity: 0.9 }}>
                          <Typography variant="caption" sx={{ color: "rgba(0,0,0,0.7)", fontWeight: 600 }}>
                            Days Present
                          </Typography>
                          <Typography variant="h5" fontWeight="bold" sx={{ color: "success.dark" }}>
                            {stats.present_count ?? 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ p: 1.5, bgcolor: "error.light", borderRadius: 1.5, textAlign: "center" }}>
                          <Typography variant="caption" sx={{ color: "rgba(0,0,0,0.7)", fontWeight: 600 }}>
                            Days Absent
                          </Typography>
                          <Typography variant="h5" fontWeight="bold" sx={{ color: "error.dark" }}>
                            {stats.absent_count ?? 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1.5, textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary">
                            Attendance Rate
                          </Typography>
                          <Typography variant="h5" fontWeight="bold" color={`${rateColor}.main`}>
                            {rate}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 2.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Monthly Attendance Ratio
                        </Typography>
                        <Typography variant="caption" fontWeight="bold" color={`${rateColor}.main`}>
                          {stats.present_count || 0} / {stats.total_working_days || 0} Days
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, Math.max(0, rate))}
                        color={rateColor}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Daily Logs in Current Month */}
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                      Day-by-Day Log ({stats.recent_logs?.length || 0} records):
                    </Typography>
                    {stats.recent_logs && stats.recent_logs.length > 0 ? (
                      <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", maxHeight: 130, overflowY: "auto", p: 0.5 }}>
                        {stats.recent_logs.map((log, idx) => (
                          <Tooltip key={idx} title={`${log.date}: ${log.status.toUpperCase()}`}>
                            <Chip
                              label={`${log.date.slice(8)}`}
                              size="small"
                              color={
                                log.status === "present"
                                  ? "success"
                                  : log.status === "absent"
                                  ? "error"
                                  : log.status === "late"
                                  ? "warning"
                                  : "default"
                              }
                              variant={log.status === "absent" ? "filled" : "outlined"}
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: log.status === "absent" ? 700 : 500,
                                minWidth: 32,
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No prior attendance records found for this month.
                      </Typography>
                    )}

                    {/* Quick SMS Notification Template */}
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Typography variant="caption" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <ChatIcon fontSize="inherit" color="action" /> Parent Absentee SMS Notice
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<ContentCopyIcon fontSize="small" />}
                          onClick={() => copyToClipboard(getSmsTemplate(), "SMS text")}
                        >
                          Copy SMS
                        </Button>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontStyle: "italic" }}>
                        "{getSmsTemplate()}"
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        {data?.primary_phone ? (
          <Button
            variant="outlined"
            color="success"
            startIcon={<PhoneIcon />}
            component="a"
            href={`tel:${data.primary_phone}`}
          >
            Call {data.primary_relation || "Parent"} ({data.primary_phone})
          </Button>
        ) : (
          <Box />
        )}
        <Button onClick={onClose} variant="contained" color="inherit">
          Close Desk
        </Button>
      </DialogActions>
    </Dialog>
  );
}
