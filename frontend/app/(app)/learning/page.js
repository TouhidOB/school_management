"use client";

import { Box, Link as MuiLink } from "@mui/material";
import InlineCrud from "@/components/InlineCrud";

export default function StudyMaterialsPage() {
  const columns = [
    { key: "title", label: "Title" },
    { key: "class_name", label: "Class" },
    { key: "subject_name", label: "Subject" },
    { 
      key: "url", 
      label: "Resource Link", 
      render: (row) => row.url ? <MuiLink href={row.url} target="_blank" rel="noopener">Open Link</MuiLink> : "—"
    }
  ];

  const fields = [
    { key: "title", label: "Material Title", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "school_class", label: "Class", type: "select", required: true, optionsEndpoint: "/classes/", optionLabel: "name" },
    { key: "subject", label: "Subject", type: "select", required: true, optionsEndpoint: "/subjects/", optionLabel: "name" },
    { key: "url", label: "Resource URL (Drive/PDF/Video)", required: true, tooltip: "Must be a valid web link (http/https)." },
  ];

  return (
    <Box>
      <InlineCrud
        endpoint="/study-materials/"
        itemLabel="study material"
        columns={columns}
        fields={fields}
      />
    </Box>
  );
}
