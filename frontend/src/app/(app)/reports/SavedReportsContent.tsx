"use client";

import { CompletedRunsList } from "@/components/CompletedRunsList";

export default function SavedReportsContent() {
  return (
    <CompletedRunsList
      title="Saved Reports"
      emptyText="No completed reports yet — finished research runs show up here."
      offlineText="API not reachable — start the backend to browse saved reports."
      linkFor={(item) => `/research/${item.id}`}
    />
  );
}
