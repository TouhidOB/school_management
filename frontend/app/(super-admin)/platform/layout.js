"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import SuperAdminTopBar from "@/components/SuperAdminTopBar";
import { Box, CircularProgress } from '@mui/material';

export default function SuperAdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (!user.is_super_admin) {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || !user.is_super_admin) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SuperAdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <SuperAdminTopBar />
        <Box sx={{ p: 3, flexGrow: 1, backgroundColor: '#f8fafc' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
