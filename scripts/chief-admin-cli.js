#!/usr/bin/env node
/* eslint-disable no-console */
const readline = require('readline');
const db = require('../src/utils/db.util');
const pool = require('../src/config/db');
const adminUserModel = require('../src/models/adminUser.model');

function makeRl() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function listUsers() {
  return db.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.is_active, r.code AS role_code,
            CASE WHEN ca.user_id IS NULL THEN 0 ELSE 1 END AS is_chief_admin
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN chief_admin ca ON ca.user_id = u.id
     ORDER BY u.id ASC`,
    []
  );
}

function printUsers(users) {
  console.log('\nСписок пользователей:\n');
  users.forEach((user) => {
    const chiefMark = Number(user.is_chief_admin) === 1 ? ' [ГЛАВНЫЙ АДМИН]' : '';
    const activeText = Number(user.is_active) === 1 ? 'активен' : 'выключен';
    console.log(
      `${String(user.id).padStart(3, ' ')} | ${user.email} | ${user.role_code} | ${activeText} | ${user.full_name}${chiefMark}`
    );
  });
  console.log('');
}

async function setOrToggleChiefAdminByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return { ok: false, message: 'Email не указан.' };
  }

  return db.withTransaction(async (connection) => {
    const [userRows] = await connection.execute(
      `SELECT u.id, u.full_name, u.email, u.is_active, r.code AS role_code
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    const targetUser = userRows[0];
    if (!targetUser) {
      return { ok: false, message: `Пользователь с email "${normalizedEmail}" не найден.` };
    }

    const [currentChiefRows] = await connection.execute(
      `SELECT user_id FROM chief_admin WHERE id = 1 LIMIT 1`,
      []
    );
    const currentChiefUserId = currentChiefRows[0] ? Number(currentChiefRows[0].user_id) : null;
    const targetUserId = Number(targetUser.id);

    if (currentChiefUserId === targetUserId) {
      await connection.execute(`DELETE FROM chief_admin WHERE id = 1`, []);
      return {
        ok: true,
        message: `Статус главного админа снят с пользователя ${targetUser.email}.`
      };
    }

    if (targetUser.role_code !== 'admin') {
      const [adminRoleRows] = await connection.execute(
        `SELECT id FROM roles WHERE code = 'admin' LIMIT 1`,
        []
      );
      const adminRoleId = adminRoleRows[0] ? Number(adminRoleRows[0].id) : 0;
      if (!adminRoleId) {
        return { ok: false, message: 'Роль "admin" не найдена в таблице roles.' };
      }

      await connection.execute(
        `UPDATE users
         SET role_id = ?, updated_at = NOW()
         WHERE id = ?`,
        [adminRoleId, targetUserId]
      );
    }

    if (Number(targetUser.is_active) !== 1) {
      await connection.execute(
        `UPDATE users
         SET is_active = 1, updated_at = NOW()
         WHERE id = ?`,
        [targetUserId]
      );
    }

    await connection.execute(
      `INSERT INTO chief_admin (id, user_id)
       VALUES (1, ?)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), updated_at = NOW()`,
      [targetUserId]
    );

    return {
      ok: true,
      message: `Пользователь ${targetUser.email} назначен главным админом.`
    };
  });
}

async function main() {
  const rl = makeRl();

  try {
    await adminUserModel.ensureChiefAdminTable();

    const users = await listUsers();
    printUsers(users);

    const email = await ask(rl, 'Введите email пользователя для назначения/снятия главного админа: ');
    const result = await setOrToggleChiefAdminByEmail(email);
    console.log(`\n${result.message}\n`);

    const updatedUsers = await listUsers();
    printUsers(updatedUsers);
  } catch (error) {
    console.error('\nОшибка:', error.message || error);
    process.exitCode = 1;
  } finally {
    rl.close();
    await pool.end();
  }
}

main();
