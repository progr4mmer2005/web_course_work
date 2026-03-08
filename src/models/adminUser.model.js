const db = require('../utils/db.util');

async function listRoles() {
  return db.query(
    `SELECT id, code, name
     FROM roles
     ORDER BY id ASC`
  );
}

async function listUsers(search = '', roleCode = '') {
  const q = `%${search}%`;
  return db.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.is_active, u.created_at,
            u.can_review_product, u.can_review_store,
            r.code AS role_code, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE (? = '%%' OR u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)
       AND (? = '' OR r.code = ?)
     ORDER BY u.id DESC`,
    [q, q, q, q, roleCode, roleCode]
  );
}

async function getUserById(id) {
  const rows = await db.query(
    `SELECT u.id, u.role_id, u.full_name, u.email, u.phone, u.is_active,
            u.can_review_product, u.can_review_store, r.code AS role_code
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function getRoleIdByCode(code) {
  const rows = await db.query(`SELECT id FROM roles WHERE code = ? LIMIT 1`, [code]);
  return rows[0] ? Number(rows[0].id) : null;
}

async function emailExists(email, exceptUserId = null) {
  const params = [email];
  let sql = `SELECT id FROM users WHERE email = ?`;
  if (exceptUserId) {
    sql += ` AND id <> ?`;
    params.push(exceptUserId);
  }
  sql += ` LIMIT 1`;
  const rows = await db.query(sql, params);
  return Boolean(rows[0]);
}

async function createUser(payload) {
  return db.query(
    `INSERT INTO users (
      role_id, full_name, email, phone, password_hash, is_active, can_review_product, can_review_store
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.role_id,
      payload.full_name,
      payload.email,
      payload.phone,
      payload.password_hash,
      payload.is_active ? 1 : 0,
      payload.can_review_product ? 1 : 0,
      payload.can_review_store ? 1 : 0
    ]
  );
}

async function updateUser(id, payload) {
  const params = [
    payload.role_id,
    payload.full_name,
    payload.email,
    payload.phone,
    payload.is_active ? 1 : 0,
    payload.can_review_product ? 1 : 0,
    payload.can_review_store ? 1 : 0
  ];
  let sql = `UPDATE users
             SET role_id = ?, full_name = ?, email = ?, phone = ?, is_active = ?,
                 can_review_product = ?, can_review_store = ?`;

  if (payload.password_hash) {
    sql += `, password_hash = ?`;
    params.push(payload.password_hash);
  }

  sql += `, updated_at = NOW() WHERE id = ?`;
  params.push(id);

  return db.query(sql, params);
}

async function deleteUser(id) {
  return db.query(
    `UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?`,
    [id]
  );
}

async function setUserActive(id, isActive) {
  return db.query(
    `UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?`,
    [isActive ? 1 : 0, id]
  );
}

async function hardDeleteUser(id) {
  return db.query(`DELETE FROM users WHERE id = ?`, [id]);
}

module.exports = {
  listRoles,
  listUsers,
  getUserById,
  getRoleIdByCode,
  emailExists,
  createUser,
  updateUser,
  deleteUser,
  setUserActive,
  hardDeleteUser
};
