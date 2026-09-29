"use client";

import { Box, Link as MuiLink } from "@mui/material";
import InlineCrud from "@/components/InlineCrud";

export default function LiveClassesPage() {
  const columns = [
    { key: "topic", label: "Topic" },
    { key: "class_name", label: "Class" },
    { key: "subject_name", label: "Subject" },
    { key: "date", label: "Date" },
    { key: "start_time", label: "Time" },
    { 
      key: "meeting_url", 
      label: "Meeting Link", 
      render: (row) => row.meeting_url ? <MuiLink href={row.meeting_url} target="_blank" rel="noopener">Join Class</MuiLink> : "—"
    }
  ];

  const fields = [
    { key: "topic", label: "Class Topic", required: true },
    { key: "school_class", label: "Class", type: "select", required: true, optionsEndpoint: "/classes/", optionLabel: "name" },
    { key: "subject", label: "Subject", type: "select", required: true, optionsEndpoint: "/subjects/", optionLabel: "name" },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "start_time", label: "Start Time", type: "time", required: true },
    { key: "duration_minutes", label: "Duration (mins)", type: "number", required: true },
    { key: "meeting_url", label: "Meeting Link (Zoom/Meet)", required: true, tooltip: "Must be a valid web link (http/https)." },
  ];

  return (
    <Box>
      <InlineCrud
        endpoint="/online-classes/"
        itemLabel="live class"
        columns={columns}
        fields={fields}
      />
    </Box>
  );
}
