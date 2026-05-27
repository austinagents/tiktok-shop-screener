import { Activity, Bookmark, GitCompareArrows, Grid2X2, Workflow } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CommandSearch } from "./command-search";

const tabs = [
  { href: "/", label: "Discover", icon: Activity },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/creators", label: "Creators", icon: Activity },
  { href: "/heatmap", label: "Heatmap", icon: Grid2X2 },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="AppScreener home">
          <span className="brandMark"><Image src="/logo.png" alt="" width={36} height={36} priority /></span>
          <span>
            <strong>AppScreener</strong>
            <small>The live screener for AI products.</small>
          </span>
        </Link>
        <CommandSearch />
        <nav className="navTabs">
          {tabs.map((tab) => (
            <Link href={tab.href} key={tab.href}>
              <tab.icon size={15} />
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="pageShell">{children}</main>
    </>
  );
}
