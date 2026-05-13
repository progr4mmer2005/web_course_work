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

async function getProductImages(productId) {
  return db.query(
    `SELECT id, image_path, alt_text, sort_order
     FROM product_images
     WHERE product_id = ?
     ORDER BY sort_order ASC, id ASC`,
    [productId]
  );
}

async function insertProductImages(connection, productId, images = [], startSortOrder = 0) {
  let sortOrder = startSortOrder;

  for (const image of images) {
    await connection.execute(
      `INSERT INTO product_images (product_id, image_path, alt_text, sort_order)
       VALUES (?, ?, ?, ?)`,
      [productId, image.image_path, image.alt_text || null, sortOrder]
    );
    sortOrder += 1;
  }
}

async function createProduct(data) {
  return db.withTransaction(async (connection) => {
    const [result] = await connection.execute(
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

    if (Array.isArray(data.images) && data.images.length) {
      await insertProductImages(connection, result.insertId, data.images, 0);
    }

    return result.insertId;
  });
}

async function updateProduct(id, data) {
  return db.withTransaction(async (connection) => {
    await connection.execute(
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

    const removeImageIds = Array.isArray(data.remove_image_ids)
      ? data.remove_image_ids.map((value) => Number(value)).filter(Boolean)
      : [];

    if (removeImageIds.length) {
      const placeholders = removeImageIds.map(() => '?').join(', ');
      await connection.execute(
        `DELETE FROM product_images
         WHERE product_id = ? AND id IN (${placeholders})`,
        [id, ...removeImageIds]
      );
    }

    const [currentImages] = await connection.execute(
      `SELECT id
       FROM product_images
       WHERE product_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [id]
    );

    if (data.primary_image_path) {
      if (currentImages.length) {
        await connection.execute(
          `UPDATE product_images
           SET image_path = ?, alt_text = ?, sort_order = 0
           WHERE id = ? AND product_id = ?`,
          [data.primary_image_path, data.primary_alt_text || null, currentImages[0].id, id]
        );
      } else {
        await connection.execute(
          `INSERT INTO product_images (product_id, image_path, alt_text, sort_order)
           VALUES (?, ?, ?, 0)`,
          [id, data.primary_image_path, data.primary_alt_text || null]
        );
      }
    }

    if (Array.isArray(data.gallery_images) && data.gallery_images.length) {
      const [maxSortOrderRow] = await connection.execute(
        `SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order
         FROM product_images
         WHERE product_id = ?`,
        [id]
      );
      const startSortOrder = Number(maxSortOrderRow[0].max_sort_order) + 1;
      await insertProductImages(connection, id, data.gallery_images, startSortOrder);
    }
  });
}

async function deleteProduct(id) {
  return db.query(`DELETE FROM products WHERE id = ?`, [id]);
}

module.exports = {
  listProducts,
  getProductById,
  getProductImages,
  createProduct,
  updateProduct,
  deleteProduct
};
