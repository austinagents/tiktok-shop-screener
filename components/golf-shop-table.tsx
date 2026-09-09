"use client";

import { useEffect, useState } from "react";

type Shop = {
  seller_id: string;
  name: string | null;
  brand: string | null;
  shop_rating: number | null;
  total_units_sold: number | null;
  total_gmv: number | null;
  day7_units_sold: number | null;
  day7_total_gmv: number | null;
  on_sale_product_count: number | null;
  affiliate_creator_count: number | null;
  tiktok_unique_id: string | null;
  avatar_url: string | null;
};

type ShopsResponse = {
  shops?: Shop[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  error?: string;
};

export function GolfShopTable({ category = "Golf" }: { category?: string }) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [category]);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    fetch(
      `/api/shops?category=${encodeURIComponent(category)}&page=${page}`,
      { signal: controller.signal }
    )
      .then(async (res) => {
        const data = (await res.json()) as ShopsResponse;

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load shops.");
        }

        setShops(data.shops ?? []);
        setTotal(data.total ?? data.shops?.length ?? 0);
        setPage(data.page ?? page);
        setPageSize(data.pageSize ?? 100);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          return;
        }

        setShops([]);
        setTotal(0);
        setTotalPages(1);
        setError(cause instanceof Error ? cause.message : "Failed to load shops.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [category, page]);

  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

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
                <td className="rank">#{startRank + index + 1}</td>

                <td>
                  <div className="toolCell">
                    {shop.avatar_url && (
                      <img
                        src={shop.avatar_url}
                        alt=""
                        width={32}
                        height={32}
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <span>
                      <strong>{shop.name ?? "Unknown Shop"}</strong>
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

            {!isLoading && shops.length === 0 && (
              <tr>
                <td colSpan={6}>No shops found for this category.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "18px 4px 8px",
        }}
      >
        <span style={{ fontSize: 13, opacity: 0.75 }}>
          {isLoading ? "Loading shops..." : `${total.toLocaleString()} shops`}
        </span>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              disabled={isLoading || page === 1}
              onClick={() => goToPage(page - 1)}
            >
              Previous
            </button>

            <span style={{ fontSize: 13 }}>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={isLoading || page === totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function formatCurrency(value: number | null) {
  const amount = value ?? 0;

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

function formatCount(value: number | null) {
  const amount = value ?? 0;

  if (amount < 5) {
    return "?";
  }

  return new Intl.NumberFormat("en-US", {
    notation: amount >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(amount);
}
