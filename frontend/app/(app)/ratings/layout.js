"use client";

import ModuleGuard from "@/components/ModuleGuard";

export default function RatingsLayout({ children }) {
  return (
    <ModuleGuard moduleKey="ratings">
      {children}
    </ModuleGuard>
  );
}
