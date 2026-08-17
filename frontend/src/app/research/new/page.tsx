"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Paperclip, X } from "lucide-react";
import { api, type ResearchDepth } from "@/lib/api";

function ResearchNewInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [question, setQuestion] = useState(params.get("q") ?? "");
  const [depth, setDepth] = useState<ResearchDepth>("standard");
  const [fileInput, setFileInput] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);

  function addFile() {
    if (fileInput.trim()) {
      setFiles([...files, fileInput.trim()]);
      setFileInput("");
    }
  }

  async function start() {
    if (!question.trim() || starting) return;
    setStarting(true);
    try {
      const { id } = await api.startResearch(question.trim(), depth, files);
      router.push(`/research/${id}/run`);
    } catch {
      setStarting(false);
    }
  }

  return (
    <main className="page-container">
      <button className="back-link" onClick={() => router.push("/")}>
        <ArrowLeft size={15} /> Edit Question
      </button>

      <section className="config-section glass-card">
        <h1>Configure Research</h1>

        <label className="field-label">Research Question</label>
        <textarea
          className="config-textarea"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
        />

        <label className="field-label">Research Depth</label>
        <div className="depth-selector">
          {(["quick", "standard", "deep"] as ResearchDepth[]).map((d) => (
            <button
              key={d}
              className={`depth-pill${depth === d ? " depth-pill-active" : ""}`}
              onClick={() => setDepth(d)}
            >
              {d}
            </button>
          ))}
        </div>

        <label className="field-label">Uploaded Documents (optional)</label>
        <div className="file-input-row">
          <input
            className="config-text-input"
            value={fileInput}
            onChange={(e) => setFileInput(e.target.value)}
            placeholder="Path or URL to a document"
            onKeyDown={(e) => e.key === "Enter" && addFile()}
          />
          <button className="button-secondary" onClick={addFile}>
            <Paperclip size={14} /> Add
          </button>
        </div>
        {files.length > 0 && (
          <ul className="file-list">
            {files.map((f, i) => (
              <li key={i}>
                <span>{f}</span>
                <button onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="field-label">Output</label>
        <ul className="output-preview-list">
          <li>Research brief with executive summary</li>
          <li>Evidence citations for every claim</li>
          <li>Contradictory findings surfaced by the Challenger agent</li>
          <li>Research gaps and limitations</li>
        </ul>

        <button
          className="button-primary config-start-button"
          disabled={!question.trim() || starting}
          onClick={start}
        >
          {starting ? "Starting…" : "Start Research"}
          <ArrowRight size={16} />
        </button>
      </section>
    </main>
  );
}

export default function ResearchNewPage() {
  return (
    <Suspense fallback={null}>
      <ResearchNewInner />
    </Suspense>
  );
}
