const wishlistModel = require('../models/wishlist.model');
const discountModel = require('../models/discount.model');
const cartModel = require('../models/cart.model');
const { applyDiscountsToProduct } = require('../services/discount.service');

async function wishlistPage(req, res, next) {
  try {
    const [itemsRaw, cartQtyMap] = await Promise.all([
      wishlistModel.getItems(req.session.user.id),
      cartModel.getQuantityMap(req.session.user.id)
    ]);

    const items = await Promise.all(
      itemsRaw.map(async (item) => {
        const discounts = await discountModel.getActiveDiscountsForProduct(item.product_id, item.category_id);
        const pricing = applyDiscountsToProduct({
          basePrice: item.price,
          maxDiscountPercent: item.max_discount_percent,
          discounts
        });

        return {
          ...item,
          card_id: item.product_id,
          id: item.product_id,
          discounts,
          pricing,
          cart_qty: Number(cartQtyMap[item.product_id] || 0),
          inStock: item.stock_quantity > 0
        };
      })
    );

    return res.render('wishlist/index', {
      title: 'Избранное',
      items
    });
  } catch (error) {
    return next(error);
  }
}

async function addItem(req, res) {
  try {
    const productId = Number(req.body.product_id);
    await wishlistModel.addItem(req.session.user.id, productId);
    return res.json({ ok: true, data: { product_id: productId, is_wishlisted: true } });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message || 'Не удалось добавить в избранное' });
  }
}

async function removeItem(req, res) {
  try {
    const productId = Number(req.params.productId);
    await wishlistModel.removeItem(req.session.user.id, productId);
    return res.json({ ok: true, data: { product_id: productId, is_wishlisted: false } });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message || 'Не удалось удалить из избранного' });
  }
}

async function toggleItem(req, res) {
  try {
    const productId = Number(req.body.product_id);
    const action = String(req.body.action || '').trim().toLowerCase();

    if (!productId) {
      return res.status(400).json({ ok: false, message: 'Некорректный товар' });
    }

    if (action === 'remove') {
      await wishlistModel.removeItem(req.session.user.id, productId);
      return res.json({ ok: true, data: { product_id: productId, is_wishlisted: false } });
    }

    await wishlistModel.addItem(req.session.user.id, productId);
    return res.json({ ok: true, data: { product_id: productId, is_wishlisted: true } });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message || 'Не удалось изменить избранное' });
  }
}

async function scheduleRemove(req, res) {
  try {
    const seconds = 2;
    const jobId = await wishlistModel.scheduleRemove(req.session.user.id, Number(req.body.product_id), seconds);
    return res.json({ ok: true, data: { job_id: jobId, seconds } });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message || 'Не удалось запланировать удаление' });
  }
}

async function cancelRemove(req, res) {
  try {
    await wishlistModel.cancelRemove(req.session.user.id, Number(req.params.jobId));
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message || 'Не удалось отменить удаление' });
  }
}

async function executeRemove(req, res) {
  try {
    const result = await wishlistModel.executeRemove(req.session.user.id, Number(req.params.jobId));
    return res.json({ ok: true, data: result });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message || 'Не удалось удалить из избранного' });
  }
}

module.exports = {
  wishlistPage,
  addItem,
  removeItem,
  toggleItem,
  scheduleRemove,
  cancelRemove,
  executeRemove
};
