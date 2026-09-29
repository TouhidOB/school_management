"use client";

import { Box } from "@mui/material";
import InlineCrud from "@/components/InlineCrud";

export default function DepartmentsPage() {
  const columns = [
    { key: "name", label: "Department Name", tooltip: "E.g., Science, Humanities, Mathematics." }
  ];

  const fields = [
    { key: "name", label: "Department Name", required: true, tooltip: "E.g., Science, Humanities, Mathematics." }
  ];

  return (
    <Box>
      <InlineCrud
        endpoint="/departments/"
        itemLabel="department"
        columns={columns}
        fields={fields}
      />
    </Box>
  );
}
