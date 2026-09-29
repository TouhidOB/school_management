"use client";

import { Box, Typography, Avatar, Divider, Chip } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedIcon from "@mui/icons-material/Verified";
import SchoolIcon from "@mui/icons-material/School";

// Helper to render an authentic-looking vector barcode
function BarcodeSvg({ text, width = 120, height = 22 }) {
  const seed = (text || "TCH-000").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bars = [];
  let x = 4;
  const pattern = [2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 2, 3, 1];
  for (let i = 0; i < pattern.length; i++) {
    const w = ((pattern[i] + (seed % 3)) % 3) + 1;
    bars.push(<rect key={i} x={x} y={2} width={w} height={height - 4} fill="#1e293b" />);
    x += w + (((pattern[(i + 1) % pattern.length] + seed) % 2) + 1.5);
    if (x > width - 8) break;
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {bars}
    </svg>
  );
}

export default function TeacherIdCard({ teacher, school }) {
  if (!teacher) return null;

  const primaryColor = school?.primary_color || "#1e3a8a";
  const teacherName = teacher.display_name || teacher.full_name || `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() || "Faculty Member";
  const designation = teacher.designation_name || "Faculty Member";
  const department = teacher.department_name || "General Faculty";
  const empId = teacher.employee_id || `TCH-${String(teacher.id).padStart(4, "0")}`;
  const bloodGroup = teacher.blood_group || "—";
  const phone = teacher.phone || "—";
  const joiningDate = teacher.joining_date ? new Date(teacher.joining_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "2026";

  return (
    <Box
      className="print-doc teacher-id-card"
      sx={{
        width: "5.40cm",
        height: "8.56cm",
        borderRadius: "10px",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        border: "1px solid #cbd5e1",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        pageBreakInside: "avoid",
        mb: 2,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top Header with Dual Gradient */}
      <Box
        sx={{
          background: `linear-gradient(135deg, #0f172a 0%, ${primaryColor} 100%)`,
          color: "#ffffff",
          pt: 1,
          pb: 0.8,
          px: 1,
          textAlign: "center",
          position: "relative",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.6, mb: 0.2 }}>
          <SchoolIcon sx={{ fontSize: 13, color: "#facc15" }} />
          <Typography
            fontWeight={900}
            sx={{
              fontSize: 9.5,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              lineHeight: 1.15,
              color: "#ffffff",
            }}
          >
            {school?.name || "Famous Academy"}
          </Typography>
        </Box>
        <Typography
          sx={{
            opacity: 0.85,
            fontSize: 7.2,
            lineHeight: 1.1,
            fontWeight: 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {school?.address || "Main Campus, Education City"}
        </Typography>

        {/* Accent Gold Ribbon Stripe */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2.5px",
            background: "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)",
          }}
        />
      </Box>

      {/* Faculty Tag Banner */}
      <Box
        sx={{
          bgcolor: "#f1f5f9",
          py: 0.35,
          textAlign: "center",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
        }}
      >
        <Typography
          sx={{
            fontSize: 7.5,
            fontWeight: 800,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: "#0f172a",
          }}
        >
          FACULTY &amp; STAFF ID CARD
        </Typography>
      </Box>

      {/* Middle Body */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          px: 1.2,
          pt: 0.8,
          pb: 0.4,
          flexGrow: 1,
        }}
      >
        {/* Photo Container with Verified Badge */}
        <Box sx={{ position: "relative", mb: 0.6 }}>
          <Avatar
            src={teacher.photo}
            sx={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
              border: `2px solid ${primaryColor}`,
              bgcolor: "#f8fafc",
              color: primaryColor,
            }}
          >
            {!teacher.photo && <PersonIcon sx={{ fontSize: 38, color: "#64748b" }} />}
          </Avatar>
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              right: -2,
              bgcolor: "#ffffff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: "1px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            <VerifiedIcon sx={{ fontSize: 13, color: "#2563eb" }} />
          </Box>
        </Box>

        {/* Teacher Full Name */}
        <Typography
          fontWeight={900}
          sx={{
            color: "#0f172a",
            textAlign: "center",
            fontSize: 11.5,
            lineHeight: 1.15,
            mb: 0.2,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {teacherName}
        </Typography>

        {/* Designation Badge */}
        <Box
          sx={{
            bgcolor: "#eff6ff",
            color: "#1d4ed8",
            border: "1px solid #bfdbfe",
            fontWeight: 700,
            fontSize: 7.8,
            px: 1,
            py: 0.15,
            borderRadius: "10px",
            mb: 0.6,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {designation}
        </Box>

        {/* Data Grid Rows */}
        <Box
          sx={{
            width: "100%",
            bgcolor: "#f8fafc",
            borderRadius: "6px",
            p: 0.6,
            border: "1px solid #e2e8f0",
            mb: 0.4,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.2 }}>
            <Typography sx={{ color: "#64748b", fontWeight: 700, fontSize: 7.8 }}>Emp ID</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 8, color: "#0f172a", letterSpacing: 0.3 }}>
              {empId}
            </Typography>
          </Box>
          <Divider sx={{ my: 0.2, borderColor: "#e2e8f0" }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.2 }}>
            <Typography sx={{ color: "#64748b", fontWeight: 700, fontSize: 7.8 }}>Dept</Typography>
            <Typography sx={{ fontWeight: 600, fontSize: 8, color: "#334155" }}>
              {department}
            </Typography>
          </Box>
          <Divider sx={{ my: 0.2, borderColor: "#e2e8f0" }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.2 }}>
            <Typography sx={{ color: "#64748b", fontWeight: 700, fontSize: 7.8 }}>Phone</Typography>
            <Typography sx={{ fontWeight: 600, fontSize: 7.8, color: "#334155" }}>
              {phone}
            </Typography>
          </Box>
          <Divider sx={{ my: 0.2, borderColor: "#e2e8f0" }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ color: "#64748b", fontWeight: 700, fontSize: 7.8 }}>Blood / Joined</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  bgcolor: "#fee2e2",
                  color: "#b91c1c",
                  px: 0.5,
                  borderRadius: "3px",
                  fontWeight: 800,
                  fontSize: 7.5,
                  lineHeight: 1.2,
                }}
              >
                {bloodGroup}
              </Box>
              <Typography sx={{ color: "#64748b", fontSize: 7 }}>•</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: 7.5, color: "#475569" }}>
                {joiningDate}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Barcode & Signature Row */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            mt: 0.2,
            px: 0.2,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <BarcodeSvg text={empId} width={85} height={17} />
            <Typography sx={{ fontSize: 6.5, color: "#64748b", letterSpacing: 0.5, mt: 0.1 }}>
              {empId}
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center", width: 72 }}>
            <Box sx={{ height: 14 }} />
            <Box sx={{ borderTop: "1px dashed #94a3b8", pt: 0.2 }}>
              <Typography sx={{ fontSize: 6, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Authorized Seal
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Footer Ribbon */}
      <Box
        sx={{
          background: "#0f172a",
          color: "#94a3b8",
          py: 0.5,
          px: 1,
          textAlign: "center",
          borderTop: "1px solid #1e293b",
        }}
      >
        <Typography sx={{ fontSize: 6.5, display: "block", color: "#cbd5e1", lineHeight: 1.1 }}>
          Property of {school?.name || "Institution"}. If found, please return.
        </Typography>
        <Typography sx={{ fontSize: 7, fontWeight: 800, color: "#facc15", lineHeight: 1.1, mt: 0.15 }}>
          Emergency: {school?.phone || "+880 1700-000000"}
        </Typography>
      </Box>
    </Box>
  );
}
