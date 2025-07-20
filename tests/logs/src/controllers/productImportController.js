// src/controllers/productImportController.js
const csv = require('csv-parser');
const fs = require('fs');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// @desc    Bulk import products from CSV
// @route   POST /api/products/import/csv
// @access  Private (Admin/Seller)
const importProductsFromCSV = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a CSV file', 400));
  }

  const products = [];
  const errors = [];
  let lineNumber = 1;

  // Read CSV file
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', async (row) => {
      lineNumber++;
      try {
        // Validate required fields
        if (!row.name || !row.price || !row.category) {
          errors.push(`Line ${lineNumber}: Missing required fields (name, price, category)`);
          return;
        }

        // Find or create category
        let category = await Category.findOne({ name: row.category });
        if (!category) {
          category = await Category.create({
            name: row.category,
            description: `Auto-created category for ${row.category}`
          });
        }

        // Prepare product data
        const productData = {
          name: row.name,
          description: row.description || `${row.name} - No description provided`,
          price: parseFloat(row.price),
          category: category._id,
          brand: row.brand || 'Unknown',
          stock: parseInt(row.stock) || 0,
          sku: row.sku || `AUTO${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
          seller: req.user.id,
          tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : [],
          discount: parseFloat(row.discount) || 0,
          status: 'active'
        };

        // Add optional fields
        if (row.comparePrice) productData.comparePrice = parseFloat(row.comparePrice);
        if (row.weight) productData.weight = { value: parseFloat(row.weight), unit: 'kg' };

        products.push(productData);
      } catch (error) {
        errors.push(`Line ${lineNumber}: ${error.message}`);
      }
    })
    .on('end', async () => {
      try {
        // Insert products in batch
        if (products.length > 0) {
          const insertedProducts = await Product.insertMany(products, { ordered: false });
          
          res.status(201).json({
            success: true,
            message: `Successfully imported ${insertedProducts.length} products`,
            data: {
              imported: insertedProducts.length,
              errors: errors.length,
              errorDetails: errors
            }
          });
        } else {
          res.status(400).json({
            success: false,
            message: 'No valid products to import',
            errors: errors
          });
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error importing products',
          error: error.message
        });
      }
    });
});

// @desc    Import products from external API (e.g., supplier API)
// @route   POST /api/products/import/api
// @access  Private (Admin)
const importFromExternalAPI = asyncHandler(async (req, res, next) => {
  const { apiUrl, apiKey, mapping } = req.body;

  try {
    // Example: Import from supplier API
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const externalProducts = await response.json();
    const importedProducts = [];

    for (const extProduct of externalProducts.data || externalProducts) {
      // Map external product structure to our schema
      const productData = {
        name: extProduct[mapping.name] || extProduct.title,
        description: extProduct[mapping.description] || extProduct.desc,
        price: parseFloat(extProduct[mapping.price] || extProduct.cost),
        brand: extProduct[mapping.brand] || 'Imported',
        stock: parseInt(extProduct[mapping.stock] || extProduct.quantity) || 0,
        sku: extProduct[mapping.sku] || `IMP${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
        seller: req.user.id,
        status: 'active',
        images: extProduct[mapping.images] ? [{ 
          url: extProduct[mapping.images],
          public_id: `imported_${Date.now()}`,
          isMain: true 
        }] : []
      };

      // Find or create category
      const categoryName = extProduct[mapping.category] || 'Imported Products';
      let category = await Category.findOne({ name: categoryName });
      if (!category) {
        category = await Category.create({
          name: categoryName,
          description: `Auto-created for imported products`
        });
      }
      productData.category = category._id;

      const product = await Product.create(productData);
      importedProducts.push(product);
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported ${importedProducts.length} products from external API`,
      data: {
        imported: importedProducts.length,
        products: importedProducts
      }
    });

  } catch (error) {
    return next(new AppError(`Error importing from external API: ${error.message}`, 500));
  }
});

// @desc    Generate CSV template for product import
// @route   GET /api/products/import/template
// @access  Private (Admin/Seller)
const downloadCSVTemplate = asyncHandler(async (req, res, next) => {
  const csvTemplate = `name,description,price,comparePrice,category,brand,stock,sku,tags,discount,weight
iPhone 15 Pro,Latest Apple smartphone with advanced features,150000,180000,Electronics,Apple,50,IPHONE15PRO001,"smartphone,apple,premium",10,0.2
Samsung TV 55",4K Smart TV with HDR support,75000,85000,Electronics,Samsung,25,SAMSUNG55TV001,"tv,smart,4k",15,18.5
Nike Air Max,Comfortable running shoes for athletes,12000,15000,Fashion,Nike,100,NIKEAIRMAX001,"shoes,running,sports",20,0.8`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=product_import_template.csv');
  res.send(csvTemplate);
});

module.exports = {
  importProductsFromCSV,
  importFromExternalAPI,
  downloadCSVTemplate
};