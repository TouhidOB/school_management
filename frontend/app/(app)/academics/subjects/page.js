"use client";

import InlineCrud from "@/components/InlineCrud";

export default function SubjectsPage() {
  return (
    <InlineCrud
      title="Subjects"
      endpoint="/subjects/"
      columns={[
        { key: "name", label: "Subject", tooltip: "The name of the subject" },
        { key: "code", label: "Code", tooltip: "Unique short code for this subject (e.g. MAT101)" },
        { key: "school_class_name", label: "Class", tooltip: "The class this subject is taught in" },
      ]}
      filters={["school_class"]}
      fields={[
        { key: "name", label: "Subject name", required: true, tooltip: "e.g. Mathematics, English" },
        { key: "code", label: "Code", required: true, tooltip: "A short, unique identifier for the subject" },
        { key: "school_class", label: "Class (optional)", type: "select", optionsEndpoint: "/classes/?page_size=200", optionLabel: "name", tooltip: "If this subject is specific to a class, select it here." },
      ]}
    />
  );
}
