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
            AND sc.category IN (${placeholders})
        )
          AND s.tiktok_unique_id IS NOT NULL
          AND TRIM(s.tiktok_unique_id) <> ''
          AND TRIM(s.tiktok_unique_id) NOT IN ('-', '—')
          AND NOT (
            LOWER(LTRIM(TRIM(s.tiktok_unique_id), '@')) GLOB 'user[0-9]*'
            AND LOWER(LTRIM(TRIM(s.tiktok_unique_id), '@')) NOT GLOB '*[^0-9user]*'
          )
        ORDER BY s.day7_total_gmv DESC
      `;

      try {
        const result = await env.DB
          .prepare(sql)
          .bind(...categories)
          .all();

        return Response.json({
          category,
          categories,
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
