"use client";

import ModuleGuard from "@/components/ModuleGuard";

export default function BiometricLayout({ children }) {
  return (
    <ModuleGuard moduleKey="biometric">
      {children}
    </ModuleGuard>
  );
}
