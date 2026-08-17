import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="page-container"><p className="muted">Loading dashboard…</p></main>}>
      <DashboardContent />
    </Suspense>
  );
}
