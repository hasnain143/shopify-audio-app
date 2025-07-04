require('dotenv').config();
const express = require('express');
const path = require('path');

// CORRECT IMPORTS FOR SHOPIFY API v11.13.0
//const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { MemorySessionStorage } = require('@shopify/shopify-api/session-storage/memory');
//const { shopifyApi, LATEST_API_VERSION, memorySessionStorage } = require("@shopify/shopify-api");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

// Shopify Configuration
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES.split(','),
  hostName: process.env.HOST.replace(/^https?:\/\//, ''),
  isEmbeddedApp: true,
  apiVersion: LATEST_API_VERSION,
  sessionStorage: new MemorySessionStorage(),
});

// Routes
app.get('/auth', async (req, res) => {
  try {
    const redirectUrl = await shopify.auth.begin({
      shop: req.query.shop,
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Auth initiation error:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/auth/callback', async (req, res) => {
  try {
    await shopify.auth.validateCallback({
      rawRequest: req,
      rawResponse: res,
    });
    res.redirect('/');
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).send('Authentication validation failed');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Shopify API version:', LATEST_API_VERSION);
});