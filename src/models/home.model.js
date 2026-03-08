const db = require('../utils/db.util');

async function getPopularProducts(limit = 8) {
  return db.query(
    `SELECT p.id, p.name, p.slug, p.price, p.stock_quantity, p.max_discount_percent, p.category_id,
            c.name AS category_name,
            COALESCE(ps.views_count, 0) AS views_count,
            COALESCE(ps.cart_add_count, 0) AS cart_add_count,
            COALESCE(ps.wishlist_add_count, 0) AS wishlist_add_count,
            COALESCE(ps.order_count, 0) AS order_count,
            COALESCE(ps.reviews_count, 0) AS reviews_count,
            (SELECT image_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_path
     FROM products p
     JOIN categories c ON c.id = p.category_id
     LEFT JOIN product_stats ps ON ps.product_id = p.id
     WHERE p.is_active = 1
     ORDER BY (COALESCE(ps.views_count,0) + COALESCE(ps.cart_add_count,0)*2 + COALESCE(ps.wishlist_add_count,0)*2 + COALESCE(ps.order_count,0)*4 + COALESCE(ps.reviews_count,0)*3) DESC,
              p.created_at DESC
     LIMIT ${Number(limit)}`
  );
}

async function getDiscountedProducts(limit = 8) {
  return db.query(
    `SELECT p.id, p.name, p.slug, p.price, p.stock_quantity, p.max_discount_percent, p.category_id,
            c.name AS category_name,
            (SELECT image_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_path
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = 1
       AND EXISTS (
         SELECT 1
         FROM discount_rules dr
         LEFT JOIN discount_targets_products dtp ON dtp.discount_rule_id = dr.id
         LEFT JOIN discount_targets_categories dtc ON dtc.discount_rule_id = dr.id
         LEFT JOIN discount_targets_catalog dtg ON dtg.discount_rule_id = dr.id
         WHERE dr.is_active = 1
           AND (dr.start_at IS NULL OR dr.start_at <= NOW())
           AND (dr.end_at IS NULL OR dr.end_at >= NOW())
           AND (dtp.product_id = p.id OR dtc.category_id = p.category_id OR dtg.id IS NOT NULL)
       )
     ORDER BY p.created_at DESC
     LIMIT ${Number(limit)}`
  );
}

module.exports = {
  getPopularProducts,
  getDiscountedProducts
};
