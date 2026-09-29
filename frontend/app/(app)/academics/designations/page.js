"use client";

import { Box, Typography, Breadcrumbs, Link as MuiLink } from "@mui/material";
import Link from "next/link";
import InlineCrud from "@/components/InlineCrud";

export default function DesignationsPage() {
  const columns = [
    { key: "name", label: "Designation Name", tooltip: "Job title or rank (e.g. Senior Teacher, Headmaster)." }
  ];

  const fields = [
    { key: "name", label: "Designation Name", required: true, tooltip: "Job title or rank (e.g. Senior Teacher, Headmaster)." }
  ];

  return (
    <Box>
      <InlineCrud
        endpoint="/designations/"
        itemLabel="designation"
        columns={columns}
        fields={fields}
      />
    </Box>
  );
}
