const db = require('../utils/db.util');

async function getProductReviews(productId, limit = 20) {
  return db.query(
    `SELECT rp.id, rp.rating, rp.comment_text, rp.created_at, u.full_name
     FROM reviews_product rp
     JOIN users u ON u.id = rp.user_id
     WHERE rp.product_id = ? AND rp.is_published = 1
     ORDER BY rp.id DESC
     LIMIT ${Number(limit)}`,
    [productId]
  );
}

async function getRecentStoreReviews(limit = 6) {
  return db.query(
    `SELECT rs.id, rs.rating, rs.comment_text, rs.created_at, u.full_name
     FROM reviews_store rs
     JOIN users u ON u.id = rs.user_id
     WHERE rs.is_published = 1
     ORDER BY rs.id DESC
     LIMIT ${Number(limit)}`
  );
}

async function hasDeliveredProductOrder(userId, productId) {
  const rows = await db.query(
    `SELECT oi.id
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = ?
       AND oi.product_id = ?
       AND o.status = 'delivered'
     LIMIT 1`,
    [userId, productId]
  );

  return Boolean(rows[0]);
}

async function hasDeliveredAnyOrder(userId) {
  const rows = await db.query(
    `SELECT id
     FROM orders
     WHERE user_id = ? AND status <> 'canceled'
     LIMIT 1`,
    [userId]
  );

  return Boolean(rows[0]);
}

async function hasProductReview(userId, productId) {
  const rows = await db.query(
    `SELECT id FROM reviews_product WHERE user_id = ? AND product_id = ? LIMIT 1`,
    [userId, productId]
  );
  return Boolean(rows[0]);
}

async function getUserReviewForProduct(userId, productId) {
  const rows = await db.query(
    `SELECT id, rating, comment_text, created_at
     FROM reviews_product
     WHERE user_id = ? AND product_id = ? AND is_published = 1
     LIMIT 1`,
    [userId, productId]
  );
  return rows[0] || null;
}

async function hasStoreReview(userId) {
  const rows = await db.query(
    `SELECT id FROM reviews_store WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return Boolean(rows[0]);
}

async function createProductReview({ userId, productId, rating, commentText }) {
  return db.query(
    `INSERT INTO reviews_product (user_id, product_id, rating, comment_text, is_published)
     VALUES (?, ?, ?, ?, 1)`,
    [userId, productId, rating, commentText]
  );
}

async function upsertProductReview({ userId, productId, rating, commentText }) {
  const rows = await db.query(
    `SELECT id FROM reviews_product WHERE user_id = ? AND product_id = ? LIMIT 1`,
    [userId, productId]
  );

  if (rows[0]) {
    return db.query(
      `UPDATE reviews_product
       SET rating = ?, comment_text = ?, is_published = 1
       WHERE id = ?`,
      [rating, commentText, rows[0].id]
    );
  }

  return createProductReview({ userId, productId, rating, commentText });
}

async function createStoreReview({ userId, rating, commentText }) {
  return db.query(
    `INSERT INTO reviews_store (user_id, rating, comment_text, is_published)
     VALUES (?, ?, ?, 1)`,
    [userId, rating, commentText]
  );
}

async function upsertStoreReview({ userId, rating, commentText }) {
  const rows = await db.query(
    `SELECT id FROM reviews_store WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
    [userId]
  );

  if (rows[0]) {
    return db.query(
      `UPDATE reviews_store
       SET rating = ?, comment_text = ?, is_published = 1
       WHERE id = ?`,
      [rating, commentText, rows[0].id]
    );
  }

  return createStoreReview({ userId, rating, commentText });
}

module.exports = {
  getProductReviews,
  getRecentStoreReviews,
  hasDeliveredProductOrder,
  hasDeliveredAnyOrder,
  hasProductReview,
  hasStoreReview,
  getUserReviewForProduct,
  createProductReview,
  createStoreReview,
  upsertProductReview,
  upsertStoreReview
};
