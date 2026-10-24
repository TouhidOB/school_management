"use client";

import ModuleGuard from "@/components/ModuleGuard";

export default function AdmissionsReviewLayout({ children }) {
  return (
    <ModuleGuard moduleKey="admissions">
      {children}
    </ModuleGuard>
  );
}
