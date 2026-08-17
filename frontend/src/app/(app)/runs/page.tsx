import { Suspense } from "react";
import RunsContent from "./RunsContent";

export const dynamic = "force-dynamic";

export default function ResearchRunsPage() {
  return (
    <Suspense fallback={<main className="page-container"><p className="muted">Loading runs…</p></main>}>
      <RunsContent />
    </Suspense>
  );
}
