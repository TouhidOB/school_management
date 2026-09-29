"use client";

import { Box, Typography } from "@mui/material";
import InlineCrud from "@/components/InlineCrud";

export default function DesignationsPage() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Staff Designations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Define job titles and department roles for your staff.
        </Typography>
      </Box>

      <InlineCrud
        endpoint="/designations/"
        name="Designation"
        columns={[
          { key: "name", label: "Designation Title" },
          { key: "description", label: "Description" }
        ]}
        fields={[
          { key: "name", label: "Title (e.g. Senior Teacher)", required: true },
          { key: "description", label: "Description", type: "text" }
        ]}
      />
    </Box>
  );
}
