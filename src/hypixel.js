const BAZAAR_URL = "https://api.hypixel.net/v2/skyblock/bazaar";
const CACHE_TTL_MS = 30_000; // Bazaar prices update roughly every ~20-60s server-side, no need to hammer the API.

let cache = { data: null, fetchedAt: 0 };
// While a fetch is in flight, concurrent callers await this instead of each
// starting their own request (avoids a cache-stampede when many commands
// come in right as the cache expires).
let inFlightRequest = null;

async function fetchBazaarProducts() {
  const headers = {};
  if (process.env.HYPIXEL_API_KEY) {
    headers["API-Key"] = process.env.HYPIXEL_API_KEY;
  }

  const res = await fetch(BAZAAR_URL, { headers });
  if (!res.ok) {
    throw new Error(`Hypixel API request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(`Hypixel API returned an error: ${json.cause ?? "unknown"}`);
  }

  const products = new Map();
  for (const [id, product] of Object.entries(json.products)) {
    products.set(id, product.quick_status);
  }
  return products;
}

/**
 * Fetches (and caches) the full Bazaar product list.
 * Returns a Map<productId, quick_status>.
 */
async function getBazaarProducts() {
  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = fetchBazaarProducts()
    .then((products) => {
      cache = { data: products, fetchedAt: Date.now() };
      return products;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
}

/**
 * Bazaar order-book pricing convention:
 *  - "buy order" (what you pay to patiently buy something) fills near the
 *    current top buy order, which is the same price instant-sellers receive
 *    -> quick_status.sellPrice
 *  - "sell offer" (what you receive for patiently selling something) fills
 *    near the current lowest sell offer, which is the same price
 *    instant-buyers pay -> quick_status.buyPrice
 */
function buyOrderCost(products, itemId) {
  const p = products.get(itemId);
  if (!p) throw new Error(`Unknown bazaar product: ${itemId}`);
  return p.sellPrice;
}

function sellOfferRevenue(products, itemId) {
  const p = products.get(itemId);
  if (!p) throw new Error(`Unknown bazaar product: ${itemId}`);
  return p.buyPrice;
}

/**
 * Instant-sell revenue: what you get for immediately selling into the
 * current top buy orders, no waiting. Same field as buyOrderCost
 * (quick_status.sellPrice) but named separately since the two represent
 * different actions (instantly selling vs. patiently buy-ordering).
 */
function instantSellRevenue(products, itemId) {
  const p = products.get(itemId);
  if (!p) throw new Error(`Unknown bazaar product: ${itemId}`);
  return p.sellPrice;
}

/**
 * Instant-buy cost: what you pay to immediately buy, consuming the current
 * lowest sell offers, no waiting. Same field as sellOfferRevenue
 * (quick_status.buyPrice) but named separately since the two represent
 * different actions (instantly buying vs. patiently selling).
 */
function instantBuyCost(products, itemId) {
  const p = products.get(itemId);
  if (!p) throw new Error(`Unknown bazaar product: ${itemId}`);
  return p.buyPrice;
}

module.exports = {
  getBazaarProducts,
  buyOrderCost,
  sellOfferRevenue,
  instantSellRevenue,
  instantBuyCost,
};
