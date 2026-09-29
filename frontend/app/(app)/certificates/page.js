"use client";

import InlineCrud from "@/components/InlineCrud";

export default function CertificatesPage() {
  return (
    <InlineCrud
      title="Certificates"
      endpoint="/certificates/"
      help="Bodies support {placeholders} like {student_name}, {class}, {date}."
      columns={[
        { key: "student_name", label: "Student" },
        { key: "cert_type_display", label: "Type" },
        { key: "title", label: "Title" },
        { key: "issue_date", label: "Issued" },
        { key: "id", label: "Print", render: (r) => (
          <a href={`/print/certificate/${r.id}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-printer" />
          </a>
        ) },
      ]}
      fields={[
        { key: "student", label: "Student", type: "select", optionsEndpoint: "/students/?page_size=500", optionLabelFn: (o) => `${o.full_name} (${o.admission_number})`, required: true },
        { key: "cert_type", label: "Type", type: "select", required: true, options: [
          { id: "custom", name: "Custom Certificate" },
          { id: "testimonial", name: "Testimonial" },
          { id: "transfer", name: "Transfer Certificate" },
        ] },
        { key: "title", label: "Title", required: true },
        { key: "reference_no", label: "Reference no." },
        { key: "issue_date", label: "Issue date", type: "date", required: true },
        { key: "body", label: "Body", type: "textarea", required: true },
        { key: "signatory_name", label: "Signatory name" },
        { key: "signatory_designation", label: "Signatory designation" },
      ]}
    />
  );
}
