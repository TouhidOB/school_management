"use client";

import InlineCrud from "@/components/InlineCrud";

export default function HostelRoomsPage() {
  return (
    <InlineCrud
      title="Hostel Rooms"
      endpoint="/hostel/rooms/"
      columns={[
        { key: "hostel_name", label: "Hostel" },
        { key: "room_number", label: "Room Number" },
        { key: "capacity", label: "Capacity (Beds)" },
        { key: "monthly_cost", label: "Monthly Cost" }
      ]}
      fields={[
        { key: "hostel", label: "Hostel", type: "select", optionsEndpoint: "/hostel/hostels/", required: true },
        { key: "room_number", label: "Room Number", required: true },
        { key: "capacity", label: "Capacity (Beds)", type: "number", required: true },
        { key: "monthly_cost", label: "Monthly Cost", type: "number", required: true }
      ]}
    />
  );
}
