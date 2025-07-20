// src/routes/products.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  addToWishlist,
  removeFromWishlist,
  getProductVariants,
  updateStock,
  getFeaturedProducts,
  getProductCategories,
  getProductBrands
} = require('../controllers/productController');

const { protect, authorize, optionalAuth } = require('../middleware/auth');

const {
  validateProduct,
  validateUpdateProduct,
  validateSearch,
  validateObjectId
} = require('../middleware/validation');

const router = express.Router();

// Configure multer for multiple file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products/');
  },
  filename: function (req, file, cb) {
    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  }
});

// Public routes
router.get('/featured', getFeaturedProducts);
router.get('/categories', getProductCategories);
router.get('/brands', getProductBrands);
router.get('/', validateSearch, getProducts);
router.get('/:id', validateObjectId(), optionalAuth, getProduct);
router.get('/:id/variants', validateObjectId(), getProductVariants);

// Protected routes
router.use(protect);

// Wishlist routes
router.post('/:id/wishlist', validateObjectId(), addToWishlist);
router.delete('/:id/wishlist', validateObjectId(), removeFromWishlist);

// Seller/Admin routes
router.post('/', authorize('seller', 'admin'), validateProduct, createProduct);
router.put('/:id', validateObjectId(), authorize('seller', 'admin'), validateUpdateProduct, updateProduct);
router.delete('/:id', validateObjectId(), authorize('seller', 'admin'), deleteProduct);

// Image management routes
router.post('/:id/images', validateObjectId(), authorize('seller', 'admin'), upload.array('images', 10), uploadProductImages);
router.delete('/:id/images/:imageId', validateObjectId(), authorize('seller', 'admin'), deleteProductImage);

// Stock management routes
router.patch('/:id/stock', validateObjectId(), authorize('seller', 'admin'), updateStock);

module.exports = router;