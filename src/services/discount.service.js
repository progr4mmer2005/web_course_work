function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function applyDiscountsToProduct({ basePrice, maxDiscountPercent = 40, discounts = [] }) {
  const originalPrice = Number(basePrice || 0);
  let percentTotal = 0;
  let fixedTotal = 0;

  discounts.forEach((rule) => {
    if (!rule || !rule.is_active) return;

    if (rule.discount_type === 'percent') {
      percentTotal += Number(rule.discount_value || 0);
    }

    if (rule.discount_type === 'fixed') {
      fixedTotal += Number(rule.discount_value || 0);
    }
  });

  let discounted = originalPrice;

  if (percentTotal > 0) {
    discounted = discounted * (1 - percentTotal / 100);
  }

  if (fixedTotal > 0) {
    discounted -= fixedTotal;
  }

  const maxDiscountMoney = originalPrice * (Number(maxDiscountPercent || 40) / 100);
  const minAllowedPrice = originalPrice - maxDiscountMoney;
  discounted = Math.max(discounted, minAllowedPrice);
  discounted = Math.max(discounted, 0);

  const saved = originalPrice - discounted;
  const finalDiscountPercent = originalPrice ? (saved / originalPrice) * 100 : 0;

  return {
    originalPrice,
    finalPrice: Number(discounted.toFixed(2)),
    saved: Number(saved.toFixed(2)),
    finalDiscountPercent: Number(clamp(finalDiscountPercent, 0, 100).toFixed(2))
  };
}

module.exports = {
  applyDiscountsToProduct
};
