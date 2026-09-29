"use client";

import { Box, Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SchoolIcon from "@mui/icons-material/School";
import FaceIcon from "@mui/icons-material/Face";
import BadgeIcon from "@mui/icons-material/Badge";

export default function RolesSettingsPage() {
  const roles = [
    {
      title: "Super Admin",
      description: "Platform owner. Manages global settings, subscription plans, tenants (schools), and platform-wide billing.",
      icon: <SecurityIcon color="error" />
    },
    {
      title: "School Admin",
      description: "Tenant owner. Has full access to their specific school's configuration, users, academics, and finance records.",
      icon: <AdminPanelSettingsIcon color="primary" />
    },
    {
      title: "Teacher",
      description: "Academic staff. Can manage student attendance, homework, exams, and grades for their assigned classes/sections.",
      icon: <SchoolIcon color="secondary" />
    },
    {
      title: "Student",
      description: "End user. Can view their own routine, attendance records, exam results, assignments, and outstanding fee invoices.",
      icon: <FaceIcon color="info" />
    },
    {
      title: "Staff",
      description: "Operational staff (e.g., HR, Transport Manager, Librarian). Access is restricted to their specific operational domains.",
      icon: <BadgeIcon color="warning" />
    }
  ];

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
        System Roles & Permissions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        This platform uses a fixed Role-Based Access Control (RBAC) architecture. 
        Permissions are automatically enforced based on the user's role assignment.
      </Typography>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <List sx={{ p: 0 }}>
          {roles.map((role, idx) => (
            <Box key={idx}>
              <ListItem sx={{ py: 3, px: 3 }}>
                <ListItemIcon sx={{ mr: 2 }}>
                  {role.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="subtitle1" fontWeight="bold">{role.title}</Typography>} 
                  secondary={<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{role.description}</Typography>} 
                />
              </ListItem>
              {idx < roles.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Card>
    </Box>
  );
}
