import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppScreener",
  description: "The live screener for AI products."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
