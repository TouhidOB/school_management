"use client";

import Link from "next/link";
import InlineCrud from "@/components/InlineCrud";

export default function RoomsPage() {
  return (
    <InlineCrud
      title="Classrooms"
      endpoint="/rooms/"
      help="Collaborative spaces (subject × section). A join code is generated automatically."
      columns={[
        { key: "name", label: "Room" },
        { key: "room_code", label: "Code", render: (r) => <code>{r.room_code}</code> },
        { key: "subject_name", label: "Subject" },
        { key: "section_name", label: "Section" },
        { key: "is_active", label: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
        { key: "id", label: "Open", render: (r) => <Link href={`/rooms/${r.id}`} className="btn btn-sm btn-outline-primary">Open</Link> },
      ]}
      fields={[
        { key: "name", label: "Room name", required: true },
        { key: "subject", label: "Subject", type: "select", optionsEndpoint: "/subjects/?page_size=500", optionLabelFn: (o) => `${o.name} (${o.code})`, required: true },
        { key: "section", label: "Section", type: "select", optionsEndpoint: "/sections/?page_size=500", optionLabelFn: (o) => `${o.school_class_name} - ${o.name}`, required: true },
        { key: "academic_year", label: "Academic year", type: "select", optionsEndpoint: "/academic-years/?page_size=200", optionLabel: "name", required: true },
        { key: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
