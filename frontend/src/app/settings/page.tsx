"use client";

import { useEffect, useState } from "react";
import { Save, AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Settings {
  default_model: string;
  research_depth: string;
  max_cost_usd: number;
}

const DEFAULTS: Settings = {
  default_model: "openai/gpt-4o-mini",
  research_depth: "standard",
  max_cost_usd: 2.0,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/settings`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => setSettings({ ...DEFAULTS, ...data }))
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaveError(null);
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setOffline(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setSaveError("Could not reach the API. Start the backend and try again.");
    }
  }

  if (loading) {
    return (
      <main className="page-container">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  return (
    <main className="page-container">
      <h1>Settings</h1>

      {offline && (
        <div className="notice-banner">
          <AlertCircle size={15} />
          <span>
            API not reachable at <code>{API_BASE}</code> — showing defaults. Start the backend with{" "}
            <code>python -m uvicorn src.api:app --port 8000</code> to load and save real settings.
          </span>
        </div>
      )}

      <section className="config-section glass-card">
        <h2>Model Settings</h2>
        <label className="field-label">Default Model</label>
        <input
          className="config-text-input"
          value={settings.default_model}
          onChange={(e) => setSettings({ ...settings, default_model: e.target.value })}
        />

        <h2>Research Settings</h2>
        <label className="field-label">Default Depth</label>
        <div className="depth-selector">
          {["quick", "standard", "deep"].map((d) => (
            <button
              key={d}
              className={`depth-pill${settings.research_depth === d ? " depth-pill-active" : ""}`}
              onClick={() => setSettings({ ...settings, research_depth: d })}
            >
              {d}
            </button>
          ))}
        </div>

        <h2>Cost Settings</h2>
        <label className="field-label">Max Run Cost (USD)</label>
        <input
          type="number"
          step="0.1"
          className="config-text-input"
          value={settings.max_cost_usd}
          onChange={(e) => setSettings({ ...settings, max_cost_usd: parseFloat(e.target.value) || 0 })}
        />

        {saveError && (
          <div className="notice-banner notice-banner-error">
            <AlertCircle size={15} />
            <span>{saveError}</span>
          </div>
        )}

        <button className="button-primary config-start-button" onClick={save}>
          <Save size={15} /> {saved ? "Saved" : "Save Settings"}
        </button>
      </section>
    </main>
  );
}
