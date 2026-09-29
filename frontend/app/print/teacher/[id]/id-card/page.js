"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import PrintFrame from "@/components/PrintFrame";
import TeacherIdCard from "@/components/TeacherIdCard";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function SingleTeacherIdCardPage() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/teachers/${id}/`).then(setTeacher),
      api.get("/school/").then(setSchool)
    ])
      .catch((err) => console.error("Error loading teacher card data:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!teacher) {
    return (
      <Box p={6} textAlign="center">
        <Typography color="error">Teacher profile not found.</Typography>
      </Box>
    );
  }

  return (
    <PrintFrame title={`Teacher ID Card — ${teacher.display_name || teacher.full_name}`}>
      <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
        <TeacherIdCard teacher={teacher} school={school} />
      </Box>
    </PrintFrame>
  );
}
