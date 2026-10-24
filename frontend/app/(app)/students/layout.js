"use client";

import ModuleGuard from "@/components/ModuleGuard";

export default function StudentsLayout({ children }) {
  return (
    <ModuleGuard moduleKey="students">
      {children}
    </ModuleGuard>
  );
}
