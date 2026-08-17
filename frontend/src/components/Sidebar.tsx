"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, History, Settings, ShieldCheck } from "lucide-react";

const links = [
  { href: "/", label: "New Research" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

const iconFor: Record<string, typeof Plus> = {
  "/": Plus,
  "/history": History,
  "/settings": Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <Link href="/" className="app-header__brand" aria-label="Pramaan AI home">
        <span className="brand-mark" aria-hidden="true">
          <ShieldCheck size={18} strokeWidth={2.4} />
        </span>
        <span className="brand-name">Pramaan AI</span>
      </Link>

      <nav className="app-nav" aria-label="Primary">
        {links.map(({ href, label }) => {
          const Icon = iconFor[href];
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link${active ? " nav-link--active" : ""}`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
