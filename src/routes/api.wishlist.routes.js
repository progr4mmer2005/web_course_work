const express = require('express');
const wishlistController = require('../controllers/wishlist.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/items', requireAuth, wishlistController.addItem);
router.post('/items/toggle', requireAuth, wishlistController.toggleItem);
router.delete('/items/:productId', requireAuth, wishlistController.removeItem);
router.post('/remove-jobs', requireAuth, wishlistController.scheduleRemove);
router.post('/remove-jobs/:jobId/cancel', requireAuth, wishlistController.cancelRemove);
router.post('/remove-jobs/:jobId/execute', requireAuth, wishlistController.executeRemove);

module.exports = router;
