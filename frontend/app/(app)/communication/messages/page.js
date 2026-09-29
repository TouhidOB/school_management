"use client";

import { Box, Typography } from "@mui/material";
import InlineCrud from "@/components/InlineCrud";

export default function MessagesPage() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">Direct Messages</Typography>
        <Typography variant="body2" color="text.secondary">
          Send direct messages and alerts to specific users.
        </Typography>
      </Box>
      <InlineCrud
        endpoint="/notifications/"
        name="Message"
        columns={[
          { key: "recipient", label: "Recipient ID" },
          { key: "title", label: "Subject" },
          { key: "channel", label: "Channel", render: (r) => r.channel?.toUpperCase() },
          { key: "status", label: "Status", render: (r) => r.status?.toUpperCase() }
        ]}
        fields={[
          { 
            key: "recipient", 
            label: "Recipient (User)", 
            type: "select",
            optionsEndpoint: "/users/?page_size=500",
            optionLabel: "email",
            required: true 
          },
          { key: "title", label: "Subject", required: true },
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
