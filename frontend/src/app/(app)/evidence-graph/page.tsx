import { Suspense } from "react";
import EvidenceGraphContent from "./EvidenceGraphContent";

export const dynamic = "force-dynamic";

export default function EvidenceGraphPage() {
  return (
    <Suspense fallback={<main className="page-container"><p className="muted">Loading evidence graph…</p></main>}>
      <EvidenceGraphContent />
    </Suspense>
  );
}
