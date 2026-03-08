const db = require('../utils/db.util');

async function getAll() {
  return db.query(
    `SELECT id, name, slug
     FROM categories
     WHERE is_active = 1
     ORDER BY name ASC`
  );
}

module.exports = {
  getAll
};
