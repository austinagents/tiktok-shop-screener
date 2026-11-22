import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { initializeDiscord, openExternalLink } from "./discord";
import "./style.css";
import { PartnerLinksIntelligence } from "./partnerlinks";
import "./partnerlinks.css";

const CATEGORY_TABS = [
  "Sports & Outdoors",
  "Fashion",
  "Beauty & Care",
  "Food & Beverage",
  "Home & Living",
  "Pets & Hobbies"
];

const HEATMAP_GROUPS = [
  {
    title: "SPORTS & OUTDOORS",
    items: ["Golf", "Pickleball", "Fitness", "Running", "Camping", "Fishing"]
  },
  {
    title: "FASHION",
    items: ["Dresses", "Activewear", "Shoes", "Jewelry", "Handbags", "Menswear"]
  },
  {
    title: "BEAUTY & CARE",
    items: ["Skincare", "Makeup", "Haircare", "Fragrance", "Bodycare", "Nails"]
  },
  {
    title: "FOOD & BEVERAGE",
    items: ["Energy", "Snacks", "Coffee", "Protein", "Hydration", "Candy"]
  },
  {
    title: "HOME & LIVING",
    items: ["Kitchen", "Cleaning", "Storage", "Decor", "Bedding", "Bathroom"]
  },
  {
    title: "PETS & HOBBIES",
    items: ["Dogs", "Cats", "Toys", "Collectibles", "Cards", "Crafts"]
  }
];

