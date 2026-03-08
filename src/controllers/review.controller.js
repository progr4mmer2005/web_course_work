const reviewModel = require('../models/review.model');
const productModel = require('../models/product.model');
const userModel = require('../models/user.model');

function validRating(value) {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

async function createProductReview(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(403).render('partials/error', {
        layout: 'main',
        title: 'Нет доступа',
        message: 'Для отправки отзыва нужно войти в аккаунт'
      });
    }

    const user = await userModel.findById(req.session.user.id);
    if (!user || Number(user.can_review_product || 0) !== 1) {
      return res.status(403).render('partials/error', {
        layout: 'main',
        title: 'Отзыв недоступен',
        message: 'Администратор ограничил вам возможность оставлять отзывы на товары'
      });
    }

    const product = await productModel.findBySlug(req.params.slug);
    if (!product) {
      return res.status(404).render('partials/error', {
        layout: 'main',
        title: 'Товар не найден',
        message: 'Товар не найден'
      });
    }

    const rating = Number(req.body.rating);
    const commentText = String(req.body.comment_text || '').trim();

    if (!validRating(rating) || commentText.length < 5) {
      return res.redirect(`/catalog/${product.slug}?review_error=1`);
    }

    const canReview = await reviewModel.hasDeliveredProductOrder(req.session.user.id, product.id);
    if (!canReview) {
      return res.status(403).render('partials/error', {
        layout: 'main',
        title: 'Отзыв недоступен',
        message: 'Вы сможете оставить отзыв только после заказа этого товара'
      });
    }

    await reviewModel.upsertProductReview({
      userId: req.session.user.id,
      productId: product.id,
      rating,
      commentText
    });

    return res.redirect(`/catalog/${product.slug}?review_ok=1`);
  } catch (error) {
    return next(error);
  }
}

async function createStoreReview(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(403).render('partials/error', {
        layout: 'main',
        title: 'Нет доступа',
        message: 'Для отправки отзыва нужно войти в аккаунт'
      });
    }

    const user = await userModel.findById(req.session.user.id);
    if (!user || Number(user.can_review_store || 0) !== 1) {
      return res.status(403).render('partials/error', {
        layout: 'main',
        title: 'Отзыв недоступен',
        message: 'Администратор ограничил вам возможность оставлять отзыв о магазине'
      });
    }

    const rating = Number(req.body.rating);
    const commentText = String(req.body.comment_text || '').trim();

    if (!validRating(rating) || commentText.length < 5) {
      return res.redirect('/?review_error=1');
    }

    const canReview = await reviewModel.hasDeliveredAnyOrder(req.session.user.id);
    if (!canReview) {
      return res.status(403).render('partials/error', {
        layout: 'main',
        title: 'Отзыв недоступен',
        message: 'Оставить отзыв на магазин можно только после оформления заказа'
      });
    }

    await reviewModel.upsertStoreReview({
      userId: req.session.user.id,
      rating,
      commentText
    });

    return res.redirect('/?review_ok=1');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createProductReview,
  createStoreReview
};
