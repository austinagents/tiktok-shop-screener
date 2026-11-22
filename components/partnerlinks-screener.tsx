"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import "./partnerlinks-screener.css";

const categories = [
  ["All", ""], ["Sports & Outdoor", "603014"], ["Food & Beverages", "700437"],
  ["Womenswear", "601152"], ["Menswear", "824328"], ["Shoes", "601352"],
  ["Beauty", "601450"], ["Kitchenware", "600024"], ["Electronics", "601739,601755"],
  ["Home Supplies", "600001,600942"], ["Health", "700645"], ["Pet Supplies", "602118"],
  ["Fashion Accessories", "605248,953224"], ["Toys & Hobbies", "604206"],
  ["Tools & Hardware", "604579,604968"], ["Automotive & Motorcycle", "605196"],
  ["Books, Magazines & Audio", "801928"], ["Luggage & Bags", "824584"],
  ["Collectibles", "951432"], ["Baby & Maternity", "602284"]
] as const;

type Shop = {
  shop_id: string; shop_name: string | null; brand?: {name?: string | null} | null;
  shop_thumb_image_url: string | null; category_name: string;
  estimated_gmv: number | null; estimated_units_sold: number | null;
  followers: number | null; tiktok_username: string | null; display_rank: number | null;
};
type Creator = {
  creator_oecuid: string; handle: string; nickname: string; avatar: string | null;
  categoryMemberships: string[]; med_gmv_revenue: number | null;
  med_gmv_revenue_range: string | null; units_sold: number | null;
  followers: number | null;
};
type Response = { total: number; page: number; pageSize: number; totalPages: number; shops?: Shop[]; creators?: Creator[] };
type Mode = "shops" | "creators";

const formatNumber = (value: number | null | undefined) => value == null || !Number.isFinite(value)
  ? "—" : new Intl.NumberFormat("en-US", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
const formatMoney = (value: number | null | undefined) => value == null || !Number.isFinite(value)
  ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);

