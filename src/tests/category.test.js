const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const categoryRoutes = require('../routes/category');
const Category = require('../models/category');

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
  app = express();
  app.use(express.json());
  app.use('/api/categories', categoryRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Category.deleteMany();
});

describe('Category API', () => {
  it('should create a category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Electronics' });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Electronics');
  });

  it('should not create a category with missing name', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].msg).toBe('Name is required');
  });

  it('should not create duplicate categories', async () => {
    await Category.create({ name: 'Electronics' });
    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Electronics' });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('Category already exists');
  });

  it('should list all categories', async () => {
    await Category.create([{ name: 'Electronics' }, { name: 'Apparel' }]);
    const res = await request(app).get('/api/categories');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('should get a single category by ID', async () => {
    const cat = await Category.create({ name: 'Electronics' });
    const res = await request(app).get(`/api/categories/${cat._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Electronics');
  });

  it('should return 404 for non-existent category', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/categories/${fakeId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Category not found');
  });

  it('should validate category ID', async () => {
    const res = await request(app).get('/api/categories/invalidid');
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].msg).toBe('Invalid category ID');
  });

  it('should update a category', async () => {
    const cat = await Category.create({ name: 'Electronics' });
    const res = await request(app)
      .put(`/api/categories/${cat._id}`)
      .send({ name: 'Gadgets' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Gadgets');
  });

  it('should not update to a duplicate name', async () => {
    await Category.create({ name: 'Electronics' });
    const cat2 = await Category.create({ name: 'Apparel' });
    const res = await request(app)
      .put(`/api/categories/${cat2._id}`)
      .send({ name: 'Electronics' });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('Category name already in use');
  });

  it('should delete a category', async () => {
    const cat = await Category.create({ name: 'Electronics' });
    const res = await request(app).delete(`/api/categories/${cat._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Category deleted successfully');
  });

  it('should return 404 when deleting non-existent category', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/categories/${fakeId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Category not found');
  });
}); 