"use client";

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

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-brand" aria-label="Anveshi AI home">
        <span className="brand-mark" aria-hidden="true">
          <Image src="/logo.png" alt="Anveshi AI Logo" width={22} height={22} className="brand-logo-img" priority />
        </span>
        <span className="sidebar-brand-text">
          <span className="sidebar-brand-name">Anveshi AI</span>
        </span>
      </Link>

      <nav className="sidebar-nav" aria-label="Primary">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link${active ? " sidebar-link--active" : ""}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}

        <Link
          href="/settings"
          className={`sidebar-link${onSettings ? " sidebar-link--active" : ""}`}
        >
          <Settings size={16} />
          <span>Settings</span>
        </Link>

        {onSettings && (
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
