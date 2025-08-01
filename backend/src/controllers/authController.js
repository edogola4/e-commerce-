// src/controllers/authController.js
const crypto = require('crypto');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { uploadToCloudinary } = require('../config/cloudinary');
const { loginAttemptTracker } = require('../utils/loginAttempts');

// Generate JWT token and send response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.generateAuthToken();
  
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      data: {
        user
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

  // Get reCAPTCHA verification result if provided
  const recaptchaResult = req.recaptcha || {};

  // Log registration attempt
  console.log('Registration attempt:', {
    email,
    ip: clientIP,
    hasCaptcha: !!req.body.captchaToken,
    captchaVerified: recaptchaResult.verified || false,
    timestamp: new Date().toISOString()
  });

  // If captcha was provided but failed verification
  if (req.body.captchaToken && !recaptchaResult.verified) {
    return next(new AppError('Security verification failed. Please try again.', 400));
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });
  
  if (existingUser) {
    if (existingUser.email === email) {
      return next(new AppError('User with this email already exists', 400));
    }
    if (existingUser.phone === phone) {
      return next(new AppError('User with this phone number already exists', 400));
    }
  }
  
  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone
  });
  
  // Generate email verification token (implement if needed)
  // const verificationToken = user.generateEmailVerificationToken();
  // await user.save({ validateBeforeSave: false });
  
  // Send verification email (implement email service)
  // await sendVerificationEmail(user.email, verificationToken);

  // Log successful registration
  console.log('Successful registration:', {
    userId: user._id,
    email: user.email,
    ip: clientIP,
    usedCaptcha: !!req.body.captchaToken,
    captchaScore: recaptchaResult.score,
    timestamp: new Date().toISOString()
  });
  
  sendTokenResponse(user, 201, res, 'User registered successfully');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password, rememberMe } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

  // Get attempt information from rate limiting middleware
  const { count: attemptCount, requiresCaptcha, maxAttempts } = req.loginAttempts || {};
  
  // Get reCAPTCHA verification result from middleware
  const recaptchaResult = req.recaptcha || {};

  // Log login attempt for security monitoring
  console.log('Login attempt:', {
    email,
    ip: clientIP,
    attempts: attemptCount || 0,
    requiresCaptcha: requiresCaptcha || false,
    hasCaptcha: !!req.body.captchaToken,
    captchaVerified: recaptchaResult.verified || false,
    timestamp: new Date().toISOString()
  });

  // Check if reCAPTCHA is required but failed verification
  if (requiresCaptcha && req.body.captchaToken && !recaptchaResult.verified) {
    // Record failed attempt
    loginAttemptTracker.recordFailedAttempt(email, clientIP);

    return res.status(400).json({
      success: false,
      message: 'Security verification failed. Please try again.',
      requiresCaptcha: true,
      captchaError: recaptchaResult.error || 'reCAPTCHA verification failed',
      attemptsRemaining: Math.max(0, maxAttempts - (attemptCount + 1))
    });
  }

  // Check if reCAPTCHA is required but not provided
  if (requiresCaptcha && !req.body.captchaToken) {
    return res.status(400).json({
      success: false,
      message: 'Security verification required due to multiple failed attempts.',
      requiresCaptcha: true,
      failedAttempts: attemptCount,
      attemptsRemaining: Math.max(0, maxAttempts - attemptCount)
    });
  }
  
  // Find user and include password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    // Record failed attempt
    const attemptData = loginAttemptTracker.recordFailedAttempt(email, clientIP);
    
    // Log failed attempt
    console.log('Failed login attempt:', {
      email,
      ip: clientIP,
      totalAttempts: attemptData.count,
      willRequireCaptcha: attemptData.count >= 3,
      lockedUntil: attemptData.lockedUntil ? new Date(attemptData.lockedUntil).toISOString() : null,
      timestamp: new Date().toISOString()
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      requiresCaptcha: attemptData.count >= 3,
      attemptsRemaining: Math.max(0, (maxAttempts || 5) - attemptData.count),
      ...(attemptData.lockedUntil && {
        locked: true,
        timeUntilUnlock: attemptData.lockedUntil - Date.now()
      })
    });
  }
  
  // Check if account is locked
  if (user.isLocked) {
    return next(new AppError('Account is temporarily locked due to too many failed login attempts', 423));
  }
  
  // Check password
  const isPasswordCorrect = await user.comparePassword(password);
  
  if (!isPasswordCorrect) {
    // Increment login attempts on user model
    await user.incLoginAttempts();
    
    // Record failed attempt for IP/email tracking
    const attemptData = loginAttemptTracker.recordFailedAttempt(email, clientIP);
    
    // Log failed attempt
    console.log('Failed login attempt:', {
      email,
      ip: clientIP,
      totalAttempts: attemptData.count,
      willRequireCaptcha: attemptData.count >= 3,
      lockedUntil: attemptData.lockedUntil ? new Date(attemptData.lockedUntil).toISOString() : null,
      timestamp: new Date().toISOString()
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      requiresCaptcha: attemptData.count >= 3,
      attemptsRemaining: Math.max(0, (maxAttempts || 5) - attemptData.count),
      ...(attemptData.lockedUntil && {
        locked: true,
        timeUntilUnlock: attemptData.lockedUntil - Date.now()
      })
    });
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts && user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Clear failed attempts on successful login
  loginAttemptTracker.clearAttempts(email, clientIP);
  
  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Log successful login
  console.log('Successful login:', {
    userId: user._id,
    email: user.email,
    ip: clientIP,
    rememberMe: !!rememberMe,
    hadPreviousAttempts: attemptCount > 0,
    usedCaptcha: !!req.body.captchaToken,
    captchaScore: recaptchaResult.score,
    timestamp: new Date().toISOString()
  });
  
  // Generate token with remember me support
  const token = rememberMe ? user.generateAuthToken('30d') : user.generateAuthToken();
  
  const options = {
    expires: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  // Remove password from output
  user.password = undefined;
  
  res.status(200)
    .cookie('token', token, options)
    .json({
      success: true,
      message: 'Login successful',
      token,
      expiresIn: rememberMe ? '30d' : '24h',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar,
          lastLogin: user.lastLogin
        }
      }
    });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('cart.product', 'name price images stock')
    .populate('wishlist', 'name price images discount');
  
  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone
  };
  
  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

