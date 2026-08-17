"use client";

import { CompletedRunsList } from "@/components/CompletedRunsList";

export default function DatasetsContent() {
  return (
    <CompletedRunsList
      title="Datasets"
      emptyText="No datasets available — claims and papers from your research runs will appear here."
      offlineText="API not reachable — start the backend to browse datasets."
      linkFor={(item) => `/research/${item.id}`}
    />
  );
}
