"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Typography, Tabs, Tab } from "@mui/material";

const TABS = [
  { label: 'Exams', path: '/exams' },
  { label: 'Schedule', path: '/exams/schedule' },
  { label: 'Marks Entry', path: '/exams/marks' },
  { label: 'Results', path: '/exams/results' },
  { label: 'Final Promotions', path: '/exams/promotions' }
];

export default function Layout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const currentTabIndex = TABS.findIndex((tab) => {
    if (tab.path === "/exams") return pathname === "/exams";
    return pathname.startsWith(tab.path);
  });
  const activeTab = currentTabIndex === -1 ? 0 : currentTabIndex;

  const handleTabChange = (event, newValue) => {
    router.push(TABS[newValue].path);
  };

  return (
    <Box>
      <Box className="no-print" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Examinations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage exam schedules, marks entry, and report cards.
        </Typography>
      </Box>

      <Box className="no-print" sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
        >
          {TABS.map((tab, idx) => (
            <Tab key={idx} label={tab.label} sx={{ textTransform: 'none', fontWeight: 500 }} />
          ))}
        </Tabs>
      </Box>

      {children}
    </Box>
  );
}
