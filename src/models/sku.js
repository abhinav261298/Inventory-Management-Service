// SKU model placeholder
const mongoose = require('mongoose');

const skuSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  attributes: {
    type: Map,
    of: String,
    default: {}
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD']
  }
}, { timestamps: true });

skuSchema.index({ product: 1 });

module.exports = mongoose.model('SKU', skuSchema); 