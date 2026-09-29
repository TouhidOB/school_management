"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Box, Typography, CircularProgress } from "@mui/material";
import TeacherForm from "@/components/TeacherForm";

export default function EditTeacherPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/teachers/${id}/`).then(setData).catch(() => {});
  }, [id]);

  if (!data) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Edit Teacher
      </Typography>
      <TeacherForm id={id} initialData={data} />
    </Box>
  );
}
