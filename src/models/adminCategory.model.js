const db = require('../utils/db.util');

async function listCategories(search = '') {
  const q = `%${search}%`;
  return db.query(
    `SELECT id, name, slug, is_active, created_at
     FROM categories
     WHERE (? = '%%' OR name LIKE ? OR slug LIKE ?)
     ORDER BY id DESC`,
    [q, q, q]
  );
}

async function getCategoryById(id) {
  const rows = await db.query(
    `SELECT id, name, slug, is_active FROM categories WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function createCategory(data) {
  return db.query(
    `INSERT INTO categories (name, slug, is_active) VALUES (?, ?, ?)`,
    [data.name, data.slug, data.is_active ? 1 : 0]
  );
}

async function updateCategory(id, data) {
  return db.query(
    `UPDATE categories SET name = ?, slug = ?, is_active = ? WHERE id = ?`,
    [data.name, data.slug, data.is_active ? 1 : 0, id]
  );
}

async function deleteCategory(id) {
  return db.query(`DELETE FROM categories WHERE id = ?`, [id]);
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
