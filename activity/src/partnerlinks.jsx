import React, { useEffect, useMemo, useState } from "react";

// Public, read-only PartnerLinks API responses are retrieved through the Screener's
// own Vercel rewrites. Nothing in PartnerLinks/UGCweb is modified.
const CATEGORIES = [
  ["all", "All", ""],
  ["sports-outdoor", "Sports & Outdoor", "603014"],
  ["food-beverages", "Food & Beverages", "700437"],
  ["womenswear-underwear", "Womenswear", "601152"],
  ["menswear-underwear", "Menswear", "824328"],
  ["shoes", "Shoes", "601352"],
  ["beauty-personal-care", "Beauty", "601450"],
  ["kitchenware", "Kitchenware", "600024"],
  ["textiles-furniture", "Textiles & Furnishings", "600154,604453"],
  ["electronics", "Electronics", "601739,601755"],
  ["home-supplies", "Home Supplies", "600001,600942"],
  ["pet-supplies", "Pet Supplies", "602118"],
  ["health", "Health", "700645"],
  ["fashion-jewelry", "Fashion Accessories", "605248,953224"],
  ["toys-hobbies", "Toys & Hobbies", "604206"],
  ["tools-home-improvement", "Tools & Hardware", "604579,604968"],
  ["automotive-motorcycle", "Automotive & Motorcycle", "605196"],
  ["books-audio", "Books & Audio", "801928"],
  ["luggage-bags", "Luggage & Bags", "824584"],
  ["collectibles", "Collectibles", "951432"],
  ["virtual-products", "Virtual Products", "834312"],
  ["kids-fashion", "Kids", "802184"],
  ["baby-maternity", "Baby & Maternity", "602284"]
];

const money = value => typeof value === "number" && Number.isFinite(value)
  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value) : "—";
const count = value => typeof value === "number" && Number.isFinite(value)
  ? new Intl.NumberFormat("en-US", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value) : "—";