function App() {
  const [view, setView] = useState("partnerlinks");
  const [ready, setReady] = useState(false);
  const [activityError, setActivityError] = useState("");

  const [category, setCategory] = useState("Sports & Outdoors");
  const [shops, setShops] = useState([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [shopsError, setShopsError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await initializeDiscord();
        setReady(true);
      } catch (error) {
        console.error(error);
        setActivityError(error?.message || "Discord Activity failed to initialize.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready || view !== "legacy") return;

    const controller = new AbortController();

    setLoading(true);
    setShopsError("");

    fetch(
      `/api/shops?category=${encodeURIComponent(category)}&page=${page}`,
      { signal: controller.signal }
    )
      .then(async response => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load shops.");
        }

        setShops(data.shops || []);
        setTotal(data.total || 0);
        setPageSize(data.pageSize || 100);
        setTotalPages(data.totalPages || 1);
      })
      .catch(error => {
        if (error?.name === "AbortError") return;

        console.error(error);
        setShops([]);
        setShopsError(error?.message || "Failed to load shops.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [ready, view, category, page]);

  function chooseCategory(nextCategory) {
    setCategory(nextCategory);
    setPage(1);
  }

  if (activityError) {
    return (
      <div className="center-screen">
        <h2>TikTok Shop Screener couldn't open</h2>
        <p>{activityError}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="center-screen">
        <h2>TikTok Shop Screener</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="activity-app">
      <header className="topbar">
        <div className="brand">
          <span className="brandMark">
            <img src="/logo.png" alt="" width="36" height="36" />
          </span>

          <span>
            <strong>TikTok Shop Screener</strong>
            <small>BY UGC NETWORK</small>
          </span>
        </div>
      </header>

      <main className="pageShell">
        <nav className="screenerSourceTabs" aria-label="Screener data source">
          <button type="button" aria-pressed={view === "partnerlinks"} className={view === "partnerlinks" ? "active" : ""} onClick={() => setView("partnerlinks")}>PartnerLinks Intelligence</button>
          <button type="button" aria-pressed={view === "legacy"} className={view === "legacy" ? "active" : ""} onClick={() => setView("legacy")}>Original Shop Screener</button>
        </nav>
        {view === "partnerlinks" ? <PartnerLinksIntelligence openExternalLink={openExternalLink} /> : <div className="homeStack">
          <div className="pageIntro">
            <div>
              <span className="eyebrow">Shop intelligence</span>
              <h1>Shop rankings</h1>
              <p>Explore category leaders by recent and lifetime sales performance.</p>
            </div>
            <div className="dataStatus" aria-label="Live shop data">
              <span aria-hidden="true" /> Live data
            </div>
          </div>

          <nav className="screenTabs" aria-label="Shop category filters">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab}
                type="button"
                className={category === tab ? "active" : ""}
                onClick={() => chooseCategory(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>

          <section className="homePrimary">
            <div className="primaryTable">
              <div className="sectionHeader tableSectionHeader">
                <div>
                  <h1>{category}</h1>
                  <p>{loading ? "Updating rankings…" : `${total.toLocaleString()} ranked shops`}</p>
                </div>
              </div>

              <ShopTable
                shops={shops}
                loading={loading}
                error={shopsError}
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                setPage={setPage}
              />
            </div>

            <aside className="homeRail">
              <section className="previewPanel">
                <div className="panelHeader">
                  <div>
                    <span className="eyebrow">Browse</span>
                    <h2>Category map</h2>
                    <p>Select a subcategory to refine the rankings.</p>
                  </div>
                </div>

                <AttentionHeatmap
                  activeCategory={category}
                  onSelect={chooseCategory}
                />
              </section>
            </aside>
          </section>
        </div>}
      </main>
    </div>
  );
}

function ShopTable({
  shops,
  loading,
  error,
  page,
  pageSize,
  total,
  totalPages,
  setPage
}) {
  const startRank = (page - 1) * pageSize;

  if (error) {
    return (
      <div className="shopTableCard tableState">
        <div>
          <strong>Unable to load shops.</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="shopTableCard">
        <div className="tableWrap" aria-busy={loading}>
        <table className="terminalTable toolsTable focusedToolsTable">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Shop</th>
              <th>7D GMV</th>
              <th>Lifetime GMV</th>
              <th>Creators</th>
              <th>TikTok</th>
            </tr>
          </thead>

          <tbody>
            {shops.map((shop, index) => (
              <tr key={shop.seller_id}>
                <td className="rank" data-label="Rank">
                  #{startRank + index + 1}
                </td>

                <td data-label="Shop">
                  <div className="toolCell">
                    {shop.avatar_url ? (
                      <img
                        src={
                      shop.avatar_url
                        ? new URL(shop.avatar_url).pathname
                        : ""
                    }
                        alt=""
                        width="32"
                        height="32"
                        loading="lazy"
                        onError={event => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}

                    <span>
                      <strong>{shop.name || "Unknown Shop"}</strong>
                    </span>
                  </div>
                </td>

                <td data-label="7D GMV">{formatCurrency(shop.day7_total_gmv)}</td>
                <td data-label="Lifetime GMV">{formatCurrency(shop.total_gmv)}</td>
                <td data-label="Creators">{formatCount(shop.affiliate_creator_count)}</td>

                <td data-label="TikTok">
                  {shop.tiktok_unique_id ? (
                    <a
                      href={`https://www.tiktok.com/@${shop.tiktok_unique_id}`}
                      onClick={async event => {
                        event.preventDefault();

                        try {
                          await openExternalLink(
                            `https://www.tiktok.com/@${shop.tiktok_unique_id}`
                          );
                        } catch (error) {
                          console.error("Failed to open TikTok link", error);
                        }
                      }}
                    >
                      @{shop.tiktok_unique_id}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}

            {!loading && shops.length === 0 ? (
              <tr>
                <td colSpan="6">
                  No shops found for this category.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {loading && shops.length === 0 ? (
          <div className="loadingState" role="status">Loading shop rankings…</div>
        ) : null}
        </div>

        <div className="tableFooter">
          <span className="shopCount">
            {loading ? "Updating…" : `${total.toLocaleString()} shops`}
          </span>

          <div className="pagination" aria-label="Shop ranking pages">
            <button
              type="button"
              disabled={loading || page === 1}
              onClick={() => setPage(page - 1)}
              aria-label="Previous page"
            >
              Previous
            </button>

            <span>
              <strong>{page}</strong> <span aria-hidden="true">/</span><span className="srOnly">of</span> {totalPages}
            </span>

            <button
              type="button"
              disabled={loading || page === totalPages}
              onClick={() => setPage(page + 1)}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function AttentionHeatmap({ activeCategory, onSelect }) {
  return (
    <div className="attentionHeatmapComponent">
      <div className="heatmapCanvasFrame heatmap-container-relative-wrapper">
        <div className="attentionTaxonomyGrid heatmap-grid-container heatmap-grid-main">
          {HEATMAP_GROUPS.map((group, groupIndex) => (
            <section
              className={[
                "attentionCluster",
                ["markets", "growth", "kitchen", "builders", "ops", "beauty-tools"][groupIndex]
              ].join(" ")}
              key={group.title}
            >
              <div className="attentionClusterLabel">
                <span>{group.title}</span>
              </div>

              <div className="attentionClusterBody">
                {group.items.map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    className={`attentionNode heatmap-tag-button ${
                      index === 0 ? "large" : index === 1 || index === 3 ? "medium" : "small"
                    }${activeCategory === item ? " active" : ""}`}
                    onClick={() => onSelect(item)}
                  >
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  if (amount < 500) {
    return "?";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(amount);
}

function formatCount(value) {
  const amount = Number(value || 0);

  if (amount < 5) {
    return "?";
  }

  return new Intl.NumberFormat("en-US", {
    notation: amount >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(amount);
}

createRoot(document.getElementById("root")).render(<App />);
