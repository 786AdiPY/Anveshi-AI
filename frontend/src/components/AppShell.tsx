"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell app-shell--sidebar">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <main className="app-main">{children}</main>
    </div>
  );
}
