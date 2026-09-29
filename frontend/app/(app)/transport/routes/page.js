"use client";

import InlineCrud from "@/components/InlineCrud";

export default function TransportRoutesPage() {
  return (
    <InlineCrud
      title="Bus Routes"
      endpoint="/transport/routes/"
      columns={[
        { key: "name", label: "Route Name" },
        { key: "vehicle_number", label: "Vehicle" },
        { key: "start_point", label: "Start Point" },
        { key: "end_point", label: "End Point" },
        { key: "monthly_fare", label: "Monthly Fare" }
      ]}
      fields={[
        { key: "name", label: "Route Name", required: true },
        { key: "vehicle", label: "Vehicle", type: "select", optionsEndpoint: "/transport/vehicles/", optionLabelFn: (o) => `${o.vehicle_number} (${o.capacity} seats)` },
        { key: "start_point", label: "Start Point", required: true },
        { key: "end_point", label: "End Point", required: true },
        { key: "monthly_fare", label: "Monthly Fare", type: "number", required: true }
      ]}
    />
  );
}
