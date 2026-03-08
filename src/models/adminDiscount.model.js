const db = require('../utils/db.util');

function toIdList(value) {
  const input = Array.isArray(value) ? value : value ? [value] : [];
  const ids = input.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0);
  return [...new Set(ids)];
}

function normalizeDateValue(value) {
  const text = String(value || '').trim();
  return text ? text : null;
}

function validateDiscountPayload(data, productIds, categoryIds) {
  if (!data.name || !String(data.name).trim()) {
    throw new Error('Укажите название скидки');
  }

  if (!['product', 'category', 'list', 'catalog', 'order_sum'].includes(String(data.scope || ''))) {
    throw new Error('Некорректная область действия скидки');
  }

  if (!['percent', 'fixed'].includes(String(data.discount_type || ''))) {
    throw new Error('Некорректный тип скидки');
  }

  if (!Number.isFinite(Number(data.discount_value)) || Number(data.discount_value) <= 0) {
    throw new Error('Значение скидки должно быть больше 0');
  }

  if (data.scope === 'product' && productIds.length !== 1) {
    throw new Error('Для скидки "Один товар" выберите ровно один товар');
  }

  if (data.scope === 'list' && productIds.length < 1) {
    throw new Error('Для скидки "Список товаров" выберите хотя бы один товар');
  }

  if (data.scope === 'category' && categoryIds.length < 1) {
    throw new Error('Для скидки "Категория" выберите хотя бы одну категорию');
  }

  const startAt = normalizeDateValue(data.start_at);
  const endAt = normalizeDateValue(data.end_at);
  if (startAt && endAt && new Date(startAt).getTime() > new Date(endAt).getTime()) {
    throw new Error('Дата начала не может быть позже даты окончания');
  }

  if (data.is_promo && !String(data.promo_code || '').trim()) {
    throw new Error('Введите код промокода');
  }
}

async function listDiscounts(search = '') {
  const q = `%${search}%`;
  return db.query(
    `SELECT dr.id, dr.name, dr.scope, dr.discount_type, dr.discount_value, dr.stackable, dr.is_active, dr.start_at, dr.end_at,
            MAX(pc.code) AS promo_code
     FROM discount_rules dr
     LEFT JOIN promo_codes pc ON pc.discount_rule_id = dr.id AND pc.is_active = 1
     WHERE (? = '%%' OR name LIKE ?)
     GROUP BY dr.id
     ORDER BY dr.id DESC`,
    [q, q]
  );
}

async function getDiscountById(id) {
  const rows = await db.query(
    `SELECT dr.id, dr.name, dr.description_text, dr.scope, dr.discount_type, dr.discount_value, dr.stackable,
            dr.min_order_amount, dr.max_order_amount, dr.start_at, dr.end_at, dr.is_active,
            pc.code AS promo_code
     FROM discount_rules dr
     LEFT JOIN promo_codes pc ON pc.discount_rule_id = dr.id AND pc.is_active = 1
     WHERE dr.id = ?
     LIMIT 1`,
    [id]
  );
  if (!rows[0]) return null;
  return {
    ...rows[0],
    is_promo: Boolean(rows[0].promo_code)
  };
}

async function getDiscountTargets(discountRuleId) {
  const [productRows, categoryRows, catalogRows] = await Promise.all([
    db.query('SELECT product_id FROM discount_targets_products WHERE discount_rule_id = ?', [discountRuleId]),
    db.query('SELECT category_id FROM discount_targets_categories WHERE discount_rule_id = ?', [discountRuleId]),
    db.query('SELECT id FROM discount_targets_catalog WHERE discount_rule_id = ? LIMIT 1', [discountRuleId])
  ]);

  return {
    product_ids: productRows.map((r) => r.product_id),
    category_ids: categoryRows.map((r) => r.category_id),
    is_catalog: Boolean(catalogRows[0])
  };
}

