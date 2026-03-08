function formatCurrency(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
  formatDate,
  multiply: (a, b) => Number(a || 0) * Number(b || 0),
  json: (value) => JSON.stringify(value)
};
