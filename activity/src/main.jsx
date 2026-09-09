import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { initializeDiscord } from "./discord";
import "./style.css";

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
  const isDiscord =
    new URLSearchParams(window.location.search).has("frame_id") ||
    new URLSearchParams(window.location.search).has("instance_id");
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
    if (!ready) return;

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
  }, [ready, category, page]);

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
        <div className="homeStack">
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
              <div className="sectionHeader tightHeader">
                <div>
                  <h1>{category}</h1>
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
                    <h2>Attention Heatmap</h2>
                  </div>
                </div>

                <AttentionHeatmap
                  activeCategory={category}
                  onSelect={chooseCategory}
                />
              </section>
            </aside>
          </section>
        </div>
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
      <div className="tableWrap">
        <div style={{ padding: 24 }}>
          <strong>Unable to load shops.</strong>
          <p style={{ margin: "8px 0 0", opacity: 0.75 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="tableWrap">
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
                <td className="rank">
                  #{startRank + index + 1}
                </td>

                <td>
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
                      />
                    ) : null}

                    <span>
                      <strong>{shop.name || "Unknown Shop"}</strong>
                    </span>
                  </div>
                </td>

                <td>{formatCurrency(shop.day7_total_gmv)}</td>
                <td>{formatCurrency(shop.total_gmv)}</td>
                <td>{formatCount(shop.affiliate_creator_count)}</td>

                <td>
                  {shop.tiktok_unique_id ? (
                    <a
                      href={`https://www.tiktok.com/@${shop.tiktok_unique_id}`}
                      target="_blank"
                      rel="noreferrer"
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
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "18px 4px 8px"
        }}
      >
        <span style={{ fontSize: 13, opacity: 0.75 }}>
          {loading ? "Loading shops..." : `${total.toLocaleString()} shops`}
        </span>

        {totalPages > 1 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              disabled={loading || page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>

            <span style={{ fontSize: 13 }}>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={loading || page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        ) : null}
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
