import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pramaan AI — Evidence-Grounded Research Agent",
  description: "Multi-agent research with verifiable, cited evidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
