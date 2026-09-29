"use client";

// Layout for all authenticated dashboard routes. Guards access and renders the
// persistent sidebar + top bar shell.
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Box, CircularProgress, Button, Typography, Paper } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import BlockIcon from '@mui/icons-material/Block';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { MODULES } from "@/lib/modules";

export default function AppLayout({ children }) {
  const { user, school, loading, activeTeacherId, exitTeacher, activeStudentId, exitStudent } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  // Check if current route belongs to a disabled module for the active school
  const currentModule = MODULES.find(m => pathname === m.path || pathname.startsWith(m.path + "/"));
  const isModuleDeactivated = currentModule && school?.modules && school.modules[currentModule.key] === false;

  if (loading || !user) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleExitTeacher = () => {
    exitTeacher();
    router.push('/dashboard');
  };

  const handleExitStudent = () => {
    exitStudent();
    router.push('/dashboard');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        
        {activeTeacherId && (
          <Box sx={{ 
            bgcolor: 'warning.main', 
            color: 'warning.contrastText', 
            px: 3, 
            py: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.1)'
          }}>
            <Typography variant="body2" fontWeight="bold">
              ⚠ ADMIN ACCESS MODE: You are fully impersonating a Teacher account. 
            </Typography>
            <Button 
              size="small" 
              variant="contained" 
              color="inherit" 
              sx={{ color: 'warning.main', textTransform: 'none', fontWeight: 'bold' }}
              onClick={handleExitTeacher}
              startIcon={<ExitToAppIcon />}
            >
              Exit Teacher Panel
            </Button>
          </Box>
        )}

        {activeStudentId && (
          <Box sx={{ 
            bgcolor: 'info.main', 
            color: 'info.contrastText', 
            px: 3, 
            py: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.1)'
          }}>
            <Typography variant="body2" fontWeight="bold">
              ⚠ ADMIN ACCESS MODE: You are fully impersonating a Student account. 
            </Typography>
            <Button 
              size="small" 
              variant="contained" 
              color="inherit" 
              sx={{ color: 'info.main', textTransform: 'none', fontWeight: 'bold' }}
              onClick={handleExitStudent}
              startIcon={<ExitToAppIcon />}
            >
              Exit Student Panel
            </Button>
          </Box>
        )}

        <Box sx={{ p: 3, flexGrow: 1, backgroundColor: '#f4f6f8' }}>
          {isModuleDeactivated ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
              <Paper sx={{ p: 5, maxWidth: 540, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <Box sx={{ width: 68, height: 68, borderRadius: '50%', bgcolor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
                  <BlockIcon sx={{ fontSize: 38 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#0f172a', mb: 1 }}>
                  {currentModule.label} Module Deactivated
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5, lineHeight: 1.6 }}>
                  The <strong>{currentModule.label}</strong> module is currently turned OFF for <strong>{school?.name || 'this school'}</strong> by the platform super administrator. If your institution requires this module, please contact the platform super administrator.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => router.push('/dashboard')}
                  startIcon={<ArrowBackIcon />}
                  sx={{ textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}
                >
                  Return to Dashboard
                </Button>
              </Paper>
            </Box>
          ) : (
            children
          )}
        </Box>
      </Box>
    </Box>
  );
}
