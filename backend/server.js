// server.js - Production-Ready Version for Small-Medium Scale
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const connectDB = require('./src/config/database');
const { globalErrorHandler, notFound } = require('./src/middleware/errorHandler');

// Load env vars
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'NODE_ENV'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Configure Winston Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Connect to database
connectDB();

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression middleware
app.use(compression());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// CORS Configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced logging middleware
const requestLogger = morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(requestLogger);
} else {
  app.use(morgan('dev'));
}

// Enhanced Rate limiting with different limits for different endpoints
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => 
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, endpoint: ${req.originalUrl}`);
      res.status(429).json({
        success: false,
        message
      });
    }
  });

// Specific rate limits for sensitive endpoints
app.use('/api/auth/login', createRateLimit(15 * 60 * 1000, 5, 'Too many login attempts', true));
app.use('/api/auth/register', createRateLimit(60 * 60 * 1000, 3, 'Too many registration attempts'));
app.use('/api/auth/forgot-password', createRateLimit(60 * 60 * 1000, 3, 'Too many password reset attempts'));

// General API rate limiting
app.use('/api/', createRateLimit(15 * 60 * 1000, 100, 'Too many requests'));

// Health check endpoint with detailed info
app.get('/health', (req, res) => {
  const healthcheck = {
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
    database: 'connected' // You can enhance this with actual DB health check
  };
  
  res.status(200).json(healthcheck);
});

// API Routes with error handling
const routes = [
    { path: '/api/auth', module: './src/routes/auth', name: 'Auth' },
    { path: '/api/products', module: './src/routes/products', name: 'Products' },
    { path: '/api/categories', module: './src/routes/categories', name: 'Categories' },
    { path: '/api/users', module: './src/routes/users', name: 'Users' },
    { path: '/api/orders', module: './src/routes/orders', name: 'Orders' },
    { path: '/api/reviews', module: './src/routes/reviews', name: 'Reviews' },
    { path: '/api/recommendations', module: './src/routes/recommendations', name: 'Recommendations' },
    { path: '/api/checkout', module: './src/routes/checkout', name: 'Checkout' },
    { path: '/api/inventory', module: './src/routes/inventory', name: 'Inventory' },
    { path: '/api/email', module: './src/routes/email', name: 'Email' },
    { path: '/api/tracking', module: './src/routes/tracking', name: 'Tracking' },
    { path: '/api/payments', module: './src/routes/payments', name: 'Payments' }

  ];
  
  // Load routes (this should only appear ONCE in your server.js)
  routes.forEach(route => {
    try {
      app.use(route.path, require(route.module));
      logger.info(`✅ ${route.name} routes loaded successfully`);
    } catch (error) {
      logger.error(`❌ Failed to load ${route.name} routes:`, error.message);
      process.exit(1);
    }
  });

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'E-Commerce API',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      users: '/api/users',
      orders: '/api/orders',
      reviews: '/api/reviews',
      recommendations: '/api/recommendations',
      checkout: '/api/checkout'
    },
    documentation: process.env.API_DOCS_URL || 'Coming soon'
  });
});

// Handle undefined routes
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connection
    require('mongoose').connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Handle different termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', err);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;