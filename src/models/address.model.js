const db = require('../utils/db.util');

async function getUserAddresses(userId) {
  return db.query(
    `SELECT id, city, street, house, apartment, comment_text, is_default
     FROM user_addresses
     WHERE user_id = ?
     ORDER BY is_default DESC, id DESC`,
    [userId]
  );
}

async function createAddress(userId, data) {
  const result = await db.query(
    `INSERT INTO user_addresses (user_id, city, street, house, apartment, comment_text, is_default)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [userId, data.city, data.street, data.house, data.apartment || null, data.comment_text || null]
  );

  return result.insertId;
}

module.exports = {
  getUserAddresses,
  createAddress
};
