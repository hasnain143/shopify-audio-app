require("dotenv").config();
const express = require("express");
const { shopifyApi, LATEST_API_VERSION } = require("@shopify/shopify-api");
const { shopifyApi, LATEST_API_VERSION, memorySessionStorage } = require("@shopify/shopify-api");

const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (like index.html)
app.use(express.static(path.join(__dirname, "views")));

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES.split(","),
  hostName: process.env.HOST.replace(/^https?:\/\//, ""),
  isEmbeddedApp: true,
  apiVersion: LATEST_API_VERSION,
  sessionStorage: memorySessionStorage(),
});

// Step 1: Start OAuth
app.get("/auth", async (req, res) => {
  const redirectUrl = await shopify.auth.begin({
    shop: req.query.shop,
    callbackPath: "/auth/callback",
    isOnline: false,
    rawRequest: req,
    rawResponse: res,
  });
  return res.redirect(redirectUrl);
});

// Step 2: OAuth Callback
app.get("/auth/callback", async (req, res) => {
  try {
    await shopify.auth.validateCallback({
      rawRequest: req,
      rawResponse: res,
    });
    return res.redirect("/");
  } catch (e) {
    console.error("Auth error", e);
    return res.status(500).send("Authentication failed");
  }
});

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
