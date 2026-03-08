const express = require('express');
const reviewController = require('../controllers/review.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/store', requireAuth, reviewController.createStoreReview);

module.exports = router;
