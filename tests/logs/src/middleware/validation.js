// src/middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

// User validation rules
const validateRegister = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
    
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
    
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  body('phone')
    .matches(/^(\+254|0)[17]\d{8}$/)
    .withMessage('Please provide a valid Kenyan phone number'),
    
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  handleValidationErrors
];

const validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
    
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
    
  body('phone')
    .optional()
    .matches(/^(\+254|0)[17]\d{8}$/)
    .withMessage('Please provide a valid Kenyan phone number'),
    
  handleValidationErrors
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
    
  handleValidationErrors
];

// Product validation rules
const validateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name cannot exceed 200 characters'),
    
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
    
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
    
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ max: 50 })
    .withMessage('SKU cannot exceed 50 characters'),
    
  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),
    
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Brand is required')
    .isLength({ max: 100 })
    .withMessage('Brand cannot exceed 100 characters'),
    
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
    
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
    
  handleValidationErrors
];

const validateUpdateProduct = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters'),
    
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
    
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
    
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
    
  handleValidationErrors
];

// Category validation rules
const validateCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 100 })
    .withMessage('Category name cannot exceed 100 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
    
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Parent must be a valid category ID'),
    
  handleValidationErrors
];

// Order validation rules
const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
    
  body('items.*.product')
    .isMongoId()
    .withMessage('Valid product ID is required'),
    
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
    
  body('shippingAddress.name')
    .trim()
    .notEmpty()
    .withMessage('Shipping address name is required'),
    
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
    
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
    
  body('shippingAddress.county')
    .trim()
    .notEmpty()
    .withMessage('County is required'),
    
  body('shippingAddress.phone')
    .matches(/^(\+254|0)[17]\d{8}$/)
    .withMessage('Valid phone number is required'),
    
  body('paymentMethod')
    .isIn(['mpesa', 'card', 'bank_transfer', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
    
  handleValidationErrors
];

// Review validation rules
const validateReview = [
  body('product')
    .isMongoId()
    .withMessage('Valid product ID is required'),
    
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
    
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Review title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
    
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
    
  body('pros')
    .optional()
    .isArray()
    .withMessage('Pros must be an array'),
    
  body('cons')
    .optional()
    .isArray()
    .withMessage('Cons must be an array'),
    
  handleValidationErrors
];

// Cart validation rules
const validateAddToCart = [
  body('product')
    .isMongoId()
    .withMessage('Valid product ID is required'),
    
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
    
  body('variant')
    .optional()
    .isObject()
    .withMessage('Variant must be an object'),
    
  handleValidationErrors
];

// Search and filter validation
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
    
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid ID'),
    
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
    
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
    
  query('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
    
  query('sort')
    .optional()
    .isIn(['price', '-price', 'rating', '-rating', 'createdAt', '-createdAt', 'name', '-name'])
    .withMessage('Invalid sort option'),
    
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
    
  handleValidationErrors
];

// Address validation
const validateAddress = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
    
  body('street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
    
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
    
  body('county')
    .trim()
    .notEmpty()
    .withMessage('County is required'),
    
  body('postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),
    
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateProduct,
  validateUpdateProduct,
  validateCategory,
  validateOrder,
  validateReview,
  validateAddToCart,
  validateSearch,
  validateObjectId,
  validateAddress
};