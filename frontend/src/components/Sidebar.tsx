"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Plus,
  ListChecks,
  Settings,
  GitBranch,
  Bookmark,
  Database,
  SlidersHorizontal,
  Cpu,
  Gauge,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Plus },
  { href: "/runs", label: "Research Runs", icon: ListChecks },
  { href: "/evidence-graph", label: "Evidence Graph", icon: GitBranch },
  { href: "/reports", label: "Saved Reports", icon: Bookmark },
  { href: "/datasets", label: "Datasets", icon: Database },
];

const settingsTabs = [
  { tab: "general", label: "General", icon: SlidersHorizontal },
  { tab: "models", label: "Models", icon: Cpu },
  { tab: "execution", label: "Execution", icon: Gauge },
  { tab: "about", label: "About", icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const onSettings = pathname.startsWith("/settings");
  const activeTab = params.get("tab") || "general";

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("anveshi_sidebar_collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("anveshi_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      {/* Header with Brand & Toggle Button */}
      <div className="sidebar-header">
        {collapsed ? (
          <button
            type="button"
            onClick={toggleSidebar}
            className="sidebar-collapsed-logo-btn"
            title="Open sidebar"
            aria-label="Open sidebar"
          >
            <span className="brand-mark">
              <Image
                src="/logo.png"
                alt="Anveshi AI Logo"
                width={22}
                height={22}
                className="brand-logo-img"
                priority
                unoptimized
              />
              <PanelLeftOpen size={16} className="brand-hover-icon" />
            </span>
          </button>
        ) : (
          <>
            <Link href="/" className="sidebar-brand" aria-label="Anveshi AI home" title="Anveshi AI">
              <span className="brand-mark" aria-hidden="true">
                <Image
                  src="/logo.png"
                  alt="Anveshi AI Logo"
                  width={22}
                  height={22}
                  className="brand-logo-img"
                  priority
                  unoptimized
                />
              </span>
              <span className="sidebar-brand-text">
                <span className="sidebar-brand-name">Anveshi AI</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={toggleSidebar}
              className="sidebar-toggle-btn"
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          </>
        )}
      </div>

      {/* Primary Navigation */}
      <nav className="sidebar-nav" aria-label="Primary">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link${active ? " sidebar-link--active" : ""}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={16} className="sidebar-icon" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        <Link
          href="/settings"
          className={`sidebar-link${onSettings ? " sidebar-link--active" : ""}`}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings size={16} className="sidebar-icon" />
          {!collapsed && <span>Settings</span>}
        </Link>

        {!collapsed && onSettings && (
          <div className="sidebar-subnav">
            {settingsTabs.map(({ tab, label, icon: Icon }) => (
              <Link
                key={tab}
                href={`/settings?tab=${tab}`}
                className={`sidebar-sublink${activeTab === tab ? " sidebar-sublink--active" : ""}`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
