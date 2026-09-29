import os

routes = {
    "academics": {
        "title": "Academics",
        "description": "Manage curriculum, syllabus, classes, and subjects.",
        "tabs": [("Overview", "/academics"), ("Classes", "/classes"), ("Sections", "/sections"), ("Subjects", "/subjects"), ("Academic Years", "/academic-years")]
    },
    "timetable": {
        "title": "Timetable",
        "description": "Manage class and teacher schedules.",
        "tabs": [("Class Timetable", "/timetable"), ("Teacher Timetable", "/timetable/teachers"), ("Conflicts", "/timetable/conflicts")]
    },
    "hr": {
        "title": "HR & Payroll",
        "description": "Manage staff, attendance, leaves, and payroll.",
        "tabs": [("Overview", "/hr"), ("Staff", "/school-accounts"), ("Designations", "/designations"), ("Attendance", "/staff-attendance"), ("Leaves", "/leaves")]
    },
    "library": {
        "title": "Library",
        "description": "Manage books, members, and issuing.",
        "tabs": [("Overview", "/library"), ("Books", "/library-books"), ("Issue/Return", "/library-issues")]
    },
    "transport": {
        "title": "Transport",
        "description": "Manage vehicles, routes, and allocations.",
        "tabs": [("Overview", "/transport"), ("Vehicles", "/transport-vehicles"), ("Routes", "/transport-routes"), ("Allocation", "/transport-allocation")]
    },
    "hostel": {
        "title": "Hostel",
        "description": "Manage buildings, rooms, and student allocation.",
        "tabs": [("Overview", "/hostel"), ("Hostels", "/hostels"), ("Rooms", "/hostel-rooms"), ("Allocation", "/hostel-allocation")]
    },
    "inventory": {
        "title": "Inventory & Assets",
        "description": "Manage products, suppliers, and issues.",
        "tabs": [("Overview", "/inventory"), ("Items", "/inventory-items"), ("Categories", "/inventory-categories"), ("Suppliers", "/inventory-suppliers"), ("Issues", "/inventory-issues")]
    },
    "communication": {
        "title": "Communication",
        "description": "Send announcements, notices, and messages.",
        "tabs": [("Announcements", "/communication"), ("Messages", "/communication/messages")]
    },
    "events": {
        "title": "Events & Calendar",
        "description": "Manage school events, holidays, and meetings.",
        "tabs": [("Calendar", "/events"), ("List", "/events/list")]
    },
    "reports": {
        "title": "Interactive Reports",
        "description": "View comprehensive academic, financial, and operational reports.",
        "tabs": [("Student", "/reports"), ("Academic", "/reports/academic"), ("Finance", "/reports/finance"), ("HR", "/reports/hr")]
    },
    "school-settings": {
        "title": "School Setup",
        "description": "Manage your school's core structural information.",
        "tabs": [("Profile", "/school-settings"), ("Branches", "/school-settings/branches")]
    },
    "homework": {
        "title": "Homework & Assignments",
        "description": "Track assignments and student submissions.",
        "tabs": [("Homework", "/homework"), ("Assignments", "/homework/assignments")]
    }
}

base_dir = "frontend/app/(app)"

for route, data in routes.items():
    route_dir = os.path.join(base_dir, route)
    os.makedirs(route_dir, exist_ok=True)
    
    # Create layout.js
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
        
    # Create page.js (Overview)
    page_content = f""""use client";

import {{ Box, Card, CardContent, Typography, Grid, Button }} from "@mui/material";
import Link from "next/link";

export default function OverviewPage() {{
  return (
    <Box>
      <Grid container spacing={{3}}>
        <Grid item xs={{12}}>
          <Card elevation={{0}} sx={{{{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}}}>
            <CardContent sx={{{{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}}}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {data['title']} Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{{{ mb: 2 }}}}>
                Select a tab above to manage specific records or configurations.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}}
"""
    with open(os.path.join(route_dir, "page.js"), "w") as f:
        f.write(page_content)

print("Scaffolding complete.")
