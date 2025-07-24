const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const skuRoutes = require('../routes/sku');
const productRoutes = require('../routes/product');
const categoryRoutes = require('../routes/category');
const SKU = require('../models/sku');
const Product = require('../models/product');
const Category = require('../models/category');

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
  app = express();
  app.use(express.json());
  app.use('/api/skus', skuRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await SKU.deleteMany();
  await Product.deleteMany();
  await Category.deleteMany();
});

describe('SKU API', () => {
  let category, product;
  beforeEach(async () => {
    category = await Category.create({ name: 'Electronics' });
    product = await Product.create({ name: 'iPhone 15', category: category._id });
  });

  it('should add a new SKU for a product', async () => {
    const res = await request(app)
      .post('/api/skus')
      .send({
        product: product._id,
        attributes: { color: 'black', storage: '128GB' },
        price: 999,
        stock: 10
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.product).toBe(product._id.toString());
    expect(res.body.price).toBe(999);
    expect(res.body.stock).toBe(10);
    expect(res.body.currency).toBe('USD');
  });

  it('should not add a SKU with invalid currency', async () => {
    const res = await request(app)
      .post('/api/skus')
      .send({
        product: product._id,
        attributes: { color: 'black' },
        price: 999,
        stock: 10,
        currency: 'INR'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].msg).toBe('Currency must be USD');
  });

  it('should not add a SKU with invalid product', async () => {
    const res = await request(app)
      .post('/api/skus')
      .send({
        product: new mongoose.Types.ObjectId(),
        attributes: { color: 'black' },
        price: 999,
        stock: 10
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Product does not exist');
  });

  it('should get all SKUs for a product', async () => {
    await SKU.create({ product: product._id, attributes: { color: 'black' }, price: 999, stock: 10 });
    await SKU.create({ product: product._id, attributes: { color: 'white' }, price: 1099, stock: 5 });
    const res = await request(app).get(`/api/skus/product/${product._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('should update a SKU and set currency', async () => {
    const sku = await SKU.create({ product: product._id, attributes: { color: 'black' }, price: 999, stock: 10 });
    const res = await request(app)
      .put(`/api/skus/${sku._id}`)
      .send({ price: 1099, stock: 8, currency: 'USD' });
    expect(res.statusCode).toBe(200);
    expect(res.body.price).toBe(1099);
    expect(res.body.stock).toBe(8);
    expect(res.body.currency).toBe('USD');
  });

  it('should delete a SKU', async () => {
    const sku = await SKU.create({ product: product._id, attributes: { color: 'black' }, price: 999, stock: 10 });
    const res = await request(app).delete(`/api/skus/${sku._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('SKU deleted successfully');
  });

  it('should return 404 when deleting non-existent SKU', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/skus/${fakeId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('SKU not found');
  });

  it('should validate SKU ID', async () => {
    const res = await request(app).put('/api/skus/invalidid').send({ price: 100 });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].msg).toBe('Invalid SKU ID');
  });
}); 