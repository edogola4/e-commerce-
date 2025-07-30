// src/routes/auth.js (Updated with reCAPTCHA integration)
const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  uploadAvatar,
  changePassword,
  forgotPassword,
  resetPassword,
  addAddress,
  updateAddress,
  deleteAddress,
  verifyEmail,
  resendEmailVerification
} = require('../controllers/authController');

const { protect, requireEmailVerification } = require('../middleware/auth');
const { validateRecaptcha, optionalRecaptcha } = require('../middleware/recaptcha');
const { rateLimitLogin } = require('../middleware/rateLimiting');

const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateAddress,
  validateObjectId
} = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads (existing code)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
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
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Public routes
router.post('/register', validateRegister, optionalRecaptcha, register);

// Enhanced login route with rate limiting and smart reCAPTCHA
router.post('/login', 
  validateLogin,           // Your existing validation
  rateLimitLogin,          // Rate limiting and attempt tracking
  optionalRecaptcha,       // reCAPTCHA verification (smart - only when needed)
  login                    // Your existing login controller
);

router.post('/logout', logout);
router.post('/forgot-password', optionalRecaptcha, forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes (existing)
router.use(protect);

router.get('/me', getMe);
router.put('/profile', validateUpdateProfile, updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.put('/password', validateChangePassword, changePassword);
router.post('/resend-verification', resendEmailVerification);

// Address management routes (existing)
router.post('/addresses', validateAddress, addAddress);
router.put('/addresses/:addressId', validateObjectId('addressId'), validateAddress, updateAddress);
router.delete('/addresses/:addressId', validateObjectId('addressId'), deleteAddress);

module.exports = router;