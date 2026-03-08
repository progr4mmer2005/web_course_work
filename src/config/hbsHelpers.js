function formatCurrency(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

module.exports = {
  eq: (a, b) => String(a) === String(b),
  ne: (a, b) => a !== b,
  gt: (a, b) => Number(a) > Number(b),
  gte: (a, b) => Number(a) >= Number(b),
  lt: (a, b) => Number(a) < Number(b),
  and: (a, b) => Boolean(a && b),
  or: (a, b) => Boolean(a || b),
  formatCurrency,
  multiply: (a, b) => Number(a || 0) * Number(b || 0),
  json: (value) => JSON.stringify(value)
};
