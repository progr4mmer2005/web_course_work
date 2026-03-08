const db = require('../utils/db.util');

async function getCatalog({ categoryId, onlyInStock, q, priceFrom, priceTo }) {
  const where = [];
  const params = [];

  if (categoryId) {
    where.push('p.category_id = ?');
    params.push(Number(categoryId));
  }

  if (onlyInStock) {
    where.push('p.stock_quantity > 0');
  }

  if (q) {
    where.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }

  if (priceFrom !== undefined && priceFrom !== null && priceFrom !== '') {
    where.push('p.price >= ?');
    params.push(Number(priceFrom));
  }

  if (priceTo !== undefined && priceTo !== null && priceTo !== '') {
    where.push('p.price <= ?');
    params.push(Number(priceTo));
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const items = await db.query(
    `SELECT p.id, p.name, p.slug, p.price, p.stock_quantity, p.max_discount_percent, p.category_id,
            c.name AS category_name,
            (SELECT image_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_path
     FROM products p
     JOIN categories c ON c.id = p.category_id
     ${whereSql}
     ORDER BY p.created_at DESC`,
    params
  );

  return {
    items
  };
}

async function findBySlug(slug) {
  const rows = await db.query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.slug = ?
     LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

async function getImages(productId) {
  return db.query(
    `SELECT id, image_path, alt_text
     FROM product_images
     WHERE product_id = ?
     ORDER BY sort_order ASC, id ASC`,
    [productId]
  );
}

module.exports = {
  getCatalog,
  findBySlug,
  getImages
};
