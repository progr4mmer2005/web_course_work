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
    const user = req.session.user ? await userModel.findById(req.session.user.id) : null;

    const [recentStoreReviews, popularRaw, discountedRaw, cartQtyMap, wishlistMap, userStoreReview, canStoreReview] = await Promise.all([
      reviewModel.getRecentStoreReviews(6),
      homeModel.getPopularProducts(8),
      homeModel.getDiscountedProducts(8),
      user ? cartModel.getQuantityMap(user.id) : Promise.resolve({}),
      user ? wishlistModel.getProductIdsMap(user.id) : Promise.resolve({}),
      user ? reviewModel.getUserStoreReview(user.id) : Promise.resolve(null),
      user ? reviewModel.hasDeliveredAnyOrder(user.id) : Promise.resolve(false)
    ]);

    if (user) {
      req.session.user = user;
    }

    const [popularProducts, discountedProductsRaw] = await Promise.all([
      withPricing(popularRaw, cartQtyMap, wishlistMap),
      withPricing(discountedRaw, cartQtyMap, wishlistMap)
    ]);

    const discountedProducts = discountedProductsRaw
      .filter((item) => Number(item?.pricing?.finalDiscountPercent || 0) > 0)
      .sort((a, b) => Number(b?.pricing?.finalDiscountPercent || 0) - Number(a?.pricing?.finalDiscountPercent || 0));

    res.render('home/index', {
      title: 'Ювелирный салон',
      pageTitle: 'Ювелирный салон премиум-класса',
      reviewOk: String(req.query.review_ok || '') === '1',
      reviewError: String(req.query.review_error || '') === '1',
      storeReviewDeleted: String(req.query.store_review_deleted || '') === '1',
      storeReviewDeleteError: String(req.query.store_review_deleted || '') === '0',
      recentStoreReviews,
      userStoreReview,
      canStoreReview,
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
