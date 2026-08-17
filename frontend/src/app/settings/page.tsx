"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Save, AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const THEME_KEY = "anveshi-theme";

interface Settings {
  default_model: string;
  research_depth: string;
  max_cost_usd: number;
  max_verification_loops: number;
}

const DEFAULTS: Settings = {
  default_model: "openai/gpt-4o-mini",
  research_depth: "standard",
  max_cost_usd: 2.0,
  max_verification_loops: 3,
};

type Theme = "system" | "light" | "dark";
type Tab = "general" | "models" | "execution" | "about";

function applyTheme(theme: Theme) {
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem(THEME_KEY);
  } else {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }
}

function SettingsInner() {
  const params = useSearchParams();
  const tab = (params.get("tab") as Tab) || "general";

  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  });
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

  function changeTheme(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

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
    <main className="page-container settings-page">
      <h1>Settings</h1>

      {offline && (
        <div className="notice-banner">
          <AlertCircle size={15} />
          <span>
            API not reachable at <code>{API_BASE}</code> — showing defaults for model/execution
            settings. Theme still works locally.
          </span>
        </div>
      )}

      <section className="config-section glass-card settings-content">
        {tab === "general" && (
          <>
            <h2 className="settings-section-title">General Settings</h2>
            <p className="muted settings-section-sub">Customize your research experience.</p>

            <label className="field-label">Default Research Depth</label>
            <p className="settings-field-hint">Choose the default depth for new research.</p>
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

            <label className="field-label">Theme</label>
            <p className="settings-field-hint">Choose your preferred theme.</p>
            <select
              className="config-text-input settings-select"
              value={theme}
              onChange={(e) => changeTheme(e.target.value as Theme)}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </>
        )}

        {tab === "models" && (
          <>
            <h2 className="settings-section-title">Model Settings</h2>
            <p className="muted settings-section-sub">
              Which language model backs every agent (planner, verifier, synthesizer, and the
              rest) — set per-agent in <code>config/agent_models.yaml</code>. This is the default
              shown to new users.
            </p>

            <label className="field-label">Default Model</label>
            <input
              className="config-text-input"
              value={settings.default_model}
              onChange={(e) => setSettings({ ...settings, default_model: e.target.value })}
            />
          </>
        )}

        {tab === "execution" && (
          <>
            <h2 className="settings-section-title">Execution Settings</h2>
            <p className="muted settings-section-sub">
              Controls how far a research run is allowed to go before stopping.
            </p>

            <label className="field-label">Maximum Verification Iterations</label>
            <p className="settings-field-hint">
              How many times the Verifier can send a claim back for more research before the
              Synthesizer is forced to finalize with what it has.
            </p>
            <select
              className="config-text-input settings-select"
              value={settings.max_verification_loops}
              onChange={(e) =>
                setSettings({ ...settings, max_verification_loops: parseInt(e.target.value, 10) })
              }
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <label className="field-label">Max Run Cost (USD)</label>
            <input
              type="number"
              step="0.1"
              className="config-text-input"
              value={settings.max_cost_usd}
              onChange={(e) =>
                setSettings({ ...settings, max_cost_usd: parseFloat(e.target.value) || 0 })
              }
            />
          </>
        )}

        {tab === "about" && (
          <>
            <h2 className="settings-section-title">About Anveshi AI</h2>
            <p className="settings-about-body">
              Anveshi AI is an evidence-grounded multi-agent research system. A Planner breaks
              down your question, a Literature agent and Extractor build a claim/evidence base, a
              Challenger actively searches for counter-evidence, and a Verifier gates every claim
              before the Synthesizer writes the final brief.
            </p>
            <p className="settings-about-body muted">
              Source:{" "}
              <a href="https://github.com/786AdiPY/Anveshi-AI" target="_blank" rel="noopener noreferrer">
                github.com/786AdiPY/Anveshi-AI
              </a>
            </p>
          </>
        )}

        {tab !== "about" && (
          <>
            {saveError && (
              <div className="notice-banner notice-banner-error">
                <AlertCircle size={15} />
                <span>{saveError}</span>
              </div>
            )}
            <button className="button-primary config-start-button" onClick={save}>
              <Save size={15} /> {saved ? "Saved" : "Save Settings"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsInner />
    </Suspense>
  );
}
