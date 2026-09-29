"use client";

import Link from "next/link";
import InlineCrud from "@/components/InlineCrud";

export default function ExamsPage() {
  return (
    <InlineCrud
      title="Exam Sessions"
      endpoint="/exam-sessions/"
      help="Create a session, then open it to add exam subjects and enter marks."
      columns={[
        { key: "name", label: "Session" },
        { key: "academic_year_name", label: "Year" },
        { key: "start_date", label: "Start" },
        { key: "is_published", label: "Published", render: (r) => (r.is_published ? "Yes" : "No") },
        { key: "id", label: "", render: (r) => <Link href={`/exams/${r.id}`} className="btn btn-sm btn-outline-primary">Manage</Link> },
      ]}
      fields={[
        { key: "name", label: "Name (e.g. Half-Yearly 2026)", required: true },
        { key: "academic_year", label: "Academic year", type: "select", optionsEndpoint: "/academic-years/?page_size=200", optionLabel: "name", required: true },
        { key: "start_date", label: "Start date", type: "date" },
        { key: "end_date", label: "End date", type: "date" },
        { key: "is_published", label: "Published", type: "checkbox" },
      ]}
    />
  );
}
