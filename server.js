const express = require("express");
const dotenv = require("dotenv");
const { shopifyApi, LATEST_API_VERSION } = require("@shopify/shopify-api");
const { restResources } = require("@shopify/shopify-api/rest/admin/2024-04");
const path = require("path");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Setup Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES.split(","),
  hostName: process.env.HOST.replace(/^https?:\/\//, ""),
  isEmbeddedApp: true,
  apiVersion: LATEST_API_VERSION,
  restResources,
  sessionStorage: new (require("@shopify/shopify-api").MemorySessionStorage)(),
});

// Serve static files (like index.html)
app.use(express.static(path.join(__dirname, "views")));

// Home route (iframe)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

// Auth start
app.get("/auth", async (req, res) => {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send("Missing 'shop' query parameter");
  }

  const redirectUrl = await shopify.auth.begin({
    shop,
    callbackPath: "/auth/callback",
    isOnline: true,
    rawRequest: req,
    rawResponse: res,
  });

  return res.redirect(redirectUrl);
});

// Auth callback
app.get("/auth/callback", async (req, res) => {
  try {
    const session = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    console.log("✅ Auth success:", session.shop);

    return res.redirect(`https://${session.shop}/admin/apps`);
  } catch (error) {
    console.error("❌ Auth error:", error);
    return res.status(500).send("Authentication failed");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🎧 Shopify Audio App running on http://localhost:${PORT}`);
});
