// src/routes/users.js
const express = require('express');
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getWishlist,
  getUserOrders,
  getUserOrder,
  cancelOrder,
  updatePreferences,
  getUserDashboard,
  searchOrders,
  getFavoriteProducts,
  updateCartItemVariant,
  getCartSummary
} = require('../controllers/userController');

const { protect } = require('../middleware/auth');

const {
  validateAddToCart,
  validateObjectId
} = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// Dashboard route
router.get('/dashboard', getUserDashboard);

// Cart routes
router.route('/cart')
  .get(getCart)
  .post(validateAddToCart, addToCart)
  .delete(clearCart);

router.get('/cart/summary', getCartSummary);

router.route('/cart/:itemId')
  .put(validateObjectId('itemId'), updateCartItem)
  .delete(validateObjectId('itemId'), removeFromCart);

router.patch('/cart/:itemId/variant', validateObjectId('itemId'), updateCartItemVariant);

// Wishlist routes
router.get('/wishlist', getWishlist);

// Orders routes
router.get('/orders', getUserOrders);
router.get('/orders/search', searchOrders);
router.get('/orders/:orderId', validateObjectId('orderId'), getUserOrder);
router.patch('/orders/:orderId/cancel', validateObjectId('orderId'), cancelOrder);

// User preferences
router.put('/preferences', updatePreferences);

// Favorites (most ordered products)
router.get('/favorites', getFavoriteProducts);

module.exports = router;