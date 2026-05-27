"use client";

import { BadgeDollarSign, Battery, Megaphone, PackagePlus, Users } from "lucide-react";
import { useState } from "react";
import type { BoostTier } from "@/lib/types";

export function BoostPanel({ tiers }: { tiers: BoostTier[] }) {
  const [selectedTier, setSelectedTier] = useState<string>("");

  return (
    <section className="previewPanel boostPanel">
      <div className="boostZone boostAdsZone">
        <span className="boostKicker"><Megaphone size={14} /> Ads</span>
        <div>
          <h2>Get Featured</h2>
          <p>Reserve premium placements across AppScreener attention surfaces.</p>
        </div>
      </div>

      <div className="boostZone boostTiersZone">
        <span className="boostKicker"><Battery size={14} /> Boosts</span>
        <div className="boostZoneHeader">
          <h2>Boost Visibility</h2>
        </div>
        <div className="boostTierGrid" role="radiogroup" aria-label="Boost tiers">
          {tiers.map((tier) => (
            <button
              className={selectedTier === tier.id ? "active" : ""}
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              role="radio"
              aria-checked={selectedTier === tier.id}
            >
              <strong>{tier.label}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="boostZone boostMarketplaceZone">
        <div className="boostMarketplaceCard">
          <span className="boostKicker"><PackagePlus size={14} /> Tools</span>
          <h2>List your product</h2>
          <ul>
            <li>Product profile</li>
            <li>Categorization & tagging</li>
            <li>Launch & update</li>
            <li>Performance insights</li>
          </ul>
          <button type="button">List your product →</button>
        </div>
        <div className="boostMarketplaceCard">
          <span className="boostKicker"><Users size={14} /> Creators</span>
          <h2>Match with tools & brands</h2>
          <ul>
            <li>Brand & tool matches</li>
            <li>Sponsored opportunities</li>
            <li>Revenue & payouts</li>
            <li>Creator insights</li>
          </ul>
          <button type="button">Match with brands →</button>
        </div>
      </div>
    </section>
  );
}
