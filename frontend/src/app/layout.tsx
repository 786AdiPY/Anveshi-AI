import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pramaan AI — Evidence-Grounded Research Agent",
  description: "Multi-agent research with verifiable, cited evidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('pramaan-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
