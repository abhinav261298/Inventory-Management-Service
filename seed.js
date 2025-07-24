const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Category = require('./src/models/category');
const Product = require('./src/models/product');
const SKU = require('./src/models/sku');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prod_inventory_management';

const NUM_CATEGORIES = 50;
const NUM_PRODUCTS = 1000;
const NUM_SKUS = 10000;

async function seed() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Clear existing data
  await Category.deleteMany();
  await Product.deleteMany();
  await SKU.deleteMany();

  // 1. Insert categories
  const categoryDocs = [];
  for (let i = 0; i < NUM_CATEGORIES; i++) {
    categoryDocs.push({ name: faker.commerce.department() + ' ' + faker.string.alpha(4) });
  }
  const categories = await Category.insertMany(categoryDocs);

  // 2. Insert products
  const productDocs = [];
  for (let i = 0; i < NUM_PRODUCTS; i++) {
    const cat = categories[Math.floor(i * NUM_CATEGORIES / NUM_PRODUCTS)]; // balanced distribution
    productDocs.push({
      name: faker.commerce.productName() + ' ' + faker.string.alpha(4),
      description: faker.commerce.productDescription(),
      category: cat._id
    });
  }
  const products = await Product.insertMany(productDocs);

  // 3. Insert SKUs
  const skuDocs = [];
  for (let i = 0; i < NUM_SKUS; i++) {
    const prod = products[Math.floor(i * NUM_PRODUCTS / NUM_SKUS)]; // balanced distribution
    skuDocs.push({
      product: prod._id,
      attributes: {
        color: faker.color.human(),
        size: faker.helpers.arrayElement(['S', 'M', 'L', 'XL', 'XXL']),
        storage: faker.helpers.arrayElement(['64GB', '128GB', '256GB', '512GB']),
        custom: faker.commerce.productAdjective()
      },
      price: faker.commerce.price({ min: 10, max: 2000, dec: 0 }),
      stock: faker.number.int({ min: 0, max: 500 }),
      currency: 'USD'
    });
  }
  // Insert SKUs in batches to avoid memory issues
  const BATCH_SIZE = 1000;
  for (let i = 0; i < skuDocs.length; i += BATCH_SIZE) {
    await SKU.insertMany(skuDocs.slice(i, i + BATCH_SIZE));
    console.log(`Inserted SKUs: ${i + BATCH_SIZE} / ${skuDocs.length}`);
  }

  console.log('Database seeded successfully!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
}); 