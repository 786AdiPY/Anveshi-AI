import { Suspense } from "react";
import SavedReportsContent from "./SavedReportsContent";

export const dynamic = "force-dynamic";

export default function SavedReportsPage() {
  return (
    <Suspense fallback={<main className="page-container"><p className="muted">Loading reports…</p></main>}>
      <SavedReportsContent />
    </Suspense>
  );
}
