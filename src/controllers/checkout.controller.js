const checkoutService = require('../services/checkout.service');
const addressModel = require('../models/address.model');
const slotModel = require('../models/deliverySlot.model');

async function checkoutPage(req, res, next) {
  try {
    const promoCodes = Array.isArray(req.session.cartPromoCodes) ? req.session.cartPromoCodes : [];
    const [pricing, addresses, slots] = await Promise.all([
      checkoutService.buildCartPricingWithPromos(req.session.user.id, promoCodes),
      addressModel.getUserAddresses(req.session.user.id),
      slotModel.getActiveSlots()
    ]);

    return res.render('checkout/index', {
      title: 'Оформление заказа',
      ...pricing,
      addresses,
      slots
    });
  } catch (error) {
    return next(error);
  }
}

async function placeOrder(req, res, next) {
  try {
    let addressId = Number(req.body.address_id || 0);

    if (!addressId) {
      const required = ['city', 'street', 'house'];
      for (const key of required) {
        if (!req.body[key] || !String(req.body[key]).trim()) {
          return res.status(400).render('partials/error', {
            layout: 'main',
            title: 'Ошибка оформления',
            message: 'Заполните адрес доставки'
          });
        }
      }

      addressId = await addressModel.createAddress(req.session.user.id, req.body);
    }

    if (!req.body.phone || String(req.body.phone).trim().length < 10) {
      return res.status(400).render('partials/error', {
        layout: 'main',
        title: 'Ошибка оформления',
        message: 'Укажите корректный телефон'
      });
    }

    const sessionPromoCodes = Array.isArray(req.session.cartPromoCodes) ? req.session.cartPromoCodes : [];
    const promoCodesInput = sessionPromoCodes.join(' ');

    const result = await checkoutService.placeOrder({
      userId: req.session.user.id,
      addressId,
      slotId: Number(req.body.slot_id),
      phone: String(req.body.phone).trim(),
      commentText: req.body.comment_text || '',
      promoCodesInput
    });

    req.session.cartPromoCodes = [];

    return res.render('checkout/success', {
      title: 'Заказ оформлен',
      order: result
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  checkoutPage,
  placeOrder
};
