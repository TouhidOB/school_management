"use client";

import InlineCrud from "@/components/InlineCrud";

export default function SectionsPage() {
  return (
    <InlineCrud
      title="Sections"
      endpoint="/sections/"
      columns={[
        { key: "school_class_name", label: "Class", tooltip: "The parent class for this section" },
        { key: "academic_year_name", label: "Year", tooltip: "The academic session this section belongs to" },
        { key: "name", label: "Section", tooltip: "Section name/identifier (e.g., A, B, North)" },
      ]}
      fields={[
        { key: "school_class", label: "Class", type: "select", optionsEndpoint: "/classes/?page_size=200", optionLabel: "name", required: true, tooltip: "Select the parent class." },
        { key: "academic_year", label: "Academic year", type: "select", optionsEndpoint: "/academic-years/?page_size=200", optionLabel: "name", required: true, tooltip: "Select which academic year this section is active in." },
        { key: "name", label: "Section name", required: true, tooltip: "Examples: A, B, Science, Arts" },
      ]}
    />
  );
}
