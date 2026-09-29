"use client";

import { Box, Typography } from "@mui/material";
import TeacherForm from "@/components/TeacherForm";

export default function NewTeacherPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Add Teacher
      </Typography>
      <TeacherForm />
    </Box>
  );
}
