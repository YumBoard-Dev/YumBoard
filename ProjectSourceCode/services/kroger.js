// services/kroger.js
const axios = require('axios');

// token cache
let productToken = null;
let productTokenExpires = 0;

// get token
async function getProductToken() {
  if (productToken && Date.now() < productTokenExpires) {
    return productToken;
  }

  // console.log('[KROGER] fetching OAuth token (product.compact)');
  const creds = Buffer.from(
    `${process.env.KROGER_CLIENT_ID}:${process.env.KROGER_CLIENT_SECRET}`
  ).toString('base64');

  const resp = await axios.post(
    'https://api.kroger.com/v1/connect/oauth2/token',
    'grant_type=client_credentials&scope=product.compact',
    {
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }
  );

  productToken = resp.data.access_token;
  productTokenExpires = Date.now() + (resp.data.expires_in * 1000) - 60000;
  return productToken;
}

// 2) priceFor(term) searches for product id then finds details then gets price
async function priceFor(term) {
  // console.log(`[KROGER] priceFor("${term}")`);
  const token = await getProductToken();
  const locationId = process.env.KROGER_LOCATION_ID;
  if (!locationId) {
    console.warn('[KROGER] no KROGER_LOCATION_ID set in .env');
    return 0;
  }

  // product id
  const search = await axios.get(
    'https://api.kroger.com/v1/products',
    {
      params: {
        'filter.term': term,
        'filter.limit': 1
      },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    }
  );
  const prod = search.data.data?.[0];
  if (!prod || !prod.productId) {
    console.warn('[KROGER] no product match for', term);
    return 0;
  }
  // console.log('[KROGER] Found productId for', term, ':', prod.productId);

  // get details
  const details = await axios.get(
    `https://api.kroger.com/v1/products/${prod.productId}`,
    {
      params: { 'filter.locationId': locationId },
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    }
  );
  const info = details.data.data;
  // look if it has details on price or national price
  let priceObj = info.price || info.nationalPrice;
  // fallback into items[].price if those exist
  if (!priceObj && Array.isArray(info.items) && info.items.length) {
    priceObj = info.items[0].price;
  }
  if (!priceObj) {
    console.warn('[KROGER] no price object for', term);
    return 0;
  }

  // pick regular over current, fallback to current
  const p = typeof priceObj.regular === 'number'
          ? priceObj.regular
          : priceObj.current;
  // console.log(`[KROGER] priceFor("${term}") →`, p);
  return typeof p === 'number' ? p : 0;
}

module.exports = { priceFor };
