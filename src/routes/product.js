const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const Product = require('../models/product');
const Category = require('../models/category');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */
/**
 * @route POST /api/products
 * @desc Create a new product
 * @access Admin
 */
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Product already exists in this category
 */
router.post(
  '/',
  body('name')
    .custom((value) => typeof value === 'string' && value.trim() !== '')
    .withMessage('Name is required'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, description, category } = req.body;
      // Ensure category exists
      const cat = await Category.findById(category);
      if (!cat) return res.status(400).json({ error: 'Category does not exist' });
      // Check for duplicate product name in the same category
      const exists = await Product.findOne({ name, category });
      if (exists) return res.status(409).json({ error: 'Product already exists in this category' });
      const product = new Product({ name, description, category });
      await product.save();
      res.status(201).json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List products with search, filter, and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive search by product name
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Case-insensitive filter by category name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Page size
 *     responses:
 *       200:
 *         description: List of products
 */
/**
 * @route GET /api/products
 * @desc List products with search, filter, and pagination
 * @access Admin
 */
router.get(
  '/',
  [
    query('search').optional().isString(),
    query('category').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { search, category, page = 1, pageSize = 10 } = req.query;
      const filter = {};
      if (search) filter.name = { $regex: search, $options: 'i' };
      if (category) {
        // Find category by name (case-insensitive)
        const cat = await Category.findOne({ name: { $regex: `^${category}$`, $options: 'i' } });
        if (!cat) return res.json({ products: [], total: 0 });
        filter.category = cat._id;
      }
      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const products = await Product.find(filter)
        .skip(skip)
        .limit(parseInt(pageSize))
        .populate('category')
        .lean(); // Use lean for performance
      const total = await Product.countDocuments(filter);
      res.json({ products, total });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product found
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Product not found
 */
/**
 * @route GET /api/products/:id
 * @desc Get a single product by ID
 * @access Admin
 */
router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid product ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id).populate('category').lean();
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 *       409:
 *         description: Product already exists in this category
 */
/**
 * @route PUT /api/products/:id
 * @desc Update a product by ID
 * @access Admin
 */
router.put(
  '/:id',
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('name').optional().isString().trim().notEmpty().withMessage('Name is required'),
  body('description').optional().isString(),
  body('category').optional().isMongoId().withMessage('Valid category ID is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, description, category } = req.body;
      if (category) {
        const cat = await Category.findById(category);
        if (!cat) return res.status(400).json({ error: 'Category does not exist' });
      }
      // Prevent duplicate product name in the same category
      if (name && category) {
        const exists = await Product.findOne({ name, category, _id: { $ne: req.params.id } });
        if (exists) return res.status(409).json({ error: 'Product already exists in this category' });
      }
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: { name, description, category } },
        { new: true, runValidators: true }
      ).populate('category');
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Product not found
 */
/**
 * @route DELETE /api/products/:id
 * @desc Delete a product by ID
 * @access Admin
 */
router.delete(
  '/:id',
  param('id').isMongoId().withMessage('Invalid product ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json({ message: 'Product deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router; 