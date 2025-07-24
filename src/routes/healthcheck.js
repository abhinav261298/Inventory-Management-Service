const express = require('express');
const router = express.Router();

// Healthcheck endpoint
router.get('/healthcheck', (req, res) => {
  res.json({ status: 'success', message: 'Service is running' });
});

module.exports = router; 