"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Typography, Tabs, Tab } from "@mui/material";

const TABS = [
  { label: 'Student', path: '/reports' },
  { label: 'Academic', path: '/reports/academic' },
  { label: 'Finance', path: '/reports/finance' },
  { label: 'HR', path: '/reports/hr' }
];

export default function Layout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const currentTabIndex = TABS.findIndex((tab) => {
    if (tab.path === "/reports") return pathname === "/reports";
    return pathname.startsWith(tab.path);
  });
  const activeTab = currentTabIndex === -1 ? 0 : currentTabIndex;

  const handleTabChange = (event, newValue) => {
    router.push(TABS[newValue].path);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Interactive Reports
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View comprehensive academic, financial, and operational reports.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
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
