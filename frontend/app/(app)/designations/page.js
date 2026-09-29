"use client";

import InlineCrud from "@/components/InlineCrud";

export default function DesignationsPage() {
  return (
    <InlineCrud
      title="Designations"
      endpoint="/designations/"
      help="Staff designation ladder. Lower rank order = more senior."
      columns={[
        { key: "rank_order", label: "Rank" },
        { key: "name", label: "Designation" },
      ]}
      fields={[
        { key: "name", label: "Name (Principal, Head Teacher, …)", required: true },
        { key: "rank_order", label: "Rank order (0 = most senior)", type: "number" },
      ]}
    />
  );
}
