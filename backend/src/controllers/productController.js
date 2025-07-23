// src/controllers/productController.js
const Product = require('../models/Product');
const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');

// Create AppError class if it doesn't exist
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 12,
    sort = '-createdAt',
    category,
    brand,
    minPrice,
    maxPrice,
    rating,
    search,
    featured,
    onSale,
    isActive = true,
    inStock
  } = req.query;

  // Build filter object
  const filter = {};
  
  // Base filters
  if (isActive !== undefined) {
    filter.status = isActive === 'true' ? 'active' : { $ne: 'active' };
  } else {
    filter.status = 'active'; // Default to active products
  }
  
  if (featured === 'true') filter.isFeatured = true;
  if (category) filter.category = category;
  if (brand) filter.brand = new RegExp(brand, 'i');
  
  // Price range filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  
  // Rating filter
  if (rating) {
    filter['ratings.average'] = { $gte: Number(rating) };
  }
  
  // Stock filter
  if (inStock === 'true') {
    filter.stock = { $gt: 0 };
  }
  
  // Search filter
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  
  // Handle onSale filter - products with discount > 0
  if (onSale === 'true') {
    filter.discount = { $gt: 0 };
  }

  // Validate and sanitize sort parameter
  const allowedSortFields = [
    'createdAt', '-createdAt',
    'price', '-price',
    'name', '-name',
    'ratings.average', '-ratings.average',
    'discount', '-discount',
    'analytics.purchases', '-analytics.purchases',
    'stock', '-stock'
  ];
  
  const sortParam = allowedSortFields.includes(sort) ? sort : '-createdAt';

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  try {
    // Execute query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortParam)
        .skip(skip)
        .limit(limitNum)
        .populate('category', 'name slug')
        .populate('seller', 'firstName lastName')
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Transform products to match frontend expectations
    const transformedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      originalPrice: product.comparePrice || product.price,
      discount: product.discount || 0,
      finalPrice: product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price,
      image: product.images && product.images.length > 0 
        ? product.images.find(img => img.isMain)?.url || product.images[0].url 
        : '/placeholder-product.jpg',
      images: product.images || [],
      category: product.category,
      brand: product.brand,
      stock: product.stock,
      rating: product.ratings?.average || 0,
      numReviews: product.ratings?.count || 0,
      isActive: product.status === 'active',
      featured: product.isFeatured,
      onSale: product.discount > 0,
      tags: product.tags,
      sku: product.sku,
      seller: product.seller,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    // Response
    res.status(200).json({
      success: true,
      data: transformedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      },
      filters: filter,
      count: transformedProducts.length
    });

  } catch (error) {
    console.error('Products query error:', error);
    return next(new AppError('Failed to fetch products', 500));
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('seller', 'firstName lastName email')
    .populate('reviews', 'rating comment user createdAt')
    .populate('relatedProducts', 'name price images ratings');

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Increment view count if method exists
  if (typeof product.incrementViews === 'function') {
    await product.incrementViews();
  }

  // Transform product to match frontend expectations
  const transformedProduct = {
    _id: product._id,
    name: product.name,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price,
    originalPrice: product.comparePrice || product.price,
    discount: product.discount || 0,
    finalPrice: product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price,
    image: product.images && product.images.length > 0 
      ? product.images.find(img => img.isMain)?.url || product.images[0].url 
      : '/placeholder-product.jpg',
    images: product.images || [],
    category: product.category,
    brand: product.brand,
    stock: product.stock,
    rating: product.ratings?.average || 0,
    numReviews: product.ratings?.count || 0,
    isActive: product.status === 'active',
    featured: product.isFeatured,
    onSale: product.discount > 0,
    tags: product.tags,
    sku: product.sku,
    seller: product.seller,
    specifications: product.specifications,
    features: product.features,
    variants: product.variants,
    reviews: product.reviews,
    relatedProducts: product.relatedProducts,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };

  res.status(200).json({
    success: true,
    data: transformedProduct
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Seller/Admin)
const createProduct = catchAsync(async (req, res, next) => {
  // Add seller ID to the product data
  req.body.seller = req.user.id;
  
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Seller/Admin)
const updateProduct = catchAsync(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check if user is the seller or admin
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to update this product', 403));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Seller/Admin)
const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check if user is the seller or admin
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete this product', 403));
  }

  await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = catchAsync(async (req, res, next) => {
  const { limit = 8 } = req.query;

  const products = await Product.find({
    isFeatured: true,
    status: 'active'
  })
    .sort('-createdAt')
    .limit(parseInt(limit))
    .populate('category', 'name')
    .lean();

  // Transform products
  const transformedProducts = products.map(product => ({
    _id: product._id,
    name: product.name,
    price: product.price,
    originalPrice: product.comparePrice || product.price,
    discount: product.discount || 0,
    image: product.images && product.images.length > 0 
      ? product.images.find(img => img.isMain)?.url || product.images[0].url 
      : '/placeholder-product.jpg',
    rating: product.ratings?.average || 0,
    onSale: product.discount > 0,
    featured: product.isFeatured
  }));

  res.status(200).json({
    success: true,
    data: transformedProducts,
    count: transformedProducts.length
  });
});

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
const getProductCategories = catchAsync(async (req, res, next) => {
  // Try to find Category model, if it doesn't exist, return empty array
  try {
    const categories = await Category.find({ isActive: true })
      .sort('name')
      .lean();

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    // If Category model doesn't exist, return empty array
    res.status(200).json({
      success: true,
      data: []
    });
  }
});

// @desc    Get product brands
// @route   GET /api/products/brands
// @access  Public
const getProductBrands = catchAsync(async (req, res, next) => {
  const brands = await Product.distinct('brand', { status: 'active' });

  res.status(200).json({
    success: true,
    data: brands.sort()
  });
});

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private (Seller/Admin)
const uploadProductImages = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check authorization
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to update this product', 403));
  }

  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload at least one image', 400));
  }

  // Process uploaded images
  const newImages = req.files.map(file => ({
    public_id: file.filename,
    url: `/uploads/products/${file.filename}`,
    alt: product.name,
    isMain: product.images.length === 0 // First image is main
  }));

  product.images.push(...newImages);
  await product.save();

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private (Seller/Admin)
const deleteProductImage = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check authorization
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to update this product', 403));
  }

  const imageIndex = product.images.findIndex(
    img => img._id.toString() === req.params.imageId
  );

  if (imageIndex === -1) {
    return next(new AppError('Image not found', 404));
  }

  product.images.splice(imageIndex, 1);
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully'
  });
});

// @desc    Add to wishlist
// @route   POST /api/products/:id/wishlist
// @access  Private
const addToWishlist = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Add wishlist logic here
  res.status(200).json({
    success: true,
    message: 'Product added to wishlist'
  });
});

// @desc    Remove from wishlist
// @route   DELETE /api/products/:id/wishlist
// @access  Private
const removeFromWishlist = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Remove wishlist logic here
  res.status(200).json({
    success: true,
    message: 'Product removed from wishlist'
  });
});

// @desc    Get product variants
// @route   GET /api/products/:id/variants
// @access  Public
const getProductVariants = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).select('variants');

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    success: true,
    data: product.variants
  });
});

// @desc    Update stock
// @route   PATCH /api/products/:id/stock
// @access  Private (Seller/Admin)
const updateStock = catchAsync(async (req, res, next) => {
  const { quantity, operation = 'set' } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check authorization
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
    data: product
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