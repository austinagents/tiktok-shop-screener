import { execFileSync } from "node:child_process";
import path from "node:path";

export const dynamic = "force-dynamic";

const categoryGroups: Record<string, string[]> = {
  "Sports & Outdoors": [
    "Golf",
    "Pickleball",
    "Fitness",
    "Running",
    "Camping",
    "Fishing",
  ],
  Fashion: [
    "Dresses",
    "Activewear",
    "Shoes",
    "Jewelry",
    "Handbags",
    "Menswear",
  ],
  "Beauty & Care": [
    "Skincare",
    "Makeup",
    "Haircare",
    "Fragrance",
    "Bodycare",
    "Nails",
  ],
  "Food & Beverage": [
    "Energy",
    "Snacks",
    "Coffee",
    "Protein",
    "Hydration",
    "Candy",
  ],
  "Home & Living": [
    "Kitchen",
    "Cleaning",
    "Storage",
    "Decor",
    "Bedding",
    "Bathroom",
  ],
  "Pets & Hobbies": [
    "Dogs",
    "Cats",
    "Toys",
    "Collectibles",
    "Cards",
    "Crafts",
  ],
};

const individualCategories = new Set(
  Object.values(categoryGroups).flat()
);

export async function GET(request: Request) {
  const dbPath = path.join(
    process.env.HOME!,
    "Desktop/shopsearch/data/shopsearch.sqlite"
  );

  const { searchParams } = new URL(request.url);
  const requestedCategory = searchParams.get("category");

  let category = "Sports & Outdoors";
  let categories = categoryGroups["Sports & Outdoors"];

  if (requestedCategory && categoryGroups[requestedCategory]) {
    category = requestedCategory;
    categories = categoryGroups[requestedCategory];
  } else if (
    requestedCategory &&
    individualCategories.has(requestedCategory)
  ) {
    category = requestedCategory;
    categories = [requestedCategory];
  }

  const categorySql = categories
    .map((value) => `'${value.replaceAll("'", "''")}'`)
    .join(", ");

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
    WHERE EXISTS (
      SELECT 1
      FROM shop_categories sc
      WHERE sc.seller_id = s.seller_id
        AND sc.category IN (${categorySql})
    )
      AND s.tiktok_unique_id IS NOT NULL
      AND TRIM(s.tiktok_unique_id) <> ''
      AND TRIM(s.tiktok_unique_id) NOT IN ('-', '—')
      AND NOT (
        LOWER(LTRIM(TRIM(s.tiktok_unique_id), '@')) GLOB 'user[0-9]*'
        AND LOWER(LTRIM(TRIM(s.tiktok_unique_id), '@')) NOT GLOB '*[^0-9user]*'
      )
    ORDER BY s.day7_total_gmv DESC;
  `;

  try {
    const output = execFileSync("sqlite3", ["-json", dbPath, sql], {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    });

    const shops = output.trim() ? JSON.parse(output) : [];

    return Response.json({
      category,
      categories,
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
