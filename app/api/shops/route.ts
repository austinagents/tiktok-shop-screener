import { execFileSync } from "node:child_process";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const dbPath = path.join(
    process.env.HOME!,
    "Desktop/shopsearch/data/shopsearch.sqlite"
  );

  const { searchParams } = new URL(request.url);
  const requestedCategory = searchParams.get("category");

  const allowedCategories = new Set([
    "Golf",
    "Skincare",
    "Makeup",
    "Haircare",
    "Fragrance",
    "Nails",
    "Bodycare",
  ]);

  const category =
    requestedCategory && allowedCategories.has(requestedCategory)
      ? requestedCategory
      : "Golf";

  const sql = `
    SELECT
      s.seller_id,
      s.name,
      s.brand,
      s.shop_rating,
      s.total_units_sold,
      s.total_gmv,
      s.day7_units_sold,
      s.day7_total_gmv,
      s.on_sale_product_count,
      s.affiliate_creator_count,
      s.tiktok_unique_id,
      s.avatar_url
    FROM shops s
    INNER JOIN shop_categories sc
      ON sc.seller_id = s.seller_id
    WHERE sc.category = '${category}'
      AND s.tiktok_unique_id IS NOT NULL
      AND TRIM(s.tiktok_unique_id) <> ''
      AND TRIM(s.tiktok_unique_id) NOT IN ('-', '—')
      AND LOWER(TRIM(s.tiktok_unique_id)) NOT LIKE '@user%'
    ORDER BY s.day7_total_gmv DESC;
  `;

  try {
    const output = execFileSync("sqlite3", ["-json", dbPath, sql], {
      encoding: "utf8",
    });

    const shops = output.trim() ? JSON.parse(output) : [];

    return Response.json({
      category,
      count: shops.length,
      shops,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to read shops database" },
      { status: 500 }
    );
  }
}
