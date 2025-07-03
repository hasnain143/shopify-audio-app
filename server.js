const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { shopifyApiAdapter } = require('@shopify/shopify-api/adapters/node'); // ✅ This only

const app = express();
const PORT = process.env.PORT || 3000;

// Shopify API Setup
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES.split(','),
  hostName: process.env.HOST.replace(/^https?:\/\//, ''),
  isEmbeddedApp: true,
  apiVersion: LATEST_API_VERSION,
  // ✅ Add this:
  adapter: shopifyApiAdapter,
});


app.get('/auth', async (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send('Missing shop parameter');

  const authRoute = await shopify.auth.begin({
    shop,
    callbackPath: '/auth/callback',
    isOnline: true,
    rawRequest: req,
    rawResponse: res,
  });

  return res.redirect(authRoute);
});

app.get('/auth/callback', async (req, res) => {
  try {
    const session = await shopify.auth.validateCallback(req, res, req.query);
    console.log('✅ Auth successful:', session.shop);

    // Redirect to embedded admin view
    return res.redirect(`https://${session.shop}/admin/apps`);
  } catch (error) {
    console.error('❌ Auth error:', error);
    return res.status(500).send('Authentication failed');
  }
});

app.use(express.static('views'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.listen(PORT, () => {
  console.log(`🚀 App running at http://localhost:${PORT}`);
});
