const { expect } = require('chai');
const { splitPromoCodes } = require('../src/services/checkout.service');

describe('checkout.service splitPromoCodes', () => {
  it('splits promo codes by space/comma/semicolon', () => {
    const codes = splitPromoCodes('welcome7, spring10; vip');
    expect(codes).to.deep.equal(['WELCOME7', 'SPRING10', 'VIP']);
  });
});