export function PartnerLinksIntelligence({ openExternalLink }) {
  const [mode, setMode] = useState("shops");
  const [categoryKey, setCategoryKey] = useState("all");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const category = useMemo(() => CATEGORIES.find(c => c[0] === categoryKey) || CATEGORIES[0], [categoryKey]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page) });
    if (mode === "shops") {
      params.set("window", "30d");
      params.set("metric", "total_gmv");
      params.set("category_id", category[2] || "all");
    } else {
      params.set("category", category[1]);
      params.set("pageSize", "25");
    }
    const path = mode === "shops" ? "shops" : "creators";
    setLoading(true);
    setError("");
    setResult(null);
    fetch("/partnerlinks-api/" + path + "?" + params.toString(), { signal: controller.signal })
      .then(async response => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload || !Array.isArray(payload[path])) {
          throw new Error(payload?.error || "The PartnerLinks data source is unavailable.");
        }
        return payload;
      })
      .then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message || "Could not load PartnerLinks data."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [mode, category, page]);

  const entries = result?.[mode] || [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, result?.totalPages ?? 1);
  const currentPage = result?.page ?? page;
  const startRank = (currentPage - 1) * (result?.pageSize || (mode === "shops" ? 100 : 25));

  function switchMode(value) { setMode(value); setPage(1); }
  function switchCategory(value) { setCategoryKey(value); setPage(1); }
  function openTikTok(e, handle) {
    e.preventDefault();
    if (!handle) return;
    Promise.resolve(openExternalLink("https://www.tiktok.com/@" + encodeURIComponent(handle.replace(/^@/, ""))))
      .catch(error => console.error("TikTok link failed", error));
  }

  return <section className="plScreen">
    <div className="plHeading">
      <div>
        <span className="eyebrow">PartnerLinks · TikTok commerce</span>
        <h1>Trending TikTok <span className="plModeToggle" role="group" aria-label="Commerce ranking type">
          <button type="button" className={mode === "shops" ? "active" : ""} aria-pressed={mode === "shops"} onClick={() => switchMode("shops")}>Shops</button>
          <button type="button" className={mode === "creators" ? "active" : ""} aria-pressed={mode === "creators"} onClick={() => switchMode("creators")}>Creators</button>
        </span></h1>
        <p>PartnerLinks 30-day commerce rankings · read-only feed</p>
      </div>
      <span className="plFeedLabel">PartnerLinks data</span>
    </div>

    <nav className="plCategoryNav" aria-label="PartnerLinks categories">
      {CATEGORIES.map(([key, name]) => <button type="button" key={key} className={categoryKey === key ? "active" : ""} aria-pressed={categoryKey === key} onClick={() => switchCategory(key)}>{name}</button>)}
    </nav>

    <div className="plTableHeading">
      <div><h2>{category[1]} {mode === "shops" ? "Shops" : "Creators"}</h2>
        <p>{loading ? "Loading PartnerLinks data…" : error ? "Data unavailable" : total.toLocaleString() + " results"}</p></div>
      <span>30D</span>
    </div>

    <div className="plTableCard">
      {error && <div className="plState" role="alert"><strong>Unable to load PartnerLinks data.</strong><p>{error}</p></div>}
      {loading && <div className="plState" role="status">Loading {mode}…</div>}
      {!loading && !error && entries.length === 0 && <div className="plState">No {mode} returned for this category.</div>}
      {!error && !loading && entries.length > 0 && <div className="plScroll"><table className="plTable">
        <thead><tr>{(mode === "shops" ? ["Rank", "Shop", "Category", "Est. 30D GMV", "Est. Units", "Followers", "TikTok"] : ["Rank", "Creator", "Category", "30D GMV", "Units Sold", "Followers", "TikTok"]).map(x => <th key={x}>{x}</th>)}</tr></thead>
        <tbody>{entries.map((entry, i) => {
          const isShop = mode === "shops";
          const id = isShop ? entry.shop_id : entry.creator_oecuid;
          const handle = isShop ? (entry.tiktok_username || "") : (entry.handle || "");
          const title = isShop ? (entry.brand?.name || entry.shop_name || "Unknown Shop") : (entry.nickname || handle || "Unknown Creator");
          const image = isShop ? entry.shop_thumb_image_url : entry.avatar;
          const subcategory = isShop ? entry.category_name : (entry.categoryMemberships || []).join(", ");
          const gmv = isShop ? money(entry.estimated_gmv) : (entry.med_gmv_revenue !== null && entry.med_gmv_revenue !== undefined ? money(entry.med_gmv_revenue) : entry.med_gmv_revenue_range || "—");
          return <tr key={id || i}>
            <td data-label="Rank">#{isShop ? (entry.display_rank || startRank + i + 1) : startRank + i + 1}</td>
            <td data-label={isShop ? "Shop" : "Creator"}><div className="plIdentity"><span className="plAvatar">{image && <img src={image} alt="" loading="lazy" onError={e => e.currentTarget.style.display = "none"} />}{!image && title.slice(0, 1).toUpperCase()}</span><strong>{title}</strong></div></td>
            <td data-label="Category">{subcategory || "—"}</td>
            <td data-label="30D GMV" className="plGmv">{gmv}</td>
            <td data-label="Units Sold">{count(isShop ? entry.estimated_units_sold : entry.units_sold)}</td>
            <td data-label="Followers">{count(entry.followers)}</td>
            <td data-label="TikTok">{handle ? <a href={"https://www.tiktok.com/@" + handle.replace(/^@/, "")} onClick={e => openTikTok(e, handle)}>@{handle.replace(/^@/, "")}</a> : "—"}</td>
          </tr>;
        })}</tbody>
      </table></div>}
      <footer className="plFooter">
        <span>{error ? "PartnerLinks feed unavailable" : loading ? "Updating…" : total.toLocaleString() + " " + mode}</span>
        <div><button type="button" disabled={loading || !!error || page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" disabled={loading || !!error || page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button></div>
      </footer>
    </div>
    <p className="plDisclaimer">Estimated commerce figures are sourced from PartnerLinks and are not official TikTok sales reporting.</p>
  </section>;
}
