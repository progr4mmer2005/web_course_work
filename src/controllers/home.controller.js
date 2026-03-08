const userModel = require('../models/user.model');
const reviewModel = require('../models/review.model');
const homeModel = require('../models/home.model');
const discountModel = require('../models/discount.model');
const cartModel = require('../models/cart.model');
const wishlistModel = require('../models/wishlist.model');
const { applyDiscountsToProduct } = require('../services/discount.service');

async function withPricing(items, cartQtyMap = {}, wishlistMap = {}) {
  return Promise.all(
    items.map(async (item) => {
      const discounts = await discountModel.getActiveDiscountsForProduct(item.id, item.category_id);
      const pricing = applyDiscountsToProduct({
        basePrice: item.price,
        maxDiscountPercent: item.max_discount_percent,
        discounts
      });

      return {
        ...item,
        card_id: item.id,
        pricing,
        cart_qty: Number(cartQtyMap[item.id] || 0),
        is_wishlisted: Boolean(wishlistMap[item.id]),
        inStock: item.stock_quantity > 0
      };
    })
  );
}

async function homePage(req, res, next) {
  try {
    const [user, recentStoreReviews, popularRaw, discountedRaw, cartQtyMap, wishlistMap] = await Promise.all([
      req.session.user ? userModel.findById(req.session.user.id) : null,
      reviewModel.getRecentStoreReviews(6),
      homeModel.getPopularProducts(8),
      homeModel.getDiscountedProducts(8),
      req.session.user ? cartModel.getQuantityMap(req.session.user.id) : Promise.resolve({}),
      req.session.user ? wishlistModel.getProductIdsMap(req.session.user.id) : Promise.resolve({})
    ]);

    if (user) {
      req.session.user = user;
    }

    const [popularProducts, discountedProducts] = await Promise.all([
      withPricing(popularRaw, cartQtyMap, wishlistMap),
      withPricing(discountedRaw, cartQtyMap, wishlistMap)
    ]);

    res.render('home/index', {
      title: 'Ювелирный салон',
      pageTitle: 'Ювелирный салон премиум-класса',
      reviewOk: String(req.query.review_ok || '') === '1',
      reviewError: String(req.query.review_error || '') === '1',
      recentStoreReviews,
      popularProducts,
      discountedProducts
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  homePage
};
