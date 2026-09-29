"use client";

import InlineCrud from "@/components/InlineCrud";

export default function HostelAllocationPage() {
  return (
    <InlineCrud
      title="Hostel Allocation"
      endpoint="/hostel/allocations/"
      help="Assign students to hostel rooms. You will receive an error if the room has reached its capacity."
      columns={[
        { key: "student_name", label: "Student" },
        { key: "hostel_name", label: "Hostel" },
        { key: "room_number", label: "Room" },
        { key: "allocation_date", label: "Date" }
      ]}
      fields={[
        { key: "student", label: "Student", type: "select", optionsEndpoint: "/students/", optionLabelFn: (o) => `${o.full_name} (${o.admission_number})`, required: true },
        { key: "room", label: "Room", type: "select", optionsEndpoint: "/hostel/rooms/", optionLabelFn: (o) => `${o.hostel_name} - ${o.room_number}`, required: true },
        { key: "allocation_date", label: "Allocation Date", type: "date", required: true }
      ]}
    />
  );
}
