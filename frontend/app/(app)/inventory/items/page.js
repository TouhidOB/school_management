"use client";

import InlineCrud from "@/components/InlineCrud";

export default function InventoryItemsPage() {
  return (
    <InlineCrud
      title="Inventory Items"
      endpoint="/inventory/items/"
      columns={[
        { key: "name", label: "Item Name" },
        { key: "category_name", label: "Category" },
        { key: "total_quantity", label: "Total Qty" },
        { key: "available_quantity", label: "Avail Qty" }
      ]}
      fields={[
        { key: "name", label: "Item Name", required: true },
        { key: "category", label: "Category", type: "select", optionsEndpoint: "/inventory/categories/", required: true },
        { key: "total_quantity", label: "Total Quantity", type: "number", required: true },
        { key: "available_quantity", label: "Available Quantity", type: "number", required: true }
      ]}
    />
  );
}
