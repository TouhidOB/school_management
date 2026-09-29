"use client";

import InlineCrud from "@/components/InlineCrud";

export default function AcademicYearsPage() {
  return (
    <InlineCrud
      title="Academic Years"
      endpoint="/academic-years/"
      columns={[
        { key: "name", label: "Year", tooltip: "The name of the academic session (e.g. 2026 or 2026-2027)" },
        { key: "start_date", label: "Start" },
        { key: "end_date", label: "End" },
        { key: "is_current", label: "Current", render: (r) => (r.is_current ? "Yes" : "No"), tooltip: "Is this the active academic year?" },
      ]}
      fields={[
        { key: "name", label: "Name", required: true, tooltip: "e.g. 2026 or 2026-2027" },
        { key: "start_date", label: "Start date", type: "date" },
        { key: "end_date", label: "End date", type: "date" },
        { key: "is_current", label: "Current year", type: "checkbox", tooltip: "Only one academic year should be current at a time." },
      ]}
    />
  );
}
