const db = require('../utils/db.util');

function normalizeIdList(ids) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0))];
}

async function getActiveDiscountsForProduct(productId, categoryId, options = {}) {
  const promoRuleIds = normalizeIdList(options.promoRuleIds || []);
  const promoPlaceholders = promoRuleIds.map(() => '?').join(',');
  const promoCondition = promoRuleIds.length
    ? `(pc.id IS NULL OR dr.id IN (${promoPlaceholders}))`
    : `pc.id IS NULL`;

  return db.query(
    `SELECT DISTINCT dr.id, dr.name, dr.scope, dr.discount_type, dr.discount_value, dr.is_active
     FROM discount_rules dr
     LEFT JOIN discount_targets_products dtp ON dtp.discount_rule_id = dr.id
     LEFT JOIN discount_targets_categories dtc ON dtc.discount_rule_id = dr.id
     LEFT JOIN discount_targets_catalog dtg ON dtg.discount_rule_id = dr.id
     LEFT JOIN promo_codes pc ON pc.discount_rule_id = dr.id AND pc.is_active = 1
     WHERE dr.is_active = 1
       AND dr.scope IN ('product','category','list','catalog')
       AND (dr.start_at IS NULL OR dr.start_at <= NOW())
       AND (dr.end_at IS NULL OR dr.end_at >= NOW())
       AND ${promoCondition}
       AND (
         dtp.product_id = ?
         OR dtc.category_id = ?
         OR dtg.id IS NOT NULL
       )`,
    [...promoRuleIds, productId, categoryId]
  );
}

async function getOrderLevelDiscounts(orderAmount, options = {}) {
  const promoRuleIds = normalizeIdList(options.promoRuleIds || []);
  const promoPlaceholders = promoRuleIds.map(() => '?').join(',');
  const promoCondition = promoRuleIds.length
    ? `(pc.id IS NULL OR dr.id IN (${promoPlaceholders}))`
    : `pc.id IS NULL`;

  return db.query(
    `SELECT dr.id, dr.name, dr.scope, dr.discount_type, dr.discount_value, dr.min_order_amount, dr.max_order_amount, dr.is_active
     FROM discount_rules dr
     LEFT JOIN promo_codes pc ON pc.discount_rule_id = dr.id AND pc.is_active = 1
     WHERE dr.is_active = 1
       AND dr.scope = 'order_sum'
       AND (dr.start_at IS NULL OR dr.start_at <= NOW())
       AND (dr.end_at IS NULL OR dr.end_at >= NOW())
       AND ${promoCondition}
       AND (dr.min_order_amount IS NULL OR dr.min_order_amount <= ?)
       AND (dr.max_order_amount IS NULL OR dr.max_order_amount >= ?)`,
    [...promoRuleIds, orderAmount, orderAmount]
  );
}

async function getPromoRulesByCodes(codes) {
  if (!codes.length) return [];

  const placeholders = codes.map(() => '?').join(',');
  return db.query(
    `SELECT pc.id AS promo_code_id, pc.code, dr.id AS discount_rule_id, dr.name, dr.scope, dr.discount_type, dr.discount_value
     FROM promo_codes pc
     JOIN discount_rules dr ON dr.id = pc.discount_rule_id
     WHERE pc.is_active = 1
       AND dr.is_active = 1
       AND pc.code IN (${placeholders})
       AND (dr.start_at IS NULL OR dr.start_at <= NOW())
       AND (dr.end_at IS NULL OR dr.end_at >= NOW())`,
    codes
  );
}

module.exports = {
  getActiveDiscountsForProduct,
  getOrderLevelDiscounts,
  getPromoRulesByCodes
};
