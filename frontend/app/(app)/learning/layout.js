"use client";

import { usePathname, useRouter } from "next/navigation";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import ModuleGuard from "@/components/ModuleGuard";

const TABS = [
  { label: 'Study Materials', path: '/learning' },
  { label: 'Live Classes', path: '/learning/live-classes' },
];

export default function Layout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const currentTabIndex = TABS.findIndex((tab) => {
    if (tab.path === "/learning") return pathname === "/learning";
    return pathname.startsWith(tab.path);
  });
  const activeTab = currentTabIndex === -1 ? 0 : currentTabIndex;

  const handleTabChange = (event, newValue) => {
    router.push(TABS[newValue].path);
  };

  return (
    <ModuleGuard moduleKey="learning">
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            Learning Management (LMS)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage course materials, study resources, and online classes.
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
