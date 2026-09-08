"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AttentionHeatmap } from "@/components/heatmap";
import { HomeTrendingFilter } from "@/components/home-trending-filter";
import { PromotedMomentumRail } from "@/components/promoted-momentum-rail";
import { attentionSubCategories, tools } from "@/lib/data";

const showArchivedMomentumRail = false;

export default function DiscoverPage() {
  return (
    <div className="homeStack">
      {showArchivedMomentumRail ? <PromotedMomentumRail showDiscoverySlot={false} /> : null}

      <HomeTrendingFilter tools={tools}>
        {(setActiveTab, activeTab) => (
          <aside className="homeRail">
            <PreviewPanel href="/heatmap" title="Attention Heatmap" meta="">
              <AttentionHeatmap
                items={attentionSubCategories}
                interactionMode="buttons"
                onSelect={setActiveTab}
                activeLabel={activeTab}
              />
            </PreviewPanel>
          </aside>
        )}
      </HomeTrendingFilter>
    </div>
  );
}

function PreviewPanel({ title, meta, href, children }: { title: string; meta: string; href: string; children: ReactNode }) {
  return (
    <section className="previewPanel">
      <div className="panelHeader">
        <Link href={href}><h2>{title}</h2><small>{meta}</small></Link>
        <Link className="viewLink" href={href}>View all →</Link>
      </div>
      {children}
    </section>
  );
}
