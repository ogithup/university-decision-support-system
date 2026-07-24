import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";


export const metadata: Metadata = {
  title: "University Strategic Cockpit",
  description: "Executive dashboard shell for university decision support.",
};


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

