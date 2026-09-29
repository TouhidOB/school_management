"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Box, Divider, Button
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PaymentIcon from '@mui/icons-material/Payment';
import PeopleIcon from '@mui/icons-material/People';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CampaignIcon from '@mui/icons-material/Campaign';
import ChatIcon from '@mui/icons-material/Chat';
import DnsIcon from '@mui/icons-material/Dns';
import SecurityIcon from '@mui/icons-material/Security';
import WebIcon from '@mui/icons-material/Web';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const SUPER_ADMIN_GROUPS = [
  {
    titleKey: null,
    title: null,
    items: [
      { href: "/platform", key: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
      { href: "/platform/tenants", key: "tenants", label: "Tenants", icon: <BusinessIcon /> },
    ],
  },
  {
    titleKey: "billingAndUsers",
    title: "Billing & Users",
    items: [
      { href: "/platform/plans", key: "plans", label: "Plans", icon: <PaymentIcon /> },
      { href: "/platform/subscriptions", key: "subscriptions", label: "Subscriptions", icon: <PaymentIcon /> },
      { href: "/platform/invoices", key: "invoices", label: "Invoices", icon: <PaymentIcon /> },
      { href: "/platform/transactions", key: "transactions", label: "Transactions", icon: <PaymentIcon /> },
      { href: "/platform/users", key: "platformUsers", label: "Platform Users", icon: <PeopleIcon /> },
      { href: "/platform/school-admins", key: "schoolAdmins", label: "School Admins", icon: <PeopleIcon /> },
    ],
  },
  {
    titleKey: "supportCenter",
    title: "Support Center",
    items: [
      { href: "/platform/support/tickets", key: "tickets", label: "Tickets", icon: <SupportAgentIcon /> },
      { href: "/platform/support/kb", key: "kb", label: "Knowledge Base", icon: <MenuBookIcon /> },
    ],
  },
  {
    titleKey: "communication",
    title: "Communication",
    items: [
      { href: "/platform/communication/announcements", key: "announcements", label: "Announcements", icon: <CampaignIcon /> },
      { href: "/platform/communication/templates", key: "templates", label: "Templates", icon: <ChatIcon /> },
      { href: "/platform/communication/logs", key: "logs", label: "Sent Logs", icon: <AnalyticsIcon /> },
    ],
  },
  {
    titleKey: "systemConfig",
    title: "System Settings",
    items: [
      { href: "/platform/system/general", key: "general", label: "General", icon: <SettingsIcon /> },
      { href: "/platform/system/email", key: "systemEmail", label: "Email SMTP", icon: <DnsIcon /> },
      { href: "/platform/system/sms", key: "systemSms", label: "SMS Gateway", icon: <ChatIcon /> },
      { href: "/platform/security", key: "security", label: "Security", icon: <SecurityIcon /> },
    ],
  },
  {
    titleKey: "cms",
    title: "Website CMS",
    items: [
      { href: "/platform/cms/testimonials", key: "testimonials", label: "Testimonials", icon: <CampaignIcon /> },
      { href: "/platform/cms/faqs", key: "faqs", label: "FAQs", icon: <ChatIcon /> },
    ],
  },
];

const drawerWidth = 260;

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const renderLink = (item) => {
    const active = item.href === "/platform" 
      ? pathname === item.href 
      : pathname.startsWith(item.href);

    return (
      <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton
          component={Link}
          href={item.href}
          selected={active}
          sx={{
            borderRadius: 1,
            mx: 1,
            color: active ? '#fff' : '#94a3b8',
            '&.Mui-selected': {
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
            },
            '&.Mui-selected:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.25)',
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={t(`superadmin.${item.key}`, item.label)} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }} />
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
          backgroundColor: '#0f172a',
          color: '#cbd5e1',
          borderRight: '1px solid rgba(255,255,255,0.05)'
        },
      }}
    >
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>
        <AdminPanelSettingsIcon sx={{ mr: 1.5, color: '#60a5fa' }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
          {t('sidebar.superAdminBadge', 'Super Admin')}
        </Typography>
      </Box>

      <Box sx={{ overflow: 'auto', flexGrow: 1, mt: 1 }}>
        <List>
          {SUPER_ADMIN_GROUPS.map((g, i) => (
            <Box key={i} sx={{ mb: 1.5 }}>
              {g.title && (
                <Typography variant="caption" sx={{ px: 3, mt: 1, mb: 1, display: 'block', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: 0.5 }}>
                  {g.titleKey ? t(`superadmin.${g.titleKey}`, g.title) : g.title}
                </Typography>
              )}
              {g.items.map(renderLink)}
            </Box>
          ))}
        </List>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', color: '#fff', mb: 0.5, fontSize: '0.875rem' }}>
          <AccountCircleIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          {user?.username}
        </Box>
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
          {user?.role_display}
        </Typography>
        <Button 
          variant="outlined" 
          fullWidth 
          onClick={logout}
          startIcon={<LogoutIcon />}
          sx={{ 
            color: '#94a3b8', 
            borderColor: 'rgba(255,255,255,0.2)',
            textTransform: 'none',
            '&:hover': { borderColor: '#fff', color: '#fff' }
          }}
        >
          {t('sidebar.logout', 'Sign out')}
        </Button>
      </Box>
    </Drawer>
  );
}
