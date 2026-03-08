const express = require('express');
const wishlistController = require('../controllers/wishlist.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, wishlistController.wishlistPage);

module.exports = router;
