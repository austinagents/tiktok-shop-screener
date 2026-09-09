CREATE INDEX IF NOT EXISTS idx_shop_categories_category_seller_id
ON shop_categories (category, seller_id);
