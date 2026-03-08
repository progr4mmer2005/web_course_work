const db = require('../utils/db.util');

async function listPromoCodes(search = '') {
  const q = `%${search}%`;
  return db.query(
    `SELECT pc.id, pc.code, pc.max_uses, pc.is_active, dr.name AS discount_name
     FROM promo_codes pc
     JOIN discount_rules dr ON dr.id = pc.discount_rule_id
     WHERE (? = '%%' OR pc.code LIKE ?)
     ORDER BY pc.id DESC`,
    [q, q]
  );
}

async function getPromoCodeById(id) {
  const rows = await db.query(
    `SELECT id, code, discount_rule_id, max_uses, is_active
     FROM promo_codes
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function createPromoCode(data) {
  return db.query(
    `INSERT INTO promo_codes (code, discount_rule_id, max_uses, is_active)
     VALUES (?, ?, ?, ?)`,
    [data.code, data.discount_rule_id, data.max_uses || null, data.is_active ? 1 : 0]
  );
}

async function updatePromoCode(id, data) {
  return db.query(
    `UPDATE promo_codes
     SET code = ?, discount_rule_id = ?, max_uses = ?, is_active = ?
     WHERE id = ?`,
    [data.code, data.discount_rule_id, data.max_uses || null, data.is_active ? 1 : 0, id]
  );
}

async function deletePromoCode(id) {
  return db.query(`DELETE FROM promo_codes WHERE id = ?`, [id]);
}

async function listPromoDiscountRules() {
  return db.query(
    `SELECT id, name
     FROM discount_rules
     WHERE scope = 'promo'
     ORDER BY id DESC`
  );
}

module.exports = {
  listPromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  listPromoDiscountRules
};
