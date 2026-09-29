"use client";

import InlineCrud from "@/components/InlineCrud";

export default function LeavesPage() {
  return (
    <InlineCrud
      title="Leave Applications"
      endpoint="/leaves/"
      columns={[
        { key: "student_name", label: "Student" },
        { key: "from_date", label: "From" },
        { key: "to_date", label: "To" },
        { key: "status_display", label: "Status" },
      ]}
      fields={[
        { key: "student", label: "Student", type: "select", optionsEndpoint: "/students/?page_size=500", optionLabelFn: (o) => `${o.full_name} (${o.admission_number})`, required: true },
        { key: "from_date", label: "From date", type: "date", required: true },
        { key: "to_date", label: "To date", type: "date", required: true },
        { key: "reason", label: "Reason", type: "textarea", required: true },
        { key: "status", label: "Status", type: "select", options: [
          { id: "pending", name: "Pending" }, { id: "approved", name: "Approved" }, { id: "rejected", name: "Rejected" },
        ] },
      ]}
    />
  );
}
