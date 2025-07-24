const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const SKU = require('../models/sku');
const Product = require('../models/product');

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
 *   name: SKUs
 *   description: SKU management
 */
/**
 * @route POST /api/skus
 * @desc Add a new SKU for a product
 * @access Admin
 */
/**
 * @swagger
 * /skus:
 *   post:
 *     summary: Add a new SKU for a product
 *     tags: [SKUs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - attributes
 *               - price
 *               - stock
 *             properties:
 *               product:
 *                 type: string
 *               attributes:
 *                 type: object
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               currency:
 *                 type: string
 *                 default: USD
 *     responses:
 *       201:
 *         description: SKU created
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  body('product').isMongoId().withMessage('Valid product ID is required'),
  body('attributes').isObject().withMessage('Attributes must be an object'),
  body('price').isNumeric().withMessage('Price is required and must be a number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('currency').optional().isString().isIn(['USD']).withMessage('Currency must be USD'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { product, attributes, price, stock, currency = 'USD' } = req.body;
      // Ensure product exists
      const prod = await Product.findById(product);
      if (!prod) return res.status(400).json({ error: 'Product does not exist' });
      const sku = new SKU({ product, attributes, price, stock, currency });
      await sku.save();
      res.status(201).json(sku);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /skus/product/{productId}:
 *   get:
 *     summary: Get all SKUs for a product
 *     tags: [SKUs]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of SKUs
 *       400:
 *         description: Invalid product ID
 */
/**
 * @route GET /api/skus/product/:productId
 * @desc Get all SKUs for a product
 * @access Admin
 */
router.get(
  '/product/:productId',
  param('productId').isMongoId().withMessage('Invalid product ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const skus = await SKU.find({ product: req.params.productId }).lean(); // Use lean for performance
      res.json(skus);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /skus/{id}:
 *   put:
 *     summary: Update a SKU by ID
 *     tags: [SKUs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: SKU ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attributes:
 *                 type: object
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               currency:
 *                 type: string
 *                 default: USD
 *     responses:
 *       200:
 *         description: SKU updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: SKU not found
 */
/**
 * @route PUT /api/skus/:id
 * @desc Update a SKU by ID
 * @access Admin
 */
router.put(
  '/:id',
  param('id').isMongoId().withMessage('Invalid SKU ID'),
  body('attributes').optional().isObject().withMessage('Attributes must be an object'),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('currency').optional().isString().isIn(['USD']).withMessage('Currency must be USD'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { attributes, price, stock, currency } = req.body;
      const update = { };
      if (attributes !== undefined) update.attributes = attributes;
      if (price !== undefined) update.price = price;
      if (stock !== undefined) update.stock = stock;
      if (currency !== undefined) update.currency = currency;
      const sku = await SKU.findByIdAndUpdate(
        req.params.id,
        { $set: update },
        { new: true, runValidators: true }
      );
      if (!sku) return res.status(404).json({ error: 'SKU not found' });
      res.json(sku);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /skus/{id}:
 *   delete:
 *     summary: Delete a SKU by ID
 *     tags: [SKUs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: SKU ID
 *     responses:
 *       200:
 *         description: SKU deleted
 *       400:
 *         description: Invalid SKU ID
 *       404:
 *         description: SKU not found
 */
/**
 * @route DELETE /api/skus/:id
 * @desc Delete a SKU by ID
 * @access Admin
 */
router.delete(
  '/:id',
  param('id').isMongoId().withMessage('Invalid SKU ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const sku = await SKU.findByIdAndDelete(req.params.id);
      if (!sku) return res.status(404).json({ error: 'SKU not found' });
      res.json({ message: 'SKU deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router; 