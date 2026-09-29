"use client";

import { useState } from "react";
import InlineCrud from "@/components/InlineCrud";
import InvoicesTab from "@/components/InvoicesTab";

const TABS = [
  { key: "types", label: "Fee Types" },
  { key: "structures", label: "Fee Structures" },
  { key: "invoices", label: "Invoices" },
];

export default function FeesPage() {
  const [tab, setTab] = useState("types");

  return (
    <div>
      <h1 className="h3 mb-3">Fees &amp; Invoices</h1>
      <ul className="nav nav-tabs mb-3">
        {TABS.map((t) => (
          <li className="nav-item" key={t.key}>
            <button className={`nav-link ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      {tab === "types" && (
        <InlineCrud
          title=""
          endpoint="/fee-types/"
          columns={[
            { key: "name", label: "Name" },
            { key: "fee_category", label: "Category" },
            { key: "frequency", label: "Frequency" },
            { key: "is_mandatory", label: "Mandatory", render: (r) => (r.is_mandatory ? "Yes" : "No") },
          ]}
          fields={[
            { key: "name", label: "Name", required: true },
            { key: "fee_category", label: "Category", type: "select", required: true, options: [
              ["admission", "Admission"], ["idcard", "ID Card"], ["monthly", "Monthly Tuition"],
              ["exam", "Exam"], ["annual", "Annual"], ["readmission", "Re-admission"],
              ["library", "Library"], ["transport", "Transport"], ["hostel", "Hostel"], ["custom", "Custom"],
            ].map(([id, name]) => ({ id, name })) },
            { key: "frequency", label: "Frequency", type: "select", required: true, options: [
              ["onetime", "One-time"], ["monthly", "Monthly"], ["termly", "Per Term"],
              ["annual", "Annually"], ["eventbased", "Event-based"],
            ].map(([id, name]) => ({ id, name })) },
            { key: "is_mandatory", label: "Mandatory", type: "checkbox" },
          ]}
        />
      )}

      {tab === "structures" && (
        <InlineCrud
          title=""
          endpoint="/fee-structures/"
          help="Amount for a fee type in a year. Leave class blank to apply to all classes."
          columns={[
            { key: "fee_type_name", label: "Fee type" },
            { key: "class_name", label: "Class" },
            { key: "amount", label: "Amount", render: (r) => `৳${r.amount}` },
          ]}
          fields={[
            { key: "fee_type", label: "Fee type", type: "select", optionsEndpoint: "/fee-types/?page_size=200", optionLabel: "name", required: true },
            { key: "academic_year", label: "Academic year", type: "select", optionsEndpoint: "/academic-years/?page_size=200", optionLabel: "name", required: true },
            { key: "applicable_class", label: "Class (blank = all)", type: "select", optionsEndpoint: "/classes/?page_size=200", optionLabel: "name" },
            { key: "amount", label: "Amount", type: "number", required: true },
          ]}
        />
      )}

      {tab === "invoices" && <InvoicesTab />}
    </div>
  );
}
