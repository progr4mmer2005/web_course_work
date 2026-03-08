const db = require('../utils/db.util');

async function getOrCreateCart(userId, connection = null) {
  const runner = connection || { execute: (sql, params) => require('../config/db').execute(sql, params) };
  const [rows] = await runner.execute(
    `SELECT id FROM carts WHERE user_id = ? AND status = 'active' LIMIT 1`,
    [userId]
  );

  if (rows[0]) {
    return rows[0].id;
  }

  const [insertResult] = await runner.execute(
    `INSERT INTO carts (user_id, status) VALUES (?, 'active')`,
    [userId]
  );

  return insertResult.insertId;
}

async function getCartItem(cartId, productId, connection) {
  const [rows] = await connection.execute(
    `SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? LIMIT 1`,
    [cartId, productId]
  );
  return rows[0] || null;
}

async function upsertItem({ userId, productId, quantity }) {
  return db.withTransaction(async (connection) => {
    const cartId = await getOrCreateCart(userId, connection);

    const [productRows] = await connection.execute(
      `SELECT id, stock_quantity, name FROM products WHERE id = ? LIMIT 1`,
      [productId]
    );

    const product = productRows[0];
    if (!product) {
      throw new Error('Товар не найден');
    }

    if (Number(quantity) < 1 || Number(quantity) > 99) {
      throw new Error('Количество должно быть от 1 до 99');
    }

    if (Number(quantity) > Number(product.stock_quantity)) {
      throw new Error('Недостаточно товара на складе');
    }

    const existing = await getCartItem(cartId, productId, connection);
    if (existing) {
      await connection.execute(
        `UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?`,
        [quantity, existing.id]
      );
    } else {
      await connection.execute(
        `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)`,
        [cartId, productId, quantity]
      );
    }

    return { cartId, productName: product.name };
  });
}

async function removeItem({ userId, productId }) {
  return db.withTransaction(async (connection) => {
    const cartId = await getOrCreateCart(userId, connection);
    await connection.execute(
      `DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?`,
      [cartId, productId]
    );
    return { cartId };
  });
}

async function getDetailedCart(userId) {
  const rows = await db.query(
    `SELECT c.id AS cart_id, ci.product_id, ci.quantity, p.name, p.slug, p.price, p.stock_quantity,
            p.max_discount_percent, p.category_id,
            (SELECT image_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_path
     FROM carts c
     LEFT JOIN cart_items ci ON ci.cart_id = c.id
     LEFT JOIN products p ON p.id = ci.product_id
     WHERE c.user_id = ? AND c.status = 'active'
     ORDER BY ci.id ASC`,
    [userId]
  );

  return rows.filter((r) => r.product_id);
}

async function markCartAsOrdered(cartId, connection) {
  await connection.execute(
    `UPDATE carts SET status = 'ordered', updated_at = NOW() WHERE id = ?`,
    [cartId]
  );
}

async function getQuantityMap(userId) {
  const rows = await db.query(
    `SELECT ci.product_id, ci.quantity
     FROM carts c
     JOIN cart_items ci ON ci.cart_id = c.id
     WHERE c.user_id = ? AND c.status = 'active'`,
    [userId]
  );

  const map = {};
  rows.forEach((row) => {
    map[row.product_id] = row.quantity;
  });
  return map;
}

module.exports = {
  getOrCreateCart,
  upsertItem,
  removeItem,
  getDetailedCart,
  markCartAsOrdered,
  getQuantityMap
};
