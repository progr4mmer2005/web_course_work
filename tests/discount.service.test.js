const { expect } = require('chai');
const { applyDiscountsToProduct } = require('../src/services/discount.service');

describe('discount.service', () => {
  it('applies percent and fixed discounts', () => {
    const result = applyDiscountsToProduct({
      basePrice: 10000,
      maxDiscountPercent: 40,
      discounts: [
        { is_active: 1, discount_type: 'percent', discount_value: 10 },
        { is_active: 1, discount_type: 'fixed', discount_value: 500 }
      ]
    });

    expect(result.finalPrice).to.equal(8500);
    expect(result.saved).to.equal(1500);
  });

  it('respects max discount percent clamp', () => {
    const result = applyDiscountsToProduct({
      basePrice: 10000,
      maxDiscountPercent: 40,
      discounts: [
        { is_active: 1, discount_type: 'percent', discount_value: 60 }
      ]
    });

    expect(result.finalPrice).to.equal(6000);
    expect(result.finalDiscountPercent).to.equal(40);
  });
});
