import { Suspense } from "react";
import DatasetsContent from "./DatasetsContent";

export const dynamic = "force-dynamic";

export default function DatasetsPage() {
  return (
    <Suspense fallback={<main className="page-container"><p className="muted">Loading datasets…</p></main>}>
      <DatasetsContent />
    </Suspense>
  );
}
