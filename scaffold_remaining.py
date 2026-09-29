import os

routes = {
    "attendance": {
        "title": "Attendance",
        "description": "Manage student and staff attendance.",
        "tabs": [("Daily Attendance", "/attendance"), ("Reports", "/attendance/reports")]
    },
    "exams": {
        "title": "Examinations",
        "description": "Manage exam schedules, marks entry, and report cards.",
        "tabs": [("Exams", "/exams"), ("Schedule", "/exams/schedule"), ("Marks Entry", "/exams/marks"), ("Results", "/exams/results")]
    },
    "certificates": {
        "title": "Certificates",
        "description": "Generate and verify student certificates.",
        "tabs": [("Issued", "/certificates"), ("Generate", "/certificates/generate"), ("Types", "/certificates/types")]
    },
    "settings": {
        "title": "Settings",
        "description": "Configure academic, attendance, and system settings.",
        "tabs": [("General", "/settings"), ("Roles", "/settings/roles"), ("Notifications", "/settings/notifications")]
    },
    "teachers": {
        "title": "Teachers",
        "description": "Manage teaching staff.",
        "tabs": [("Directory", "/teachers"), ("Timetable", "/timetable/teachers")]
    }
}

base_dir = "frontend/app/(app)"

for route, data in routes.items():
    route_dir = os.path.join(base_dir, route)
    os.makedirs(route_dir, exist_ok=True)
    
    # We will only create the layout file and let the existing page.js remain
    layout_content = f""""use client";

import {{ useState }} from "react";
import {{ usePathname, useRouter }} from "next/navigation";
import {{ Box, Typography, Tabs, Tab }} from "@mui/material";

const TABS = {data['tabs']};

export default function Layout({{ children }}) {{
  const pathname = usePathname();
  const router = useRouter();

  const currentTabIndex = TABS.findIndex((tab) => {{
    if (tab[1] === "/{route}") return pathname === "/{route}";
    return pathname.startsWith(tab[1]);
  }});
  const activeTab = currentTabIndex === -1 ? 0 : currentTabIndex;

  const handleTabChange = (event, newValue) => {{
    router.push(TABS[newValue][1]);
  }};

  return (
    <Box>
      <Box sx={{{{ mb: 3 }}}}>
        <Typography variant="h5" fontWeight="bold">
          {data['title']}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data['description']}
        </Typography>
      </Box>

      <Box sx={{{{ borderBottom: 1, borderColor: "divider", mb: 3 }}}}>
        <Tabs
          value={{activeTab}}
          onChange={{handleTabChange}}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
        >
          {{TABS.map((tab, idx) => (
            <Tab key={{idx}} label={{tab[0]}} sx={{{{ textTransform: 'none', fontWeight: 500 }}}} />
          ))}}
        </Tabs>
      </Box>

      {{children}}
    </Box>
  );
}}
"""
    with open(os.path.join(route_dir, "layout.js"), "w") as f:
        f.write(layout_content)
        
print("Scaffolding remaining layouts complete.")
