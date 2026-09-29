"use client";

import InlineCrud from "@/components/InlineCrud";

export default function TransportVehiclesPage() {
  return (
    <InlineCrud
      title="Vehicles"
      endpoint="/transport/vehicles/"
      columns={[
        { key: "vehicle_number", label: "Vehicle Number" },
        { key: "model", label: "Model" },
        { key: "capacity", label: "Capacity" },
        { key: "driver_name", label: "Driver Name" },
        { key: "driver_phone", label: "Driver Phone" }
      ]}
      fields={[
        { key: "vehicle_number", label: "Vehicle Number (e.g. BUS-101)", required: true },
        { key: "model", label: "Model" },
        { key: "capacity", label: "Seating Capacity", type: "number", required: true },
        { key: "driver_name", label: "Driver Name", required: true },
        { key: "driver_phone", label: "Driver Phone", required: true }
      ]}
    />
  );
}