export function PartnerLinksScreener() {
  const [mode, setMode] = useState<Mode>("shops");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const match = categories.find(([name]) => name === category);
    const params = new URLSearchParams({ page: String(page) });
    if (mode === "shops") {
      params.set("category_id", match?.[1] || "all");
      params.set("window", "30d");
      params.set("metric", "total_gmv");
    } else {
      params.set("category", category);
      params.set("pageSize", "25");
      if (category === "All") params.set("population", "master-v2");
    }
    setData(null);
    setError("");
    setLoading(true);
    fetch("/api/partnerlinks/" + mode + "?" + params.toString(), {signal: controller.signal})
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !Array.isArray(json?.[mode]))
          throw new Error(typeof json?.error === "string" ? json.error : "PartnerLinks data unavailable");
        return json as Response;
      })
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Unable to retrieve rankings");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [mode, category, page]);

  const rows = mode === "shops" ? (data?.shops ?? []) : (data?.creators ?? []);
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;
  const startRank = (currentPage - 1) * (data?.pageSize ?? (mode === "shops" ? 100 : 25));
  function switchMode(next: Mode) { setMode(next); setPage(1); }
  function switchCategory(next: string) { setCategory(next); setPage(1); }
  function openProfile(event: MouseEvent<HTMLAnchorElement>, handle: string) {
    // Browser navigation remains functional; Discord SDK handles link launch where available.
    if (!handle) event.preventDefault();
  }

  return <section className="plScreen" aria-label="PartnerLinks commerce intelligence">
    <div className="plHeader">
      <div><span className="plEyebrow">PartnerLinks · commerce intelligence</span>
        <h1>Trending TikTok
          <span className="plMode" role="group" aria-label="Ranking type">
            <button type="button" aria-pressed={mode === "shops"} className={mode === "shops" ? "active" : ""} onClick={() => switchMode("shops")}>Shops</button>
            <button type="button" aria-pressed={mode === "creators"} className={mode === "creators" ? "active" : ""} onClick={() => switchMode("creators")}>Creators</button>
          </span>
        </h1>
        <p>30-day estimates and creator intelligence from PartnerLinks</p>
      </div>
      <span className="plDataSource">Read-only data</span>
    </div>
    <nav className="plCategories" aria-label="Commerce categories">
      {categories.map(([name]) => <button type="button" key={name} aria-pressed={category === name} className={category === name ? "active" : ""} onClick={() => switchCategory(name)}>{name}</button>)}
    </nav>
    <div className="plSectionTitle"><div><h2>{category === "All" ? "All categories" : category} · {mode === "shops" ? "Shops" : "Creators"}</h2>
      <p>{loading ? "Loading rankings…" : error ? "Data unavailable" : (data?.total ?? 0).toLocaleString() + " results"}</p></div><span>30D</span></div>
    <div className="plTableFrame">
      {loading && <div className="plMessage" role="status">Loading PartnerLinks {mode}…</div>}
      {error && <div className="plMessage" role="alert"><strong>PartnerLinks data could not be loaded.</strong><p>{error}</p></div>}
      {!loading && !error && rows.length === 0 && <div className="plMessage">No {mode} found for this category.</div>}
      {!loading && !error && rows.length > 0 && <div className="plScroll">
        <table className="plResults"><thead><tr><th>Rank</th><th>{mode === "shops" ? "Shop" : "Creator"}</th><th>Category</th><th>{mode === "shops" ? "Est. 30D GMV" : "30D GMV"}</th><th>Units</th><th>Followers</th><th>TikTok</th></tr></thead>
          <tbody>{mode === "shops"
            ? (data?.shops ?? []).map((shop, i) => <tr key={shop.shop_id + ":" + i}>
                <td data-label="Rank">#{shop.display_rank ?? startRank + i + 1}</td>
                <td data-label="Shop"><div className="plIdentity"><span className="plAvatar">{shop.shop_thumb_image_url ? <img src={shop.shop_thumb_image_url} alt="" loading="lazy" onError={e => {e.currentTarget.style.display = "none";}} /> : (shop.shop_name || "?").slice(0,1)}</span><strong>{shop.brand?.name || shop.shop_name || "Unknown Shop"}</strong></div></td>
                <td data-label="Category">{shop.category_name || "—"}</td><td className="plMetric" data-label="30D GMV">{formatMoney(shop.estimated_gmv)}</td><td data-label="Units">{formatNumber(shop.estimated_units_sold)}</td><td data-label="Followers">{formatNumber(shop.followers)}</td>
                <td data-label="TikTok">{shop.tiktok_username ? <a href={"https://www.tiktok.com/@" + encodeURIComponent(shop.tiktok_username.replace(/^@/,""))} target="_blank" rel="noopener noreferrer" onClick={e=>openProfile(e,shop.tiktok_username || "")}>@{shop.tiktok_username.replace(/^@/,"")}</a> : "—"}</td>
              </tr>)
            : (data?.creators ?? []).map((creator, i) => <tr key={creator.creator_oecuid}>
                <td data-label="Rank">#{startRank + i + 1}</td>
                <td data-label="Creator"><div className="plIdentity"><span className="plAvatar">{creator.avatar ? <img src={creator.avatar} alt="" loading="lazy" onError={e => {e.currentTarget.style.display = "none";}} /> : (creator.nickname || "?").slice(0,1)}</span><strong>{creator.nickname || "@" + creator.handle}</strong></div></td>
                <td data-label="Category">{(creator.categoryMemberships ?? []).join(", ") || "—"}</td>
                <td className="plMetric" data-label="30D GMV">{creator.med_gmv_revenue == null ? creator.med_gmv_revenue_range || "—" : formatMoney(creator.med_gmv_revenue)}</td>
                <td data-label="Units">{formatNumber(creator.units_sold)}</td><td data-label="Followers">{formatNumber(creator.followers)}</td>
                <td data-label="TikTok">{creator.handle ? <a href={"https://www.tiktok.com/@" + encodeURIComponent(creator.handle.replace(/^@/,""))} target="_blank" rel="noopener noreferrer" onClick={e=>openProfile(e,creator.handle)}>@{creator.handle.replace(/^@/,"")}</a> : "—"}</td>
              </tr>)}
          </tbody></table>
      </div>}
      <footer className="plFooter">
        <span>{loading ? "Updating…" : error ? "Feed unavailable" : (data?.total ?? 0).toLocaleString() + " " + mode}</span>
        <div><button type="button" disabled={loading || !!error || page <= 1} onClick={()=>setPage(n=>Math.max(1,n-1))}>Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" disabled={loading || !!error || currentPage >= totalPages} onClick={()=>setPage(n=>n+1)}>Next</button></div>
      </footer>
    </div><p className="plFootnote">Estimated metrics are PartnerLinks data, not official TikTok sales reporting.</p>
  </section>;
}
