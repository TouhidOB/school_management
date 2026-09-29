"use client";

import { Box, Typography } from "@mui/material";
import InlineCrud from "@/components/InlineCrud";

export default function StaffPage() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Staff Records
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage employee details, contracts, and basic salary.
        </Typography>
      </Box>

      <InlineCrud
        endpoint="/teachers/"
        name="Staff Member"
        columns={[
          { key: "full_name", label: "Full Name" },
          { key: "employee_id", label: "Employee ID" },
          { key: "designation_name", label: "Designation" },
          { key: "phone", label: "Phone" },
          { 
            key: "salary_basic", 
            label: "Basic Salary (৳)", 
            render: (r) => r.salary_basic ? `৳${parseFloat(r.salary_basic).toLocaleString()}` : "—"
          },
          { key: "status", label: "Status", render: (r) => r.status.toUpperCase() }
        ]}
        fields={[
          { key: "full_name", label: "Full Name", required: true },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone" },
          { key: "employee_id", label: "Employee ID" },
          { 
            key: "designation", 
            label: "Designation", 
            type: "select", 
            optionsEndpoint: "/designations/?page_size=100", 
            optionLabel: "name" 
          },
          { key: "joining_date", label: "Joining Date", type: "date" },
          { 
            key: "contract_type", 
            label: "Contract Type", 
            type: "select", 
            options: [
              { value: "permanent", label: "Permanent" },
              { value: "part_time", label: "Part-time" },
              { value: "contract", label: "Contract" }
            ] 
          },
          { key: "salary_basic", label: "Basic Salary", type: "number" },
          { 
            key: "status", 
            label: "Status", 
            type: "select", 
            options: [
              { value: "active", label: "Active" },
              { value: "resigned", label: "Resigned" },
              { value: "terminated", label: "Terminated" }
            ],
            required: true
          }
        ]}
      />
    </Box>
  );
}
