"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Button
} from '@mui/material';

import SpeedIcon from '@mui/icons-material/Speed';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import PaidIcon from '@mui/icons-material/Paid';
import WorkIcon from '@mui/icons-material/Work';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import HotelIcon from '@mui/icons-material/Hotel';
import InventoryIcon from '@mui/icons-material/Inventory';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventIcon from '@mui/icons-material/Event';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SchoolIcon from '@mui/icons-material/School';
import GridOnIcon from '@mui/icons-material/GridOn';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { PATH_TO_MODULE } from "@/lib/modules";

const SIDEBAR_ITEMS = [
  { href: "/dashboard", key: "dashboard", label: "Dashboard", icon: <SpeedIcon /> },
  { href: "/school-settings", key: "schoolSettings", label: "School", icon: <BusinessIcon /> },
  { href: "/students", key: "students", label: "Students", icon: <PeopleIcon /> },
  { href: "/ex-students", key: "exStudents", label: "Ex-Students", icon: <SchoolIcon /> },
  { href: "/teachers", key: "teachers", label: "Teachers", icon: <PersonIcon /> },
  { href: "/academics", key: "academics", label: "Academics", icon: <MenuBookIcon /> },
  { href: "/timetable", key: "timetable", label: "Timetable", icon: <CalendarMonthIcon /> },
  { href: "/attendance", key: "attendance", label: "Attendance", icon: <FactCheckIcon /> },
  { href: "/learning", key: "learning", label: "Learning", icon: <AutoStoriesIcon /> },
  { href: "/homework", key: "homework", label: "Homework", icon: <HomeWorkIcon /> },
  { href: "/exams", key: "exams", label: "Exams", icon: <AssignmentIcon /> },
  { href: "/finance", key: "finance", label: "Finance", icon: <PaidIcon /> },
  { href: "/hr", key: "hr", label: "HR", icon: <WorkIcon /> },
  { href: "/library", key: "library", label: "Library", icon: <LocalLibraryIcon /> },
  { href: "/transport", key: "transport", label: "Transport", icon: <DirectionsBusIcon /> },
  { href: "/hostel", key: "hostel", label: "Hostel", icon: <HotelIcon /> },
  { href: "/inventory", key: "inventory", label: "Inventory", icon: <InventoryIcon /> },
  { href: "/communication", key: "communication", label: "Communication", icon: <CampaignIcon /> },
  { href: "/events", key: "events", label: "Events", icon: <EventIcon /> },
  { href: "/certificates", key: "certificates", label: "Certificates", icon: <EmojiEventsIcon /> },
  { href: "/reports", key: "reports", label: "Reports", icon: <BarChartIcon /> },
  { href: "/settings", key: "settings", label: "Settings", icon: <SettingsIcon /> },
];

const drawerWidth = 240;

export default function Sidebar() {
  const pathname = usePathname();
  const { user, school, logout, activeTeacherId, activeStudentId } = useAuth();
  const { t } = useLanguage();
  const isSuper = user?.is_super_admin;
  const isAdmin = user?.role === 'super_admin' || user?.role === 'school_admin' || isSuper;

  const renderLink = (item) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton
          component={Link}
          href={item.href}
          selected={active}
          sx={{
            borderRadius: 1,
            mx: 1,
            py: 0.5,
            color: active ? '#fff' : '#cbd5e1',
            '&.Mui-selected': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
            '&.Mui-selected:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
            }
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={t(`sidebar.${item.key}`, item.label)} primaryTypographyProps={{ fontSize: '0.875rem' }} />
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          backgroundColor: 'var(--sms-sidebar-bg)',
          color: '#cbd5e1',
          borderRight: 'none'
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', color: '#fff', fontWeight: 700, letterSpacing: 0.3 }}>
        <SchoolIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          SMS
        </Typography>
      </Box>

      <Box sx={{ overflow: 'auto', flexGrow: 1, '&::-webkit-scrollbar': { width: '0.4em' }, '&::-webkit-scrollbar-track': { background: 'transparent' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' } }}>
        <List>
          {isSuper && !activeTeacherId && !activeStudentId && (
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                href="/platform"
                selected={pathname.startsWith("/platform")}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  color: pathname.startsWith("/platform") ? '#fff' : '#cbd5e1',
                  '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  <GridOnIcon />
                </ListItemIcon>
                <ListItemText primary={t('nav.platformConsole', 'Super Admin Console')} primaryTypographyProps={{ fontSize: '0.875rem' }} />
              </ListItemButton>
            </ListItem>
          )}

          {school &&
             SIDEBAR_ITEMS.filter(item => {
               // 1. Superadmin modular control: if module is explicitly disabled for this school, hide from sidebar
               const modKey = PATH_TO_MODULE[item.href];
               if (modKey && school.modules && school.modules[modKey] === false) {
                 return false;
               }

               if (isAdmin && !activeTeacherId && !activeStudentId) return true; 
               
               let role = user?.role || 'admin';
               if (activeTeacherId) role = 'teacher';
               if (activeStudentId) role = 'student';
               
               // Basic role-based navigation
               if (role === 'accountant' && !['/dashboard', '/students', '/finance', '/reports'].includes(item.href)) return false;
               if (role === 'librarian' && !['/dashboard', '/students', '/library', '/reports'].includes(item.href)) return false;
               if (role === 'teacher' && !['/dashboard', '/academics', '/attendance', '/exams', '/homework', '/timetable'].includes(item.href)) return false;
               if (role === 'student' && !['/dashboard', '/academics', '/timetable', '/attendance', '/learning', '/homework', '/exams', '/finance', '/library', '/transport', '/hostel', '/communication', '/events', '/certificates'].includes(item.href)) return false;
               
               return true;
             }).map(renderLink)
          }

          {isSuper && !school && (
            <Typography variant="caption" sx={{ px: 2, mt: 2, display: 'block', color: '#94a3b8' }}>
              {t('nav.noSchool', 'Enter a school from the platform console to manage it.')}
            </Typography>
          )}
        </List>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', color: '#fff', mb: 0.5, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <AccountCircleIcon sx={{ mr: 1, fontSize: '1.2rem', flexShrink: 0 }} />
          {user?.username}
        </Box>
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
          {activeStudentId ? (t('sidebar.studentBadge', 'Acting as Student')) : activeTeacherId ? (t('sidebar.teacherBadge', 'Acting as Teacher')) : user?.role_display}
        </Typography>
        <Button 
          variant="outlined" 
          fullWidth 
          onClick={logout}
          startIcon={<LogoutIcon />}
          sx={{ 
            color: '#fff', 
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': { borderColor: '#fff' },
            textTransform: 'none'
          }}
        >
          {t('sidebar.logout', 'Sign out')}
        </Button>
      </Box>
    </Drawer>
  );
}
