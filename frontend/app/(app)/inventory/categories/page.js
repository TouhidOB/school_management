"use client";

import InlineCrud from "@/components/InlineCrud";

export default function InventoryCategoriesPage() {
  return (
    <InlineCrud
      title="Inventory Categories"
      endpoint="/inventory/categories/"
      columns={[
        { key: "name", label: "Category Name" },
        { key: "description", label: "Description" }
      ]}
      fields={[
        { key: "name", label: "Category Name", required: true },
        { key: "description", label: "Description", type: "textarea" }
      ]}
    />
  );
}
