const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Route imports
const categoryRoutes = require('./routes/category');
const productRoutes = require('./routes/product');
const skuRoutes = require('./routes/sku');
const healthcheckRoutes = require('./routes/healthcheck');

// Use routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/skus', skuRoutes);
app.use('/api', healthcheckRoutes);

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'E-commerce Inventory Management Service API',
    version: '1.0.0',
    description: 'API documentation for the Inventory Management Service',
  },
  servers: [
    { url: 'http://localhost:3000/api', description: 'Local server' }
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Basic route
app.get('/', (req, res) => {
  res.send('E-commerce Inventory Management Service is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 