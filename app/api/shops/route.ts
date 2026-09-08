import { execFileSync } from "node:child_process";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbPath = path.join(
    process.env.HOME!,
    "Desktop/shopsearch/data/shopsearch.sqlite"
  );

  const sql = `
    SELECT
      seller_id,
      name,
      brand,
      shop_rating,
      total_units_sold,
      total_gmv,
      day7_units_sold,
      day7_total_gmv,
      on_sale_product_count,
      affiliate_creator_count,
      tiktok_unique_id
    FROM shops
    ORDER BY day7_total_gmv DESC;
  `;

  try {
    const output = execFileSync("sqlite3", ["-json", dbPath, sql], {
      encoding: "utf8"
    });

    const shops = output.trim() ? JSON.parse(output) : [];

    return Response.json({ count: shops.length, shops });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to read shops database" }, { status: 500 });
  }
}
