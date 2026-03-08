const db = require('../utils/db.util');

async function getActiveSlots() {
  return db.query(
    `SELECT id, label, start_time, end_time
     FROM delivery_slots
     WHERE is_active = 1
     ORDER BY start_time ASC`
  );
}

module.exports = {
  getActiveSlots
};
