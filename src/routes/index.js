const express = require('express');
const homeRoutes = require('./home.routes');
const authRoutes = require('./auth.routes');
const catalogRoutes = require('./catalog.routes');
const adminRoutes = require('./admin.routes');
const cartRoutes = require('./cart.routes');
const checkoutRoutes = require('./checkout.routes');
const wishlistRoutes = require('./wishlist.routes');
const profileRoutes = require('./profile.routes');
const reviewRoutes = require('./review.routes');
const courierRoutes = require('./courier.routes');
const apiCartRoutes = require('./api.cart.routes');
const apiWishlistRoutes = require('./api.wishlist.routes');

const router = express.Router();

router.use('/', homeRoutes);
router.use('/auth', authRoutes);
router.use('/catalog', catalogRoutes);
router.use('/admin', adminRoutes);
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/profile', profileRoutes);
router.use('/reviews', reviewRoutes);
router.use('/courier', courierRoutes);
router.use('/api/cart', apiCartRoutes);
router.use('/api/wishlist', apiWishlistRoutes);

module.exports = router;
