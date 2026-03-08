const db = require('../utils/db.util');

async function listProducts(search = '') {
  const q = `%${search}%`;
  return db.query(
    `SELECT p.id, p.name, p.slug, p.sku, p.price, p.stock_quantity, p.is_active, c.name AS category_name
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE (? = '%%' OR p.name LIKE ? OR p.slug LIKE ? OR p.sku LIKE ?)
     ORDER BY p.id DESC`,
    [q, q, q, q]
  );
}

async function getProductById(id) {
  const rows = await db.query(
    `SELECT id, category_id, name, slug, description, sku, price, max_discount_percent, stock_quantity, is_active
     FROM products WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function createProduct(data) {
  return db.query(
    `INSERT INTO products (
      category_id, name, slug, description, sku, price, max_discount_percent, stock_quantity, is_active
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.category_id,
      data.name,
      data.slug,
      data.description || null,
      data.sku,
      data.price,
      data.max_discount_percent,
      data.stock_quantity,
      data.is_active ? 1 : 0
    ]
  );
}

async function updateProduct(id, data) {
  return db.query(
    `UPDATE products SET
      category_id = ?, name = ?, slug = ?, description = ?, sku = ?, price = ?,
      max_discount_percent = ?, stock_quantity = ?, is_active = ?
     WHERE id = ?`,
    [
      data.category_id,
      data.name,
      data.slug,
      data.description || null,
      data.sku,
      data.price,
      data.max_discount_percent,
      data.stock_quantity,
      data.is_active ? 1 : 0,
      id
    ]
  );
}

async function deleteProduct(id) {
  return db.query(`DELETE FROM products WHERE id = ?`, [id]);
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
