import { Suspense } from "react";
import ResearchForm from "./ResearchForm";

export const dynamic = "force-dynamic";

export default function ResearchNewPage() {
  return (
    <Suspense fallback={<main className="page-container"><p className="muted">Loading…</p></main>}>
      <ResearchForm />
    </Suspense>
  );
}
