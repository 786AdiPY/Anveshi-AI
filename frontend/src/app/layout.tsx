import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Pramaan AI — Evidence-Grounded Research Agent",
  description: "Multi-agent research with verifiable, cited evidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Applies a manually-chosen theme (Settings > Theme) before first
            paint, so there's no flash of the wrong palette. Falls through to
            the OS preference (globals.css media query) when unset. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('pramaan-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}`,
          }}
        />
        <div className="app-shell app-shell--sidebar">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
