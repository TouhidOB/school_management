"use client";

import InlineCrud from "@/components/InlineCrud";

export default function HostelsPage() {
  return (
    <InlineCrud
      title="Hostels"
      endpoint="/hostel/hostels/"
      columns={[
        { key: "name", label: "Hostel Name" },
        { key: "type", label: "Type" },
        { key: "warden_name", label: "Warden" },
        { key: "warden_phone", label: "Phone" }
      ]}
      fields={[
        { key: "name", label: "Hostel Name", required: true },
        { key: "type", label: "Type", type: "select", options: [{id: "boys", name: "Boys"}, {id: "girls", name: "Girls"}, {id: "coed", name: "Co-ed"}], required: true },
        { key: "address", label: "Address", type: "textarea" },
        { key: "warden_name", label: "Warden Name", required: true },
        { key: "warden_phone", label: "Warden Phone", required: true }
      ]}
    />
  );
}
