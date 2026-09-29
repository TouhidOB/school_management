"use client";

import InlineCrud from "@/components/InlineCrud";

export default function InventorySuppliersPage() {
  return (
    <InlineCrud
      title="Suppliers"
      endpoint="/inventory/suppliers/"
      columns={[
        { key: "name", label: "Supplier Name" },
        { key: "contact_person", label: "Contact Person" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" }
      ]}
      fields={[
        { key: "name", label: "Supplier Name", required: true },
        { key: "contact_person", label: "Contact Person" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email", type: "email" },
        { key: "address", label: "Address", type: "textarea" }
      ]}
    />
  );
}