async function replaceTargets(connection, discountRuleId, scope, productIds, categoryIds) {
  await connection.execute('DELETE FROM discount_targets_products WHERE discount_rule_id = ?', [discountRuleId]);
  await connection.execute('DELETE FROM discount_targets_categories WHERE discount_rule_id = ?', [discountRuleId]);
  await connection.execute('DELETE FROM discount_targets_catalog WHERE discount_rule_id = ?', [discountRuleId]);

  if (scope === 'catalog') {
    await connection.execute('INSERT INTO discount_targets_catalog (discount_rule_id) VALUES (?)', [discountRuleId]);
    return;
  }

  if (scope === 'category') {
    for (const categoryId of categoryIds) {
      await connection.execute(
        'INSERT INTO discount_targets_categories (discount_rule_id, category_id) VALUES (?, ?)',
        [discountRuleId, categoryId]
      );
    }
    return;
  }

  if (scope === 'product') {
    if (productIds[0]) {
      await connection.execute(
        'INSERT INTO discount_targets_products (discount_rule_id, product_id) VALUES (?, ?)',
        [discountRuleId, productIds[0]]
      );
    }
    return;
  }

  if (scope === 'list') {
    for (const productId of productIds) {
      await connection.execute(
        'INSERT INTO discount_targets_products (discount_rule_id, product_id) VALUES (?, ?)',
        [discountRuleId, productId]
      );
    }
  }
}

async function replacePromoCode(connection, discountRuleId, isPromo, promoCode) {
  await connection.execute('DELETE FROM promo_codes WHERE discount_rule_id = ?', [discountRuleId]);

  if (!isPromo) return;
  if (!promoCode) return;

  await connection.execute(
    `INSERT INTO promo_codes (code, discount_rule_id, max_uses, is_active)
     VALUES (?, ?, NULL, 1)`,
    [promoCode, discountRuleId]
  );
}

async function createDiscount(data) {
  const productIds = toIdList(data.product_ids);
  const categoryIds = toIdList(data.category_ids);
  const startAt = normalizeDateValue(data.start_at);
  const endAt = normalizeDateValue(data.end_at);
  validateDiscountPayload(data, productIds, categoryIds);

  return db.withTransaction(async (connection) => {
    const [insertResult] = await connection.execute(
      `INSERT INTO discount_rules (
        name, description_text, scope, discount_type, discount_value, stackable,
        min_order_amount, max_order_amount, start_at, end_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.description_text || null,
        data.scope,
        data.discount_type,
        data.discount_value,
        data.stackable ? 1 : 0,
        data.min_order_amount || null,
        data.max_order_amount || null,
        startAt,
        endAt,
        data.is_active ? 1 : 0
      ]
    );

    const discountRuleId = insertResult.insertId;
    await replaceTargets(connection, discountRuleId, data.scope, productIds, categoryIds);
    await replacePromoCode(connection, discountRuleId, data.is_promo, data.promo_code);

    return discountRuleId;
  });
}

async function updateDiscount(id, data) {
  const productIds = toIdList(data.product_ids);
  const categoryIds = toIdList(data.category_ids);
  const startAt = normalizeDateValue(data.start_at);
  const endAt = normalizeDateValue(data.end_at);
  validateDiscountPayload(data, productIds, categoryIds);

  return db.withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE discount_rules SET
        name = ?, description_text = ?, scope = ?, discount_type = ?, discount_value = ?, stackable = ?,
        min_order_amount = ?, max_order_amount = ?, start_at = ?, end_at = ?, is_active = ?
       WHERE id = ?`,
      [
        data.name,
        data.description_text || null,
        data.scope,
        data.discount_type,
        data.discount_value,
        data.stackable ? 1 : 0,
        data.min_order_amount || null,
        data.max_order_amount || null,
        startAt,
        endAt,
        data.is_active ? 1 : 0,
        id
      ]
    );

    await replaceTargets(connection, id, data.scope, productIds, categoryIds);
    await replacePromoCode(connection, id, data.is_promo, data.promo_code);
  });
}

async function deleteDiscount(id) {
  return db.query('DELETE FROM discount_rules WHERE id = ?', [id]);
}

module.exports = {
  listDiscounts,
  getDiscountById,
  getDiscountTargets,
  createDiscount,
  updateDiscount,
  deleteDiscount
};
