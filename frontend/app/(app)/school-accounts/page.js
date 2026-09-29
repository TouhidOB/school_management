"use client";

import { Box, Typography } from "@mui/material";
import InlineCrud from "@/components/InlineCrud";

const columns = [
  { key: "username", label: "Username" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "role_display", label: "Role", readonly: true },
  { 
    key: "role", 
    label: "Assign Role", 
    type: "select",
    hideInTable: true,
    options: [
      { value: "school_admin", label: "School Admin" },
      { value: "teacher", label: "Teacher" },
      { value: "student", label: "Student" },
      { value: "staff", label: "Staff" }
    ]
  },
  { key: "password", label: "Password (leave blank to keep)", type: "password", hideInTable: true }
];

export default function SchoolAccountsPage() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          School User Accounts
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage logins and platform access roles for all personnel.
        </Typography>
      </Box>

      <InlineCrud
        endpoint="/accounts/users/"
        name="User Account"
        columns={columns}
      />
    </Box>
  );
}
