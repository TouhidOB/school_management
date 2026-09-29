import os

sub_routes = [
    "attendance/reports",
    "exams/schedule",
    "exams/marks",
    "exams/results",
    "certificates/generate",
    "certificates/types",
    "settings/roles",
    "settings/notifications",
    "academics/academic-years",
    "timetable/conflicts",
    "timetable/teachers",
    "hr/staff",
    "hr/designations",
    "hr/attendance",
    "hr/leaves",
    "library/books",
    "library/issues",
    "transport/vehicles",
    "transport/routes",
    "transport/allocation",
    "hostel/hostels",
    "hostel/rooms",
    "hostel/allocation",
    "inventory/items",
    "inventory/categories",
    "inventory/suppliers",
    "inventory/issues",
    "communication/messages",
    "events/list",
    "reports/academic",
    "reports/finance",
    "reports/hr",
    "school-settings/branches",
    "homework/assignments"
]

base_dir = "frontend/app/(app)"

for sub in sub_routes:
    route_dir = os.path.join(base_dir, sub)
    os.makedirs(route_dir, exist_ok=True)
    
    page_content = f""""use client";

import {{ Box, Card, CardContent, Typography }} from "@mui/material";

export default function PlaceholderPage() {{
  return (
    <Box>
      <Card elevation={{0}} sx={{{{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}}}>
        <CardContent sx={{{{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}}}>
          <Box textAlign="center">
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The {sub} module is currently under development.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}}
"""
    with open(os.path.join(route_dir, "page.js"), "w") as f:
        f.write(page_content)

print("Placeholders created.")
