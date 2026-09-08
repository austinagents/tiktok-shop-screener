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
};

export function GolfShopTable({ category = "Golf" }: { category?: string }) {
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    fetch(`/api/shops?category=${encodeURIComponent(category)}`)
      .then((res) => res.json())
      .then((data) => setShops(data.shops ?? []));
  }, [category]);

  return (
    <div className="tableWrap">
      <table className="terminalTable toolsTable focusedToolsTable">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Shop</th>
            <th>7D GMV</th>
            <th>Lifetime GMV</th>
            <th>Creators</th>
            <th>Products</th>
            <th>7D Units</th>
            <th>TikTok</th>
          </tr>
        </thead>
        <tbody>
          {shops.map((shop, index) => (
            <tr key={shop.seller_id}>
              <td className="rank">#{index + 1}</td>

              <td>
                <div className="toolCell">
                  <span>
                    <strong>{shop.name ?? "Unknown Shop"}</strong>
                    {shop.brand && <small>{shop.brand}</small>}
                  </span>
                </div>
              </td>

              <td>{formatCurrency(shop.day7_total_gmv)}</td>
              <td>{formatCurrency(shop.total_gmv)}</td>
              <td>{formatCount(shop.affiliate_creator_count)}</td>
              <td>{formatCount(shop.on_sale_product_count)}</td>
              <td>{formatCount(shop.day7_units_sold)}</td>

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
        </tbody>
      </table>
    </div>
  );
}

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value ?? 0);
}

function formatCount(value: number | null) {
  return new Intl.NumberFormat("en-US", {
    notation: value && value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(value ?? 0);
}
