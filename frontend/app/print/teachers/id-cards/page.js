"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PrintFrame from "@/components/PrintFrame";
import TeacherIdCard from "@/components/TeacherIdCard";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function BulkTeacherIdCardsPage() {
  const [teachers, setTeachers] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/teachers/?page_size=500").then((res) => setTeachers(res.results || res)),
      api.get("/school/").then(setSchool)
    ])
      .catch((err) => console.error("Error loading teachers list:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PrintFrame title={`All Teachers ID Cards (${teachers?.length || 0})`}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2.5,
          justifyContent: "center",
          maxWidth: 900,
          my: 2,
        }}
      >
        {(!teachers || teachers.length === 0) ? (
          <Typography sx={{ p: 4, color: "text.secondary" }}>No teachers found.</Typography>
        ) : (
          teachers.map((t) => (
            <TeacherIdCard key={t.id} teacher={t} school={school} />
          ))
        )}
      </Box>
    </PrintFrame>
  );
}
