const productModel = require('../models/product.model');
const categoryModel = require('../models/category.model');
const discountModel = require('../models/discount.model');
const reviewModel = require('../models/review.model');
const cartModel = require('../models/cart.model');
const wishlistModel = require('../models/wishlist.model');
const { applyDiscountsToProduct } = require('../services/discount.service');

async function catalogPage(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = 12;

    const categoryId = req.query.category_id || '';
    const q = (req.query.q || '').trim();
    const priceFrom = req.query.price_from || '';
    const priceTo = req.query.price_to || '';
    const minDiscount = req.query.min_discount || '';
    const sortPrice = req.query.sort_price || '';
    const sortDiscount = req.query.sort_discount || '';
    const inStockRaw = req.query.in_stock;
    const onlyInStock = Array.isArray(inStockRaw)
      ? inStockRaw.includes('1')
      : (typeof inStockRaw === 'undefined' ? true : String(inStockRaw) === '1');

    const filters = {
      categoryId: categoryId || null,
      onlyInStock,
      q,
      priceFrom,
      priceTo,
      minDiscount,
      sortPrice,
      sortDiscount
    };

    const [catalog, categories, cartQtyMap, wishlistMap] = await Promise.all([
      productModel.getCatalog({
        categoryId: filters.categoryId,
        onlyInStock: filters.onlyInStock,
        q: filters.q
      }),
      categoryModel.getAll(),
      req.session.user ? cartModel.getQuantityMap(req.session.user.id) : Promise.resolve({}),
      req.session.user ? wishlistModel.getProductIdsMap(req.session.user.id) : Promise.resolve({})
    ]);

    const items = await Promise.all(
      catalog.items.map(async (item) => {
        const discounts = await discountModel.getActiveDiscountsForProduct(item.id, item.category_id);
        const pricing = applyDiscountsToProduct({
          basePrice: item.price,
          maxDiscountPercent: item.max_discount_percent,
          discounts
        });

        return {
          ...item,
          card_id: item.id,
          discounts,
          pricing,
          cart_qty: Number(cartQtyMap[item.id] || 0),
          is_wishlisted: Boolean(wishlistMap[item.id]),
          inStock: item.stock_quantity > 0
        };
      })
    );

    let filteredItems = items;

    if (priceFrom !== '' && priceFrom !== null && priceFrom !== undefined) {
      const from = Number(priceFrom);
      if (Number.isFinite(from)) {
        filteredItems = filteredItems.filter((x) => Number(x.pricing.finalPrice) >= from);
      }
    }

    if (priceTo !== '' && priceTo !== null && priceTo !== undefined) {
      const to = Number(priceTo);
      if (Number.isFinite(to)) {
        filteredItems = filteredItems.filter((x) => Number(x.pricing.finalPrice) <= to);
      }
    }

    if (minDiscount !== '' && minDiscount !== null && minDiscount !== undefined) {
      const minD = Number(minDiscount);
      if (Number.isFinite(minD)) {
        filteredItems = filteredItems.filter((x) => Number(x.pricing.finalDiscountPercent) >= minD);
      }
    }

    if (sortDiscount === 'asc' || sortDiscount === 'desc') {
      filteredItems = filteredItems.sort((a, b) => (
        sortDiscount === 'asc'
          ? Number(a.pricing.finalDiscountPercent) - Number(b.pricing.finalDiscountPercent)
          : Number(b.pricing.finalDiscountPercent) - Number(a.pricing.finalDiscountPercent)
      ));
    } else if (sortPrice === 'asc' || sortPrice === 'desc') {
      filteredItems = filteredItems.sort((a, b) => (
        sortPrice === 'asc'
          ? Number(a.pricing.finalPrice) - Number(b.pricing.finalPrice)
          : Number(b.pricing.finalPrice) - Number(a.pricing.finalPrice)
      ));
    }

    const total = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const offset = (safePage - 1) * limit;
    const pageItems = filteredItems.slice(offset, offset + limit);

    function buildQuery(targetPage) {
      const search = new URLSearchParams();
      if (q) search.set('q', q);
      if (categoryId) search.set('category_id', categoryId);
      search.set('in_stock', filters.onlyInStock ? '1' : '0');
      if (priceFrom !== '') search.set('price_from', String(priceFrom));
      if (priceTo !== '') search.set('price_to', String(priceTo));
      if (minDiscount !== '') search.set('min_discount', String(minDiscount));
      if (sortPrice) search.set('sort_price', sortPrice);
      if (sortDiscount) search.set('sort_discount', sortDiscount);
      if (targetPage > 1) search.set('page', String(targetPage));
      const s = search.toString();
      return s ? `?${s}` : '?';
    }

    res.render('catalog/list', {
      title: 'Каталог',
      items: pageItems,
      categories,
      filters,
      pagination: {
        page: safePage,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: safePage < totalPages,
        prevLink: buildQuery(safePage - 1),
        nextLink: buildQuery(safePage + 1)
      }
    });
  } catch (error) {
    next(error);
  }
}

async function productPage(req, res, next) {
  try {
    const product = await productModel.findBySlug(req.params.slug);
    if (!product) {
      return res.status(404).render('partials/error', {
        layout: 'main',
        title: 'Товар не найден',
        message: 'Товар не найден или удален'
      });
    }

    const [images, discounts, reviews, cartQtyMap, wishlistMap] = await Promise.all([
      productModel.getImages(product.id),
      discountModel.getActiveDiscountsForProduct(product.id, product.category_id),
      reviewModel.getProductReviews(product.id, 20),
      req.session.user ? cartModel.getQuantityMap(req.session.user.id) : Promise.resolve({}),
      req.session.user ? wishlistModel.getProductIdsMap(req.session.user.id) : Promise.resolve({})
    ]);

    const pricing = applyDiscountsToProduct({
      basePrice: product.price,
      maxDiscountPercent: product.max_discount_percent,
      discounts
    });

    let canReview = false;
    let userReview = null;
    if (req.session.user) {
      canReview = await reviewModel.hasDeliveredProductOrder(req.session.user.id, product.id);
      if (canReview) {
        userReview = await reviewModel.getUserReviewForProduct(req.session.user.id, product.id);
      }
    }

    return res.render('catalog/product', {
      title: product.name,
      product,
      cardProduct: {
        ...product,
        card_id: product.id,
        pricing,
        inStock: product.stock_quantity > 0,
        cart_qty: Number(cartQtyMap[product.id] || 0)
      },
      images,
      discounts,
      reviews,
      canReview,
      userReview,
      reviewOk: String(req.query.review_ok || '') === '1',
      reviewError: String(req.query.review_error || '') === '1',
      pricing,
      cart_qty: Number(cartQtyMap[product.id] || 0),
      is_wishlisted: Boolean(wishlistMap[product.id]),
      inStock: product.stock_quantity > 0
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  catalogPage,
  productPage
};
