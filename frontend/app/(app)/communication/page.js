"use client";

import { Box, Typography } from "@mui/material";
import InlineCrud from "@/components/InlineCrud";

export default function AnnouncementsPage() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">School Announcements</Typography>
        <Typography variant="body2" color="text.secondary">
          Broadcast notices to all staff and students.
        </Typography>
      </Box>
      <InlineCrud
        endpoint="/notifications/"
        name="Announcement"
        columns={[
          { key: "title", label: "Title" },
          { key: "channel", label: "Channel", render: (r) => r.channel?.toUpperCase() },
          { key: "status", label: "Status", render: (r) => r.status?.toUpperCase() },
          { key: "created_at", label: "Date Created", render: (r) => new Date(r.created_at).toLocaleDateString() }
        ]}
        fields={[
          { key: "title", label: "Announcement Title", required: true },
          { key: "body", label: "Message Body", type: "textarea", required: true },
          { 
            key: "channel", 
            label: "Delivery Channel", 
            type: "select", 
            options: [
              { value: "in_app", label: "In-App Notice" },
              { value: "email", label: "Email" },
              { value: "sms", label: "SMS" },
              { value: "push", label: "Push Notification" }
            ],
            required: true 
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "queued", label: "Queued" },
              { value: "sent", label: "Sent" }
            ],
            required: true
          }
        ]}
      />
    </Box>
  );
}
