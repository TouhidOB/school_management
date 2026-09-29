"use client";

import { Box, Typography } from "@mui/material";
import InlineCrud from "@/components/InlineCrud";

export default function EventsListPage() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">Events List</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage all academic events, holidays, and meetings.
        </Typography>
      </Box>
      <InlineCrud
        endpoint="/academics/events/"
        name="Event"
        columns={[
          { key: "title", label: "Event Title" },
          { key: "event_type", label: "Type", render: (r) => r.event_type?.toUpperCase() },
          { key: "start_date", label: "Start Date" },
          { key: "end_date", label: "End Date", render: (r) => r.end_date || "-" }
        ]}
        fields={[
          { key: "title", label: "Event Title", required: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "start_date", label: "Start Date (YYYY-MM-DD)", type: "date", required: true },
          { key: "end_date", label: "End Date (YYYY-MM-DD)", type: "date" },
          { 
            key: "event_type", 
            label: "Event Type", 
            type: "select",
            options: [
              { value: "event", label: "Standard Event" },
              { value: "holiday", label: "Holiday" },
              { value: "meeting", label: "Meeting" },
              { value: "exam", label: "Exam" }
            ]
          }
        ]}
      />
    </Box>
  );
}