// @desc    Upload user avatar
// @route   POST /api/auth/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }
  
  try {
    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.path, 'avatars');
    
    // Update user avatar
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        avatar: {
          public_id: result.public_id,
          url: result.url
        }
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: user.avatar
      }
    });
  } catch (error) {
    return next(new AppError('Error uploading avatar', 500));
  }
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await User.findById(req.user.id).select('+password');
  
  // Check current password
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  
  if (!isCurrentPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 400));
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

  // Get reCAPTCHA verification result if provided
  const recaptchaResult = req.recaptcha || {};

  // If captcha was provided but failed verification
  if (req.body.captchaToken && !recaptchaResult.verified) {
    return next(new AppError('Security verification failed. Please try again.', 400));
  }
  
  const user = await User.findOne({ email });
  
  if (!user) {
    return next(new AppError('No user found with this email', 404));
  }
  
  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash and set reset token
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expiry (10 minutes)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  await user.save({ validateBeforeSave: false });
  
  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

  // Log password reset request
  console.log('Password reset requested:', {
    userId: user._id,
    email: user.email,
    ip: clientIP,
    usedCaptcha: !!req.body.captchaToken,
    timestamp: new Date().toISOString()
  });
  
  try {
    // Send email (implement email service)
    // await sendPasswordResetEmail(user.email, resetUrl);
    
    res.status(200).json({
      success: true,
      message: 'Password reset token sent to email',
      resetToken // Remove in production
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new AppError('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  
  const user = await User.findOne({
    passwordResetToken: resetPasswordToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    return next(new AppError('Invalid or expired token', 400));
  }
  
  // Set new password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  
  await user.save();
  
  sendTokenResponse(user, 200, res, 'Password reset successful');
});

// @desc    Add address
// @route   POST /api/auth/addresses
// @access  Private
const addAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  // If this is the first address, make it default
  if (user.addresses.length === 0) {
    req.body.isDefault = true;
  }
  
  // If setting as default, remove default from other addresses
  if (req.body.isDefault) {
    user.addresses.forEach(address => {
      address.isDefault = false;
    });
  }
  
  user.addresses.push(req.body);
  await user.save();
  
  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: {
      addresses: user.addresses
    }
  });
});

// @desc    Update address
// @route   PUT /api/auth/addresses/:addressId
// @access  Private
const updateAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);
  
  if (!address) {
    return next(new AppError('Address not found', 404));
  }
  
  // If setting as default, remove default from other addresses
  if (req.body.isDefault) {
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }
  
  // Update address fields
  Object.keys(req.body).forEach(key => {
    address[key] = req.body[key];
  });
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Address updated successfully',
    data: {
      addresses: user.addresses
    }
  });
});

// @desc    Delete address
// @route   DELETE /api/auth/addresses/:addressId
// @access  Private
const deleteAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);
  
  if (!address) {
    return next(new AppError('Address not found', 404));
  }
  
  const wasDefault = address.isDefault;
  address.remove();
  
  // If deleted address was default and there are other addresses, make the first one default
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
    data: {
      addresses: user.addresses
    }
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    return next(new AppError('Invalid or expired verification token', 400));
  }
  
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  
  await user.save({ validateBeforeSave: false });
  
  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Private
const resendEmailVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (user.isEmailVerified) {
    return next(new AppError('Email is already verified', 400));
  }
  
  // Generate verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  user.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  await user.save({ validateBeforeSave: false });
  
  // Send verification email (implement email service)
  // await sendVerificationEmail(user.email, verificationToken);
  
  res.status(200).json({
    success: true,
    message: 'Verification email sent successfully'
  });
});

module.exports = {
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
};