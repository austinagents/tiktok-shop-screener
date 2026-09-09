const categoryGroups = {
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

const PAGE_SIZE = 100;

function parsePage(value) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      const row = await env.DB
        .prepare("SELECT COUNT(*) AS count FROM shops")
        .first();

      return Response.json({
        ok: true,
        shops: row?.count ?? 0,
      });
    }

    if (url.pathname === "/shops") {
      const requestedCategory = url.searchParams.get("category");
      const requestedPage = parsePage(url.searchParams.get("page"));

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

      const placeholders = categories.map(() => "?").join(", ");
      const filteredSellersSql = `
        WITH matched_sellers AS (
          SELECT DISTINCT seller_id
          FROM shop_categories
          WHERE category IN (${placeholders})
        )
      `;

      const shopFiltersSql = `
        s.tiktok_unique_id IS NOT NULL
        AND TRIM(s.tiktok_unique_id) <> ''
        AND TRIM(s.tiktok_unique_id) NOT IN ('-', '—')
        AND NOT (
          LOWER(LTRIM(TRIM(s.tiktok_unique_id), '@')) GLOB 'user[0-9]*'
          AND LOWER(LTRIM(TRIM(s.tiktok_unique_id), '@')) NOT GLOB '*[^0-9user]*'
        )
      `;

      const countSql = `
        ${filteredSellersSql}
        SELECT COUNT(*) AS total
        FROM matched_sellers ms
        INNER JOIN shops s
          ON s.seller_id = ms.seller_id
        WHERE ${shopFiltersSql}
      `;

      const shopsSql = `
        ${filteredSellersSql}
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
        FROM matched_sellers ms
        INNER JOIN shops s
          ON s.seller_id = ms.seller_id
        WHERE ${shopFiltersSql}
        ORDER BY s.day7_total_gmv DESC, s.seller_id
        LIMIT ?
        OFFSET ?
      `;

      try {
        const totalRow = await env.DB
          .prepare(countSql)
          .bind(...categories)
          .first();

        const total = totalRow?.total ?? 0;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const page = Math.min(requestedPage, totalPages);
        const offset = (page - 1) * PAGE_SIZE;

        const result = await env.DB
          .prepare(shopsSql)
          .bind(...categories, PAGE_SIZE, offset)
          .all();

        return Response.json({
          category,
          categories,
          total,
          page,
          pageSize: PAGE_SIZE,
          totalPages,
          count: result.results.length,
          shops: result.results,
        });
      } catch (error) {
        console.error(error);

        return Response.json(
          { error: "Failed to read shops database" },
          { status: 500 }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
