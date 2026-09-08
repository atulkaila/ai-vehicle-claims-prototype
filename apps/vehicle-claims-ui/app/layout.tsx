/**
 * Phase 1: Root layout.
 *
 * Provides the required App Router HTML shell, page metadata, and
 * loads the global stylesheet. Intentionally minimal so Phase 1 stays
 * focused on the single customer-facing assessment screen.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vehicle Damage Assessment",
  description: "Preliminary AI-assisted vehicle damage assessment prototype.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
