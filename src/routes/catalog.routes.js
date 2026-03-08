const express = require('express');
const catalogController = require('../controllers/catalog.controller');
const reviewController = require('../controllers/review.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', catalogController.catalogPage);
router.get('/:slug', catalogController.productPage);
router.post('/:slug/reviews', requireAuth, reviewController.createProductReview);

module.exports = router;
