const express = require('express');
const catalogController = require('../controllers/catalog.controller');
const reviewController = require('../controllers/review.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', catalogController.catalogPage);
router.post('/:slug/reviews', requireAuth, reviewController.createProductReview);
router.get('/:slug/reviews', (req, res) => res.redirect(`/catalog/${req.params.slug}`));
router.get('/:slug', catalogController.productPage);

module.exports = router;
