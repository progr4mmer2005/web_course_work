const db = require('../utils/db.util');

async function listProductReviews(search = '') {
  const q = `%${search}%`;
  return db.query(
    `SELECT rp.id, rp.rating, rp.comment_text, rp.is_published, rp.created_at,
            u.full_name AS user_name, p.name AS product_name
     FROM reviews_product rp
     JOIN users u ON u.id = rp.user_id
     JOIN products p ON p.id = rp.product_id
     WHERE (? = '%%' OR u.full_name LIKE ? OR p.name LIKE ? OR rp.comment_text LIKE ?)
     ORDER BY rp.id DESC`,
    [q, q, q, q]
  );
}

async function listStoreReviews(search = '') {
  const q = `%${search}%`;
  return db.query(
    `SELECT rs.id, rs.rating, rs.comment_text, rs.is_published, rs.created_at,
            u.full_name AS user_name
     FROM reviews_store rs
     JOIN users u ON u.id = rs.user_id
     WHERE (? = '%%' OR u.full_name LIKE ? OR rs.comment_text LIKE ?)
     ORDER BY rs.id DESC`,
    [q, q, q]
  );
}

async function setProductReviewPublished(id, isPublished) {
  return db.query('UPDATE reviews_product SET is_published = ? WHERE id = ?', [isPublished ? 1 : 0, id]);
}

async function setStoreReviewPublished(id, isPublished) {
  return db.query('UPDATE reviews_store SET is_published = ? WHERE id = ?', [isPublished ? 1 : 0, id]);
}

async function getProductReviewById(id) {
  const rows = await db.query(
    `SELECT id, user_id, product_id, rating, comment_text, is_published
     FROM reviews_product
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function getStoreReviewById(id) {
  const rows = await db.query(
    `SELECT id, user_id, rating, comment_text, is_published
     FROM reviews_store
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function createProductReview(data) {
  return db.query(
    `INSERT INTO reviews_product (user_id, product_id, rating, comment_text, is_published)
     VALUES (?, ?, ?, ?, ?)`,
    [data.user_id, data.product_id, data.rating, data.comment_text, data.is_published ? 1 : 0]
  );
}

async function updateProductReview(id, data) {
  return db.query(
    `UPDATE reviews_product
     SET user_id = ?, product_id = ?, rating = ?, comment_text = ?, is_published = ?
     WHERE id = ?`,
    [data.user_id, data.product_id, data.rating, data.comment_text, data.is_published ? 1 : 0, id]
  );
}

async function deleteProductReview(id) {
  return db.query('DELETE FROM reviews_product WHERE id = ?', [id]);
}

async function createStoreReview(data) {
  return db.query(
    `INSERT INTO reviews_store (user_id, rating, comment_text, is_published)
     VALUES (?, ?, ?, ?)`,
    [data.user_id, data.rating, data.comment_text, data.is_published ? 1 : 0]
  );
}

async function updateStoreReview(id, data) {
  return db.query(
    `UPDATE reviews_store
     SET user_id = ?, rating = ?, comment_text = ?, is_published = ?
     WHERE id = ?`,
    [data.user_id, data.rating, data.comment_text, data.is_published ? 1 : 0, id]
  );
}

async function deleteStoreReview(id) {
  return db.query('DELETE FROM reviews_store WHERE id = ?', [id]);
}

async function listClients() {
  return db.query(
    `SELECT u.id, u.full_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE r.code = 'client' AND u.is_active = 1
     ORDER BY u.full_name ASC`
  );
}

async function listProducts() {
  return db.query(
    `SELECT id, name
     FROM products
     WHERE is_active = 1
     ORDER BY name ASC`
  );
}

module.exports = {
  listProductReviews,
  listStoreReviews,
  setProductReviewPublished,
  setStoreReviewPublished,
  getProductReviewById,
  getStoreReviewById,
  createProductReview,
  updateProductReview,
  deleteProductReview,
  createStoreReview,
  updateStoreReview,
  deleteStoreReview,
  listClients,
  listProducts
};
