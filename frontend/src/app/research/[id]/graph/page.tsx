"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { EvidenceGraphCanvas } from "@/components/EvidenceGraphCanvas";
import type { GraphNodeData } from "@/components/EvidencePanel";
import type { GraphEdgeData } from "@/components/EvidenceGraphCanvas";

export default function EvidenceGraphPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ nodes: GraphNodeData[]; edges: GraphEdgeData[] } | null>(null);

  useEffect(() => {
    api.getGraph(id).then((d) => setData(d as never)).catch(() => setData({ nodes: [], edges: [] }));
  }, [id]);

  if (!data) return <main className="page-container"><p className="muted">Loading graph…</p></main>;

  return (
    <main className="page-container run-page">
      <Link href={`/research/${id}`} className="back-link">
        <ArrowLeft size={15} /> Back to report
      </Link>
      <h1 className="graph-title">Evidence Graph</h1>
      <EvidenceGraphCanvas nodesData={data.nodes} edgesData={data.edges} />
    </main>
  );
}
