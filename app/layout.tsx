import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PMC · Pilotage",
  description: "Dashboard interne PMC Marketing",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-base text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
