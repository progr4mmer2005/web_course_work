const db = require('../utils/db.util');

async function findByEmail(email) {
  const rows = await db.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_path, u.password_hash,
            u.can_review_product, u.can_review_store, r.code AS role_code
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = ? AND u.is_active = 1
     LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function createClient({ fullName, email, phone, passwordHash }) {
  const roleRows = await db.query('SELECT id FROM roles WHERE code = ? LIMIT 1', ['client']);
  if (!roleRows[0]) {
    throw new Error('Role client does not exist');
  }

  const result = await db.query(
    `INSERT INTO users (role_id, full_name, email, phone, password_hash, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [roleRows[0].id, fullName, email, phone, passwordHash]
  );

  return result.insertId;
}

async function findById(id) {
  const rows = await db.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_path,
            u.can_review_product, u.can_review_store, r.code AS role_code
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function emailExistsForAnotherUser(email, userId) {
  const rows = await db.query(
    `SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1`,
    [email, userId]
  );
  return Boolean(rows[0]);
}

async function updateProfile(userId, { fullName, email, phone, avatarPath }) {
  const hasAvatar = typeof avatarPath === 'string' && avatarPath.length > 0;

  if (hasAvatar) {
    return db.query(
      `UPDATE users
       SET full_name = ?, email = ?, phone = ?, avatar_path = ?, updated_at = NOW()
       WHERE id = ?`,
      [fullName, email, phone, avatarPath, userId]
    );
  }

  return db.query(
    `UPDATE users
     SET full_name = ?, email = ?, phone = ?, updated_at = NOW()
     WHERE id = ?`,
    [fullName, email, phone, userId]
  );
}

async function getPasswordHashById(userId) {
  const rows = await db.query(
    `SELECT password_hash
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] ? rows[0].password_hash : null;
}

async function updatePasswordHash(userId, passwordHash) {
  return db.query(
    `UPDATE users
     SET password_hash = ?, updated_at = NOW()
     WHERE id = ?`,
    [passwordHash, userId]
  );
}

module.exports = {
  findByEmail,
  createClient,
  findById,
  emailExistsForAnotherUser,
  updateProfile,
  getPasswordHashById,
  updatePasswordHash
};
