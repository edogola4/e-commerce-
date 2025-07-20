// src/utils/seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');

// Load models
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Sample categories
const categories = [
  {
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    isActive: true,
    isFeatured: true,
    sortOrder: 1
  },
  {
    name: 'Clothing',
    description: 'Fashion and apparel',
    isActive: true,
    isFeatured: true,
    sortOrder: 2
  },
  {
    name: 'Books',
    description: 'Books and educational materials',
    isActive: true,
    isFeatured: false,
    sortOrder: 3
  },
  {
    name: 'Home & Garden',
    description: 'Home improvement and gardening',
    isActive: true,
    isFeatured: true,
    sortOrder: 4
  },
  {
    name: 'Sports',
    description: 'Sports equipment and gear',
    isActive: true,
    isFeatured: false,
    sortOrder: 5
  }
];

// Create sample users
const createUsers = async () => {
  const users = [];
  
  // Create admin user
  users.push({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@ecommerce.com',
    password: 'Password123',
    phone: '+254700000001',
    role: 'admin',
    isEmailVerified: true,
    isActive: true
  });
  
  // Create seller user
  users.push({
    firstName: 'Seller',
    lastName: 'User',
    email: 'seller@ecommerce.com',
    password: 'Password123',
    phone: '+254700000002',
    role: 'seller',
    isEmailVerified: true,
    isActive: true
  });
  
  // Create regular users
  for (let i = 0; i < 10; i++) {
    users.push({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: 'Password123',
      phone: `+25470${faker.string.numeric(7)}`,
      role: 'user',
      isEmailVerified: true,
      isActive: true,
      addresses: [{
        name: faker.person.fullName(),
        street: faker.location.streetAddress(),
        city: faker.helpers.arrayElement(['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret']),
        county: faker.helpers.arrayElement(['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu']),
        postalCode: faker.location.zipCode(),
        isDefault: true
      }]
    });
  }
  
  return await User.create(users);
};

// Create sample products
const createProducts = async (categories, users) => {
  const products = [];
  const sellers = users.filter(user => ['seller', 'admin'].includes(user.role));
  
  const productNames = {
    'Electronics': [
      'iPhone 15 Pro', 'Samsung Galaxy S24', 'MacBook Air M2', 'Dell XPS 13',
      'Sony WH-1000XM5', 'iPad Pro', 'Apple Watch Series 9', 'AirPods Pro'
    ],
    'Clothing': [
      'Cotton T-Shirt', 'Denim Jeans', 'Leather Jacket', 'Summer Dress',
      'Running Shoes', 'Casual Sneakers', 'Formal Shirt', 'Wool Sweater'
    ],
    'Books': [
      'JavaScript: The Good Parts', 'Clean Code', 'Design Patterns',
      'The Pragmatic Programmer', 'You Don\'t Know JS', 'Eloquent JavaScript'
    ],
    'Home & Garden': [
      'Garden Tools Set', 'Kitchen Blender', 'Coffee Maker', 'Dining Table',
      'Office Chair', 'Floor Lamp', 'Picture Frame', 'Storage Box'
    ],
    'Sports': [
      'Football', 'Basketball', 'Tennis Racket', 'Yoga Mat',
      'Dumbbells', 'Running Shorts', 'Sports Water Bottle', 'Gym Bag'
    ]
  };
  
  for (const category of categories) {
    const categoryProducts = productNames[category.name] || [];
    
    for (let i = 0; i < categoryProducts.length; i++) {
      const seller = faker.helpers.arrayElement(sellers);
      const price = faker.number.int({ min: 500, max: 100000 });
      const discount = faker.helpers.maybe(() => faker.number.int({ min: 5, max: 50 }), 0.3) || 0;
      
      products.push({
        name: categoryProducts[i],
        description: faker.lorem.paragraphs(2),
        shortDescription: faker.lorem.sentence(),
        price: price,
        comparePrice: discount > 0 ? price + (price * 0.2) : undefined,
        discount: discount,
        sku: `SKU${faker.string.alphanumeric(8).toUpperCase()}`,
        category: category._id,
        brand: faker.company.name(),
        tags: faker.helpers.arrayElements([
          'popular', 'new', 'bestseller', 'featured', 'sale', 'premium'
        ], faker.number.int({ min: 1, max: 3 })),
        images: [{
          public_id: faker.string.alphanumeric(20),
          url: `https://picsum.photos/800/600?random=${faker.number.int({ min: 1, max: 1000 })}`,
          alt: categoryProducts[i],
          isMain: true
        }],
        stock: faker.number.int({ min: 0, max: 100 }),
        seller: seller._id,
        ratings: {
          average: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
          count: faker.number.int({ min: 0, max: 100 })
        },
        isActive: true,
        isFeatured: faker.helpers.maybe(() => true, 0.2) || false,
        status: 'active',
        analytics: {
          views: faker.number.int({ min: 0, max: 1000 }),
          purchases: faker.number.int({ min: 0, max: 50 }),
          wishlistCount: faker.number.int({ min: 0, max: 20 })
        },
        specifications: [
          {
            name: 'Weight',
            value: `${faker.number.float({ min: 0.1, max: 5, fractionDigits: 1 })} kg`
          },
          {
            name: 'Color',
            value: faker.color.human()
          }
        ]
      });
    }
  }
  
  return await Product.create(products);
};

// Import data
const importData = async () => {
  try {
    await connectDB();
    
    console.log('Clearing existing data...');
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    console.log('✅ Existing data cleared');
    
    console.log('Creating categories...');
    const createdCategories = await Category.create(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);
    
    console.log('Creating users...');
    const createdUsers = await createUsers();
    console.log(`✅ Created ${createdUsers.length} users`);
    
    console.log('Creating products...');
    const createdProducts = await createProducts(createdCategories, createdUsers);
    console.log(`✅ Created ${createdProducts.length} products`);
    
    console.log('✅ Data imported successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('Admin: admin@ecommerce.com / Password123');
    console.log('Seller: seller@ecommerce.com / Password123');
    console.log('\n🌐 Test the API:');
    console.log('Health: http://localhost:5000/health');
    console.log('API Docs: http://localhost:5000/api');
    console.log('Products: http://localhost:5000/api/products');
    console.log('Categories: http://localhost:5000/api/categories');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await connectDB();
    
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    
    console.log('✅ Data destroyed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error destroying data:', error);
    process.exit(1);
  }
};

// Check command line arguments
if (process.argv[2] === '-d') {
  deleteData();
} else {
  importData();
}