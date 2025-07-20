// src/routes/reviews.js
const express = require('express');
const Review = require('../models/Review');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { protect, authorize, checkUserPermissions } = require('../middleware/auth');
const { validateReview, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  const query = {
    product: req.params.productId,
    status: 'approved'
  };
  
  // Filter by rating
  if (req.query.rating) {
    query.rating = parseInt(req.query.rating);
  }
  
  // Sort options
  let sort = { createdAt: -1 }; // Default: newest first
  if (req.query.sort === 'helpful') {
    sort = { 'helpful.count': -1 };
  } else if (req.query.sort === 'rating_high') {
    sort = { rating: -1 };
  } else if (req.query.sort === 'rating_low') {
    sort = { rating: 1 };
  }
  
  const reviews = await Review.find(query)
    .populate('user', 'firstName lastName avatar')
    .populate('replies.user', 'firstName lastName avatar')
    .sort(sort)
    .skip(startIndex)
    .limit(limit);
  
  const total = await Review.countDocuments(query);
  
  // Get review statistics
  const stats = await Review.getReviewStats(req.params.productId);
  
  res.status(200).json({
    success: true,
    count: reviews.length,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    stats,
    data: {
      reviews
    }
  });
});

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;
  
  const review = await Review.create(req.body);
  
  await review.populate('user', 'firstName lastName avatar');
  
  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: {
      review
    }
  });
});

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
const getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'firstName lastName avatar')
    .populate('product', 'name images')
    .populate('replies.user', 'firstName lastName avatar');
  
  if (!review) {
    return next(new AppError('Review not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: {
      review
    }
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Owner)
const updateReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new AppError('Review not found', 404));
  }
  
  // Check ownership
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to update this review', 403));
  }
  
  await review.updateReview(req.body);
  
  await review.populate('user', 'firstName lastName avatar');
  
  res.status(200).json({
    success: true,
    message: 'Review updated successfully',
    data: {
      review
    }
  });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Owner/Admin)
const deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new AppError('Review not found', 404));
  }
  
  // Check ownership
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete this review', 403));
  }
  
  await review.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
const markHelpful = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new AppError('Review not found', 404));
  }
  
  await review.markHelpful(req.user.id);
  
  res.status(200).json({
    success: true,
    message: 'Review marked as helpful',
    data: {
      helpful: review.helpful
    }
  });
});

// @desc    Mark review as unhelpful
// @route   POST /api/reviews/:id/unhelpful
// @access  Private
const markUnhelpful = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new AppError('Review not found', 404));
  }
  
  await review.markUnhelpful(req.user.id);
  
  res.status(200).json({
    success: true,
    message: 'Review marked as unhelpful',
    data: {
      unhelpful: review.unhelpful
    }
  });
});

// @desc    Add reply to review
// @route   POST /api/reviews/:id/replies
// @access  Private
const addReply = asyncHandler(async (req, res, next) => {
  const { message } = req.body;
  
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new AppError('Review not found', 404));
  }
  
  // Check if user is seller of the product
  const Product = require('../models/Product');
  const product = await Product.findById(review.product);
  const isSellerReply = product.seller.toString() === req.user.id;
  
  await review.addReply(req.user.id, message, isSellerReply);
  
  await review.populate('replies.user', 'firstName lastName avatar');
  
  res.status(201).json({
    success: true,
    message: 'Reply added successfully',
    data: {
      replies: review.replies
    }
  });
});

// @desc    Report review
// @route   POST /api/reviews/:id/report
// @access  Private
const reportReview = asyncHandler(async (req, res, next) => {
  const { reason, description } = req.body;
  
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new AppError('Review not found', 404));
  }
  
  try {
    await review.reportReview(req.user.id, reason, description);
    
    res.status(200).json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// @desc    Get user's reviews
// @route   GET /api/reviews/user
// @access  Private
const getUserReviews = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  const reviews = await Review.find({ user: req.user.id })
    .populate('product', 'name images')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);
  
  const total = await Review.countDocuments({ user: req.user.id });
  
  res.status(200).json({
    success: true,
    count: reviews.length,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: {
      reviews
    }
  });
});

// @desc    Approve review (Admin)
// @route   PATCH /api/reviews/:id/approve
// @access  Private (Admin)
const approveReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { status: 'approved' },
    { new: true }
  );
  
  if (!review) {
    return next(new AppError('Review not found', 404));
  }
  
  res.status(200).json({
    success: true,
    message: 'Review approved successfully',
    data: {
      review
    }
  });
});

// @desc    Reject review (Admin)
// @route   PATCH /api/reviews/:id/reject
// @access  Private (Admin)
const rejectReview = asyncHandler(async (req, res, next) => {
  const { moderationNotes } = req.body;
  
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { 
      status: 'rejected',
      moderationNotes 
    },
    { new: true }
  );
  
  if (!review) {
    return next(new AppError('Review not found', 404));
  }
  
  res.status(200).json({
    success: true,
    message: 'Review rejected successfully',
    data: {
      review
    }
  });
});

// Public routes
router.get('/product/:productId', validateObjectId('productId'), getProductReviews);
router.get('/:id', validateObjectId(), getReview);

// Protected routes
router.use(protect);

router.post('/', checkUserPermissions('review'), validateReview, createReview);
router.get('/user/my-reviews', getUserReviews);
router.put('/:id', validateObjectId(), updateReview);
router.delete('/:id', validateObjectId(), deleteReview);
router.post('/:id/helpful', validateObjectId(), markHelpful);
router.post('/:id/unhelpful', validateObjectId(), markUnhelpful);
router.post('/:id/replies', validateObjectId(), addReply);
router.post('/:id/report', validateObjectId(), reportReview);

// Admin routes
router.patch('/:id/approve', validateObjectId(), authorize('admin'), approveReview);
router.patch('/:id/reject', validateObjectId(), authorize('admin'), rejectReview);

module.exports = router;