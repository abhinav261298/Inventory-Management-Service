const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const Category = require('../models/category');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */
// Centralized error handler middleware
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Category already exists
 */
router.post(
  '/',
  body('name')
    .custom((value) => typeof value === 'string' && value.trim() !== '')
    .withMessage('Name is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name } = req.body;
      // Check for duplicate
      const exists = await Category.findOne({ name });
      if (exists) return res.status(409).json({ error: 'Category already exists' });
      const category = new Category({ name });
      await category.save();
      res.status(201).json(category);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: List all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a single category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category found
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Category not found
 */
router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid category ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) return res.status(404).json({ error: 'Category not found' });
      res.json(category);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category name already in use
 */
router.put(
  '/:id',
  param('id').isMongoId().withMessage('Invalid category ID'),
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name } = req.body;
      // Check for duplicate name
      const exists = await Category.findOne({ name, _id: { $ne: req.params.id } });
      if (exists) return res.status(409).json({ error: 'Category name already in use' });
      const category = await Category.findByIdAndUpdate(
        req.params.id,
        { name },
        { new: true, runValidators: true }
      );
      if (!category) return res.status(404).json({ error: 'Category not found' });
      res.json(category);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Category not found
 */
router.delete(
  '/:id',
  param('id').isMongoId().withMessage('Invalid category ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const category = await Category.findByIdAndDelete(req.params.id);
      if (!category) return res.status(404).json({ error: 'Category not found' });
      res.json({ message: 'Category deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router; 