"use client";

import { useAuth } from "@/context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import StudentDashboard from "@/components/dashboards/StudentDashboard";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Dashboard() {
  const { user, activeTeacherId, activeStudentId, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  let content = <AdminDashboard />;
  if (user?.role === 'student' || activeStudentId) {
    content = <StudentDashboard user={user} isPreview={!!activeStudentId} targetStudentId={activeStudentId} />;
  } else if (user?.role === 'teacher' || activeTeacherId) {
    content = <TeacherDashboard user={user} isPreview={!!activeTeacherId} targetTeacherId={activeTeacherId} />;
  }

  return <ErrorBoundary>{content}</ErrorBoundary>;
}
