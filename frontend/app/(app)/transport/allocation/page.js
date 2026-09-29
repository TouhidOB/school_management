"use client";

import InlineCrud from "@/components/InlineCrud";

export default function TransportAllocationPage() {
  return (
    <InlineCrud
      title="Transport Allocation"
      endpoint="/transport/allocations/"
      help="Assign students to transport routes. You will receive an error if the vehicle assigned to the route has reached its seating capacity."
      columns={[
        { key: "student_name", label: "Student" },
        { key: "route_name", label: "Route" },
        { key: "pickup_point", label: "Pickup Point" }
      ]}
      fields={[
        { key: "student", label: "Student", type: "select", optionsEndpoint: "/students/", optionLabelFn: (o) => `${o.full_name} (${o.admission_number})`, required: true },
        { key: "route", label: "Route", type: "select", optionsEndpoint: "/transport/routes/", required: true },
        { key: "pickup_point", label: "Pickup Point", required: true }
      ]}
    />
  );
}
