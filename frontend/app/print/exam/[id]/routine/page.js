"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import PrintFrame from "@/components/PrintFrame";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Divider, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Stack, Grid
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";

function formatDate(dateStr) {
  if (!dateStr) return { dateFormatted: "—", dayName: "" };
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    const dateFormatted = d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    return { dateFormatted, dayName };
  } catch {
    return { dateFormatted: dateStr, dayName: "" };
  }
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

function formatTimeRange(startStr, endStr) {
  if (!startStr) return "—";
  const s = formatTime(startStr);
  const e = endStr ? formatTime(endStr) : "";
  return e ? `${s} – ${e}` : s;
}

export default function ExamRoutinePage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const initialClass = searchParams.get("class") || "";

  const [session, setSession] = useState(null);
  const [rows, setRows] = useState([]);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter state (UI only, hidden on print)
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [viewMode, setViewMode] = useState("by_class"); // "by_class" | "all_together"

  useEffect(() => {
    Promise.all([
      api.get(`/exam-sessions/${id}/`).then(setSession),
      api.get(`/exam-sessions/${id}/routine/`).then(setRows),
      api.get("/school/").then(setSchool)
    ])
      .catch((err) => console.error("Error loading routine:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const primaryColor = school?.primary_color || "#1e3a8a";

  // Distinct classes in the routine
  const uniqueClasses = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      if (r.school_class && r.class_name) {
        map.set(String(r.school_class), r.class_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!selectedClass) return rows;
    return rows.filter((r) => String(r.school_class) === String(selectedClass) || r.class_name === selectedClass);
  }, [rows, selectedClass]);

  // Grouped by class
  const classGroups = useMemo(() => {
    const groups = {};
    filteredRows.forEach((r) => {
      const cName = r.class_name || "General";
      if (!groups[cName]) groups[cName] = [];
      groups[cName].push(r);
    });
    return Object.entries(groups).map(([className, items]) => ({
      className,
      items: items.sort((a, b) => (a.exam_date || "").localeCompare(b.exam_date || "") || (a.start_time || "").localeCompare(b.start_time || ""))
    }));
  }, [filteredRows]);

  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  const selectedClassName = uniqueClasses.find((c) => String(c.id) === String(selectedClass) || c.name === selectedClass)?.name;

  return (
    <PrintFrame title={`Exam Routine — ${session?.name || "Schedule"}`}>
      {/* Screen Controls Toolbar (hidden on print) */}
      <Box
        className="print-toolbar-filter"
        sx={{
          width: "100%",
          maxWidth: 820,
          bgcolor: "#ffffff",
          p: 2,
          mb: 3,
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          "@media print": { display: "none !important" },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" fontWeight="bold" color="text.secondary">
            Filter View:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Select Class</InputLabel>
            <Select
              value={selectedClass}
              label="Select Class"
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <MenuItem value=""><em>All Classes</em></MenuItem>
              {uniqueClasses.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Layout Mode</InputLabel>
            <Select
              value={viewMode}
              label="Layout Mode"
              onChange={(e) => setViewMode(e.target.value)}
            >
              <MenuItem value="by_class">Grouped by Class</MenuItem>
              <MenuItem value="all_together">Consolidated Table</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Chip
          label={`${filteredRows.length} Scheduled Exam(s)`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: "bold" }}
        />
      </Box>

      {/* Main Printable Document Container */}
      <Box
        className="print-doc"
        sx={{
          width: "100%",
          maxWidth: "210mm", // Standard A4 Width
          minHeight: "297mm", // Standard A4 Height
          bgcolor: "#ffffff",
          p: 4,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          borderRadius: 1.5,
          fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          "@media print": {
            p: 2,
            boxShadow: "none !important",
            maxWidth: "100%",
            borderRadius: 0,
          },
        }}
      >
        <Box>
          {/* Institutional Official Header */}
          <Box sx={{ borderBottom: "2.5px solid #0f172a", pb: 2, mb: 3, textAlign: "center", position: "relative" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 0.5 }}>
              <SchoolIcon sx={{ fontSize: 28, color: primaryColor }} />
              <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: 0.5, textTransform: "uppercase", color: "#0f172a" }}>
                {school?.name || "Famous Academy"}
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: "0.85rem", mb: 0.5 }}>
              {school?.address || "Main Campus, Education City"} • Phone: {school?.phone || "—"} • Email: {school?.email || "info@school.local"}
            </Typography>

            <Box sx={{ display: "inline-block", bgcolor: "#0f172a", color: "#ffffff", px: 2.5, py: 0.6, borderRadius: 1, mt: 1.2 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: 1.5, textTransform: "uppercase", fontSize: "0.95rem" }}>
                EXAMINATION ROUTINE / SCHEDULE
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mt: 1.5 }}>
              <Typography variant="body2" fontWeight={700} color="#1e293b">
                Exam: <span style={{ color: primaryColor }}>{session?.name}</span>
              </Typography>
              <Typography variant="body2" color="text.secondary">•</Typography>
              <Typography variant="body2" fontWeight={700} color="#1e293b">
                Academic Year: <span>{session?.academic_year_name || "2026"}</span>
              </Typography>
              {selectedClassName && (
                <>
                  <Typography variant="body2" color="text.secondary">•</Typography>
                  <Typography variant="body2" fontWeight={800} sx={{ color: "#059669" }}>
                    Class: {selectedClassName}
                  </Typography>
                </>
              )}
            </Stack>
          </Box>

          {/* Render Schedule: Option 1: Grouped By Class */}
          {viewMode === "by_class" ? (
            classGroups.length === 0 ? (
              <Box p={4} textAlign="center" color="text.secondary">
                No exam schedule found for the selected criteria.
              </Box>
            ) : (
              classGroups.map(({ className, items }) => (
                <Box key={className} sx={{ mb: 3.5, pageBreakInside: "avoid" }}>
                  {/* Class Header Banner */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: "#f1f5f9",
                      px: 2,
                      py: 1,
                      borderRadius: "6px 6px 0 0",
                      border: "1px solid #cbd5e1",
                      borderBottom: "none",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <MenuBookIcon sx={{ fontSize: 18, color: primaryColor }} />
                      <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: "uppercase", letterSpacing: 0.5, color: "#0f172a" }}>
                        {className}
                      </Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {items.length} Subject(s)
                    </Typography>
                  </Box>

                  {/* Class Timetable Table */}
                  <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "0 0 6px 6px", border: "1px solid #cbd5e1" }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#f8fafc" }}>
                        <TableRow>
                          <TableCell width="6%" align="center" sx={{ fontWeight: 800, fontSize: "0.78rem" }}>#</TableCell>
                          <TableCell width="24%" sx={{ fontWeight: 800, fontSize: "0.78rem" }}>Exam Date &amp; Day</TableCell>
                          <TableCell width="24%" sx={{ fontWeight: 800, fontSize: "0.78rem" }}>Time Duration</TableCell>
                          <TableCell width="26%" sx={{ fontWeight: 800, fontSize: "0.78rem" }}>Subject</TableCell>
                          <TableCell width="20%" align="center" sx={{ fontWeight: 800, fontSize: "0.78rem" }}>Room / Hall</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map((r, idx) => {
                          const { dateFormatted, dayName } = formatDate(r.exam_date);
                          const timeRange = formatTimeRange(r.start_time, r.end_time);

                          return (
                            <TableRow key={r.id} hover sx={{ "&:nth-of-type(even)": { bgcolor: "#fbfcfe" } }}>
                              <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.8rem", color: "#64748b" }}>
                                {idx + 1}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.82rem" }}>
                                <Typography variant="body2" fontWeight={700} sx={{ fontSize: "0.82rem", color: "#0f172a" }}>
                                  {dateFormatted}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, fontSize: "0.72rem" }}>
                                  {dayName}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.82rem" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                                  <AccessTimeIcon sx={{ fontSize: 14, color: "#0284c7" }} />
                                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.8rem", color: "#1e293b" }}>
                                    {timeRange}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.82rem" }}>
                                <Typography variant="body2" fontWeight={800} sx={{ color: "#0f172a", fontSize: "0.85rem" }}>
                                  {r.subject_name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.72rem" }}>
                                  Full Marks: {r.total_marks || 100} • Pass: {r.pass_marks || 33}
                                </Typography>
                              </TableCell>
                              <TableCell align="center" sx={{ fontSize: "0.82rem" }}>
                                <Chip
                                  icon={<MeetingRoomIcon sx={{ fontSize: "13px !important" }} />}
                                  label={r.exam_room || "Room TBA"}
                                  size="small"
                                  sx={{
                                    bgcolor: "#f1f5f9",
                                    color: "#334155",
                                    fontWeight: 700,
                                    fontSize: "0.72rem",
                                    border: "1px solid #e2e8f0",
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))
            )
          ) : (
            /* Consolidated Table (Sorted by Date) */
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 1.5, border: "1px solid #cbd5e1", mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell width="5%" align="center" sx={{ fontWeight: 800, fontSize: "0.78rem" }}>#</TableCell>
                    <TableCell width="22%" sx={{ fontWeight: 800, fontSize: "0.78rem" }}>Date &amp; Day</TableCell>
                    <TableCell width="20%" sx={{ fontWeight: 800, fontSize: "0.78rem" }}>Time</TableCell>
                    <TableCell width="18%" sx={{ fontWeight: 800, fontSize: "0.78rem" }}>Class</TableCell>
                    <TableCell width="22%" sx={{ fontWeight: 800, fontSize: "0.78rem" }}>Subject</TableCell>
                    <TableCell width="13%" align="center" sx={{ fontWeight: 800, fontSize: "0.78rem" }}>Room</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No exam subjects scheduled.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((r, idx) => {
                      const { dateFormatted, dayName } = formatDate(r.exam_date);
                      const timeRange = formatTimeRange(r.start_time, r.end_time);

                      return (
                        <TableRow key={r.id} hover sx={{ "&:nth-of-type(even)": { bgcolor: "#fbfcfe" } }}>
                          <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.8rem", color: "#64748b" }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.82rem" }}>
                            <Typography variant="body2" fontWeight={700} sx={{ fontSize: "0.82rem", color: "#0f172a" }}>
                              {dateFormatted}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, fontSize: "0.72rem" }}>
                              {dayName}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.82rem" }}>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.8rem", color: "#1e293b" }}>
                              {timeRange}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.82rem" }}>
                            <Chip
                              label={r.class_name}
                              size="small"
                              sx={{ bgcolor: "#e0f2fe", color: "#0369a1", fontWeight: 700, fontSize: "0.72rem" }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.82rem" }}>
                            <Typography variant="body2" fontWeight={800} sx={{ color: "#0f172a", fontSize: "0.85rem" }}>
                              {r.subject_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.72rem" }}>
                              Full: {r.total_marks || 100} • Pass: {r.pass_marks || 33}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: "0.82rem" }}>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.78rem", color: "#334155" }}>
                              {r.exam_room || "—"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Important Instructions Box */}
          <Box
            sx={{
              bgcolor: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: 1.5,
              p: 2,
              mb: 4,
              pageBreakInside: "avoid",
            }}
          >
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0f172a", mb: 0.8, textTransform: "uppercase", fontSize: "0.78rem" }}>
              General Instructions for Examinees:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: "0.72rem", lineHeight: 1.4 }}>
                  • Students must enter the examination hall at least <strong>15 minutes</strong> before start time.
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: "0.72rem", lineHeight: 1.4 }}>
                  • <strong>Admit Card</strong> and <strong>Student ID Card</strong> must be displayed on desk.
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: "0.72rem", lineHeight: 1.4 }}>
                  • Mobile phones, smartwatches, and unauthorized notes are strictly prohibited.
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: "0.72rem", lineHeight: 1.4 }}>
                  • No examinee will be allowed to leave the hall during the first hour of examination.
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* Institutional Signature Block */}
        <Box sx={{ pageBreakInside: "avoid", pt: 3, borderTop: "1px solid #e2e8f0" }}>
          <Grid container spacing={3} justifyContent="space-between" alignItems="flex-end">
            <Box sx={{ textAlign: "center", width: 170 }}>
              <Box sx={{ height: 28 }} />
              <Box sx={{ borderTop: "1.5px solid #64748b", pt: 0.6 }}>
                <Typography variant="caption" fontWeight={800} color="#1e293b" display="block" sx={{ textTransform: "uppercase", fontSize: "0.75rem" }}>
                  Exam Controller
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>
                  Examination Committee
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  border: "1.5px dashed #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  color: "#94a3b8",
                }}
              >
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Official Seal
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: "center", width: 170 }}>
              <Box sx={{ height: 28 }} />
              <Box sx={{ borderTop: "1.5px solid #64748b", pt: 0.6 }}>
                <Typography variant="caption" fontWeight={800} color="#1e293b" display="block" sx={{ textTransform: "uppercase", fontSize: "0.75rem" }}>
                  Head of Institution
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>
                  Principal / Headmaster
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Box>
      </Box>
    </PrintFrame>
  );
}
