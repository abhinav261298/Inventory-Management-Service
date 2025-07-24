const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const productRoutes = require('../routes/product');
const categoryRoutes = require('../routes/category');
const Product = require('../models/product');
const Category = require('../models/category');

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
  app = express();
  app.use(express.json());
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Product.deleteMany();
  await Category.deleteMany();
});

describe('Product API', () => {
  let category;
  beforeEach(async () => {
    category = await Category.create({ name: 'Electronics' });
  });

  it('should create a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'iPhone 15', description: 'Latest iPhone', category: category._id });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('iPhone 15');
    expect(res.body.category).toBe(category._id.toString());
  });

  it('should not create a product with missing name', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ category: category._id });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].msg).toBe('Name is required');
  });

  it('should not create a product with invalid category', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'iPhone 15', category: new mongoose.Types.ObjectId() });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Category does not exist');
  });

  it('should not create duplicate products in the same category', async () => {
    await Product.create({ name: 'iPhone 15', category: category._id });
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'iPhone 15', category: category._id });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('Product already exists in this category');
  });

  it('should list products with pagination', async () => {
    await Product.create([
      { name: 'iPhone 15', category: category._id },
      { name: 'iPhone 14', category: category._id }
    ]);
    const res = await request(app).get('/api/products?page=1&pageSize=1');
    expect(res.statusCode).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.total).toBe(2);
  });

  it('should search products by name', async () => {
    await Product.create([
      { name: 'iPhone 15', category: category._id },
      { name: 'Samsung Galaxy', category: category._id }
    ]);
    const res = await request(app).get('/api/products?search=iphone');
    expect(res.statusCode).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].name).toBe('iPhone 15');
  });

  it('should filter products by category name', async () => {
    await Product.create([
      { name: 'iPhone 15', category: category._id },
      { name: 'MacBook Pro', category: category._id }
    ]);
    const cat2 = await Category.create({ name: 'Apparel' });
    await Product.create({ name: 'T-Shirt', category: cat2._id });
    const res = await request(app).get(`/api/products?category=Electronics`);
    expect(res.statusCode).toBe(200);
    expect(res.body.products.length).toBe(2);
    expect(res.body.products[0].name).toBe('iPhone 15');
    expect(res.body.products[1].name).toBe('MacBook Pro');
  });

  it('should search products by name case-insensitively', async () => {
    await Product.create([
      { name: 'iPhone 15', category: category._id },
      { name: 'Samsung Galaxy', category: category._id }
    ]);
    const res = await request(app).get('/api/products?search=IPHONE');
    expect(res.statusCode).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].name).toBe('iPhone 15');
  });

  it('should return empty array for non-existent category name', async () => {
    const res = await request(app).get(`/api/products?category=NonExistentCat`);
    expect(res.statusCode).toBe(200);
    expect(res.body.products.length).toBe(0);
    expect(res.body.total).toBe(0);
  });

  it('should paginate products filtered by category name', async () => {
    await Product.create([
      { name: 'iPhone 15', category: category._id },
      { name: 'MacBook Pro', category: category._id },
      { name: 'iPad', category: category._id }
    ]);
    const res = await request(app).get(`/api/products?category=Electronics&page=2&pageSize=2`);
    expect(res.statusCode).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.total).toBe(3);
  });

  it('should get a single product by ID', async () => {
    const prod = await Product.create({ name: 'iPhone 15', category: category._id });
    const res = await request(app).get(`/api/products/${prod._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('iPhone 15');
  });

  it('should return 404 for non-existent product', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/products/${fakeId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Product not found');
  });

  it('should validate product ID', async () => {
    const res = await request(app).get('/api/products/invalidid');
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].msg).toBe('Invalid product ID');
  });

  it('should update a product', async () => {
    const prod = await Product.create({ name: 'iPhone 15', category: category._id });
    const res = await request(app)
      .put(`/api/products/${prod._id}`)
      .send({ name: 'iPhone 16' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('iPhone 16');
  });

  it('should not update to a duplicate name in the same category', async () => {
    await Product.create({ name: 'iPhone 15', category: category._id });
    const prod2 = await Product.create({ name: 'iPhone 14', category: category._id });
    const res = await request(app)
      .put(`/api/products/${prod2._id}`)
      .send({ name: 'iPhone 15', category: category._id });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('Product already exists in this category');
  });

  it('should delete a product', async () => {
    const prod = await Product.create({ name: 'iPhone 15', category: category._id });
    const res = await request(app).delete(`/api/products/${prod._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Product deleted successfully');
  });

  it('should return 404 when deleting non-existent product', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/products/${fakeId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Product not found');
  });
}); 