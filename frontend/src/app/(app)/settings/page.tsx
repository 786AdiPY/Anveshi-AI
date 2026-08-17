import { Suspense } from "react";
import SettingsContent from "./SettingsContent";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <Suspense fallback={<main className="page-container"><p className="muted">Loading settings…</p></main>}>
      <SettingsContent />
    </Suspense>
  );
}
