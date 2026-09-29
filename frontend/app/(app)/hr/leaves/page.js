"use client";

import { Box, Typography } from "@mui/material";
import InlineCrud from "@/components/InlineCrud";

export default function StaffLeavesPage() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Staff Leave Applications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track, approve, and manage staff leave requests.
        </Typography>
      </Box>

      <InlineCrud
        endpoint="/staff-leaves/"
        name="Leave Application"
        columns={[
          { key: "teacher_name", label: "Staff Name" },
          { key: "from_date", label: "From Date" },
          { key: "to_date", label: "To Date" },
          { key: "reason", label: "Reason" },
          { key: "status", label: "Status", render: (r) => r.status.toUpperCase() },
          { key: "reviewed_by_name", label: "Reviewed By" }
        ]}
        fields={[
          { 
            key: "teacher", 
            label: "Staff Member", 
            type: "select", 
            optionsEndpoint: "/teachers/?status=active&page_size=500", 
            optionLabel: "display_name",
            required: true
          },
          { key: "from_date", label: "From Date", type: "date", required: true },
          { key: "to_date", label: "To Date", type: "date", required: true },
          { key: "reason", label: "Reason", type: "text", required: true },
          { 
            key: "status", 
            label: "Status", 
            type: "select", 
            options: [
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" }
            ],
            required: true
          }
        ]}
      />
    </Box>
  );
}
