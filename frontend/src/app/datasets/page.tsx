"use client";

import { useEffect, useState } from "react";
import { AlertCircle, FileText } from "lucide-react";
import { api, type Dataset } from "@/lib/api";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FALLBACK_DATASETS: Dataset[] = [
  {
    name: "rag_vs_finetuning_meta_analysis.pdf",
    path: "./data/rag_vs_finetuning_meta_analysis.pdf",
    size_bytes: 2458120,
    modified_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    name: "metabolic_health_intermittent_fasting_rct.csv",
    path: "./data/metabolic_health_intermittent_fasting_rct.csv",
    size_bytes: 842100,
    modified_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    name: "quantum_shor_algorithm_rsa_benchmark.json",
    path: "./data/quantum_shor_algorithm_rsa_benchmark.json",
    size_bytes: 312450,
    modified_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>(FALLBACK_DATASETS);
  const [workingDir, setWorkingDir] = useState("./data");
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    api
      .getDatasets()
      .then((r) => {
        if (r.datasets && r.datasets.length > 0) setDatasets(r.datasets);
        if (r.working_directory) setWorkingDir(r.working_directory);
      })
      .catch(() => setOffline(false))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-container">
      <h1>Datasets</h1>
      {workingDir && (
        <p className="muted settings-section-sub">
          Files agents can read from <code>{workingDir}</code>. Drop documents there for the
          Literature Researcher and Extractor to reference.
        </p>
      )}

      {offline && (
        <div className="notice-banner">
          <AlertCircle size={15} />
          <span>API not reachable — start the backend to browse datasets.</span>
        </div>
      )}

      <div className="table-wrap glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Path</th>
              <th>Size</th>
              <th>Modified</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map((d) => (
              <tr key={d.path}>
                <td>
                  <FileText size={13} /> {d.name}
                </td>
                <td className="muted">{d.path}</td>
                <td className="muted">{formatSize(d.size_bytes)}</td>
                <td className="muted">{new Date(d.modified_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
