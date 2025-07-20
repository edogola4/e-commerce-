// src/routes/auth.js
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

const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateAddress,
  validateObjectId
} = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
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
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', getMe);
router.put('/profile', validateUpdateProfile, updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.put('/password', validateChangePassword, changePassword);
router.post('/resend-verification', resendEmailVerification);

// Address management routes
router.post('/addresses', validateAddress, addAddress);
router.put('/addresses/:addressId', validateObjectId('addressId'), validateAddress, updateAddress);
router.delete('/addresses/:addressId', validateObjectId('addressId'), deleteAddress);

module.exports = router;