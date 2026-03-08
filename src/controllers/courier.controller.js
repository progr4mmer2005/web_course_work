const orderModel = require('../models/order.model');

async function courierOrdersPage(req, res, next) {
  try {
    const items = await orderModel.listCourierOrders(req.session.user.id, req.session.user.role_code);
    return res.render('courier/orders', {
      title: 'Доставка',
      items
    });
  } catch (error) {
    return next(error);
  }
}

async function acceptOrder(req, res, next) {
  try {
    await orderModel.acceptOrderByCourier(Number(req.params.id), req.session.user.id);
    return res.redirect('/courier/orders');
  } catch (error) {
    return next(error);
  }
}

async function confirmDelivered(req, res, next) {
  try {
    await orderModel.courierConfirmDelivery(Number(req.params.id), req.session.user.id);
    return res.redirect('/courier/orders');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  courierOrdersPage,
  acceptOrder,
  confirmDelivered
};

