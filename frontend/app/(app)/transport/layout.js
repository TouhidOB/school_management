"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import ModuleGuard from "@/components/ModuleGuard";

const TABS = [
  { label: 'Overview', path: '/transport' },
  { label: 'Vehicles', path: '/transport/vehicles' },
  { label: 'Routes', path: '/transport/routes' },
  { label: 'Allocation', path: '/transport/allocation' }
];

export default function Layout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const currentTabIndex = TABS.findIndex((tab) => {
    if (tab.path === "/transport") return pathname === "/transport";
    return pathname.startsWith(tab.path);
  });
  const activeTab = currentTabIndex === -1 ? 0 : currentTabIndex;

  const handleTabChange = (event, newValue) => {
    router.push(TABS[newValue].path);
  };

  return (
    <ModuleGuard moduleKey="transport">
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            Transport
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage vehicles, routes, and allocations.
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
    </ModuleGuard>
  );
}
