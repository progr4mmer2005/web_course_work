function normalizeBool(value) {
  return value === '1' || value === 'on' || value === true || value === 1;
}

function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = {
  normalizeBool,
  slugify
};
