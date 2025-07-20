// src/controllers/productController.js
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res, next) => {
  let query = { status: 'active' };
  
  // Build query based on parameters
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    rating,
    search,
    featured,
    seller,
    inStock
  } = req.query;
  
  // Category filter
  if (category) {
    query.category = category;
  }
  
  // Brand filter
  if (brand) {
    const brands = Array.isArray(brand) ? brand : [brand];
    query.brand = { $in: brands };
  }
  
  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }
  
  // Rating filter
  if (rating) {
    query['ratings.average'] = { $gte: parseFloat(rating) };
  }
  
  // Featured filter
  if (featured === 'true') {
    query.isFeatured = true;
  }
  
  // Seller filter
  if (seller) {
    query.seller = seller;
  }
  
  // In stock filter
  if (inStock === 'true') {
    query.stock = { $gt: 0 };
  }
  
  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const startIndex = (page - 1) * limit;
  
  // Sorting
  let sort = {};
  if (req.query.sort) {
    const sortBy = req.query.sort;
    if (sortBy === 'price') sort = { price: 1 };
    else if (sortBy === '-price') sort = { price: -1 };
    else if (sortBy === 'rating') sort = { 'ratings.average': 1 };
    else if (sortBy === '-rating') sort = { 'ratings.average': -1 };
    else if (sortBy === 'name') sort = { name: 1 };
    else if (sortBy === '-name') sort = { name: -1 };
    else if (sortBy === 'newest') sort = { createdAt: -1 };
    else if (sortBy === 'oldest') sort = { createdAt: 1 };
  } else {
    sort = { createdAt: -1 }; // Default sort by newest
  }
  
  // Execute query
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .populate('seller', 'firstName lastName')
    .sort(sort)
    .skip(startIndex)
    .limit(limit)
    .lean();
  
  // Get total count for pagination
  const total = await Product.countDocuments(query);
  
  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  res.status(200).json({
    success: true,
    count: products.length,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev
    },
    data: {
      products
    }
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('seller', 'firstName lastName avatar')
    .populate({
      path: 'reviews',
      populate: {
        path: 'user',
        select: 'firstName lastName avatar'
      }
    });
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Increment view count
  await product.incrementViews();
  
  // Get related products
  const relatedProducts = await Product.findRelated(
    product._id,
    product.category,
    product.brand,
    4
  );
  
  res.status(200).json({
    success: true,
    data: {
      product,
      relatedProducts
    }
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Seller/Admin)
const createProduct = asyncHandler(async (req, res, next) => {
  // Add seller to req.body
  req.body.seller = req.user.id;
  
  // Generate SKU if not provided
  if (!req.body.sku) {
    const count = await Product.countDocuments();
    req.body.sku = `PRD${Date.now()}${(count + 1).toString().padStart(4, '0')}`;
  }
  
  const product = await Product.create(req.body);
  
  // Populate the response
  await product.populate('category', 'name slug');
  await product.populate('seller', 'firstName lastName');
  
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: {
      product
    }
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Owner/Admin)
const updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Check ownership
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to update this product', 403));
  }
  
  product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('category', 'name slug')
   .populate('seller', 'firstName lastName');
  
  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: {
      product
    }
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Owner/Admin)
const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Check ownership
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete this product', 403));
  }
  
  // Delete images from Cloudinary
  if (product.images && product.images.length > 0) {
    for (const image of product.images) {
      await deleteFromCloudinary(image.public_id);
    }
  }
  
  await product.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private (Owner/Admin)
const uploadProductImages = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Check ownership
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to update this product', 403));
  }
  
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload at least one image', 400));
  }
  
  const uploadedImages = [];
  
  try {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path, 'products');
      uploadedImages.push({
        public_id: result.public_id,
        url: result.url,
        alt: req.body.alt || product.name
      });
    }
    
    // Add images to product
    product.images.push(...uploadedImages);
    
    // Set first image as main if no main image exists
    if (!product.images.some(img => img.isMain)) {
      product.images[0].isMain = true;
    }
    
    await product.save();
    
    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        images: uploadedImages
      }
    });
  } catch (error) {
    return next(new AppError('Error uploading images', 500));
  }
});

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private (Owner/Admin)
const deleteProductImage = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Check ownership
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to update this product', 403));
  }
  
  const image = product.images.id(req.params.imageId);
  
  if (!image) {
    return next(new AppError('Image not found', 404));
  }
  
  // Delete from Cloudinary
  await deleteFromCloudinary(image.public_id);
  
  // Remove from product
  image.remove();
  
  // If deleted image was main and there are other images, make the first one main
  if (image.isMain && product.images.length > 0) {
    product.images[0].isMain = true;
  }
  
  await product.save();
  
  res.status(200).json({
    success: true,
    message: 'Image deleted successfully'
  });
});

// @desc    Add product to wishlist
// @route   POST /api/products/:id/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  const user = await User.findById(req.user.id);
  
  // Check if already in wishlist
  if (user.wishlist.includes(req.params.id)) {
    return next(new AppError('Product already in wishlist', 400));
  }
  
  user.wishlist.push(req.params.id);
  await user.save();
  
  // Update product wishlist count
  product.analytics.wishlistCount += 1;
  await product.save();
  
  res.status(200).json({
    success: true,
    message: 'Product added to wishlist'
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/products/:id/wishlist
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  // Check if in wishlist
  if (!user.wishlist.includes(req.params.id)) {
    return next(new AppError('Product not in wishlist', 400));
  }
  
  user.wishlist.pull(req.params.id);
  await user.save();
  
  // Update product wishlist count
  const product = await Product.findById(req.params.id);
  if (product) {
    product.analytics.wishlistCount = Math.max(0, product.analytics.wishlistCount - 1);
    await product.save();
  }
  
  res.status(200).json({
    success: true,
    message: 'Product removed from wishlist'
  });
});

// @desc    Get product variants
// @route   GET /api/products/:id/variants
// @access  Public
const getProductVariants = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).select('variants');
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: {
      variants: product.variants
    }
  });
});

// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private (Owner/Admin)
const updateStock = asyncHandler(async (req, res, next) => {
  const { quantity, operation = 'set' } = req.body;
  
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Check ownership
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to update this product', 403));
  }
  
  if (operation === 'set') {
    product.stock = quantity;
  } else if (operation === 'add') {
    product.stock += quantity;
  } else if (operation === 'subtract') {
    product.stock = Math.max(0, product.stock - quantity);
  }
  
  // Update status based on stock
  if (product.stock === 0) {
    product.status = 'out_of_stock';
  } else if (product.status === 'out_of_stock') {
    product.status = 'active';
  }
  
  await product.save();
  
  res.status(200).json({
    success: true,
    message: 'Stock updated successfully',
    data: {
      stock: product.stock,
      status: product.status
    }
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 8;
  
  const products = await Product.find({
    isFeatured: true,
    status: 'active'
  })
    .populate('category', 'name slug')
    .populate('seller', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  
  res.status(200).json({
    success: true,
    count: products.length,
    data: {
      products
    }
  });
});

// @desc    Get product categories with product counts
// @route   GET /api/products/categories
// @access  Public
const getProductCategories = asyncHandler(async (req, res, next) => {
  const categories = await Product.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $project: {
        _id: '$category._id',
        name: '$category.name',
        slug: '$category.slug',
        count: 1
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      categories
    }
  });
});

// @desc    Get product brands with product counts
// @route   GET /api/products/brands
// @access  Public
const getProductBrands = asyncHandler(async (req, res, next) => {
  const brands = await Product.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$brand',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        name: '$_id',
        count: 1,
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      brands
    }
  });
});

module.exports = {
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
};