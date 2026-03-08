const db = require('../utils/db.util');

async function getOrCreateWishlist(userId, connection = null) {
  const runner = connection || { execute: (sql, params) => require('../config/db').execute(sql, params) };
  const [rows] = await runner.execute(
    `SELECT id FROM wishlists WHERE user_id = ? LIMIT 1`,
    [userId]
  );

  if (rows[0]) return rows[0].id;

  const [insertResult] = await runner.execute(
    `INSERT INTO wishlists (user_id) VALUES (?)`,
    [userId]
  );

  return insertResult.insertId;
}

async function addItem(userId, productId) {
  return db.withTransaction(async (connection) => {
    const wishlistId = await getOrCreateWishlist(userId, connection);
    await connection.execute(
      `INSERT IGNORE INTO wishlist_items (wishlist_id, product_id) VALUES (?, ?)`,
      [wishlistId, productId]
    );
    return { wishlistId };
  });
}

async function removeItem(userId, productId) {
  return db.withTransaction(async (connection) => {
    const wishlistId = await getOrCreateWishlist(userId, connection);
    await connection.execute(
      `DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?`,
      [wishlistId, productId]
    );
    return { wishlistId };
  });
}

async function getItems(userId) {
  return db.query(
    `SELECT wi.product_id, p.name, p.slug, p.price, p.stock_quantity, p.category_id, p.max_discount_percent,
            (SELECT image_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_path
     FROM wishlists w
     JOIN wishlist_items wi ON wi.wishlist_id = w.id
     JOIN products p ON p.id = wi.product_id
     WHERE w.user_id = ?
     ORDER BY wi.id DESC`,
    [userId]
  );
}

async function getProductIdsMap(userId) {
  const rows = await db.query(
    `SELECT wi.product_id
     FROM wishlists w
     JOIN wishlist_items wi ON wi.wishlist_id = w.id
     WHERE w.user_id = ?`,
    [userId]
  );

  const map = {};
  rows.forEach((row) => {
    map[row.product_id] = true;
  });
  return map;
}

async function scheduleRemove(userId, productId, seconds = 7) {
  const result = await db.query(
    `INSERT INTO wishlist_remove_jobs (user_id, product_id, delete_after, is_canceled)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), 0)`,
    [userId, productId, seconds]
  );

  return result.insertId;
}

async function cancelRemove(userId, jobId) {
  await db.query(
    `UPDATE wishlist_remove_jobs SET is_canceled = 1 WHERE id = ? AND user_id = ?`,
    [jobId, userId]
  );
}

async function executeRemove(userId, jobId) {
  return db.withTransaction(async (connection) => {
    const [jobRows] = await connection.execute(
      `SELECT id, product_id, is_canceled, delete_after
       FROM wishlist_remove_jobs
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [jobId, userId]
    );

    const job = jobRows[0];
    if (!job) throw new Error('Задача удаления не найдена');
    if (job.is_canceled) return { canceled: true };

    const [timeRows] = await connection.execute(
      `SELECT NOW() AS now_time`,
      []
    );

    const nowTime = new Date(timeRows[0].now_time);
    const deleteAfter = new Date(job.delete_after);

    if (nowTime < deleteAfter) {
      throw new Error('Время удаления еще не наступило');
    }

    const wishlistId = await getOrCreateWishlist(userId, connection);

    await connection.execute(
      `DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?`,
      [wishlistId, job.product_id]
    );

    return { removed: true };
  });
}

module.exports = {
  addItem,
  removeItem,
  getItems,
  getProductIdsMap,
  scheduleRemove,
  cancelRemove,
  executeRemove
};
