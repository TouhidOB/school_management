"use client";

import ModuleGuard from "@/components/ModuleGuard";

export default function Layout({ children }) {
  return (
    <ModuleGuard moduleKey="exStudents">
      {children}
    </ModuleGuard>
  );
}
