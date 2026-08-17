"use client";

import { useEffect, useState } from "react";
import { AlertCircle, FileText } from "lucide-react";
import { api, type Dataset } from "@/lib/api";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [workingDir, setWorkingDir] = useState("");
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    api
      .getDatasets()
      .then((r) => {
        setDatasets(r.datasets);
        setWorkingDir(r.working_directory);
      })
      .catch(() => setOffline(true))
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

      {loading && <p className="muted">Loading…</p>}
      {!loading && !offline && datasets.length === 0 && (
        <p className="muted">No files in the working directory yet.</p>
      )}

      {datasets.length > 0 && (
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
      )}
    </main>
  );
}
