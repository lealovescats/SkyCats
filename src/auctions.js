const { PARTS } = require("./drillparts");

const CACHE_TTL_MS = 5 * 60 * 1000;

// Coflnet (sky.coflnet.com) is a well-established, widely-used community
// Skyblock economy API (also powers the SkyHanni mod). Its lowest-BIN
// endpoint is a single request instead of scanning every active-auction
// page ourselves. Its item tags aren't a predictable transform of Hypixel's
// display names (e.g. "Tungsten Regulator" -> "TUNGSTEN_KEYCHAIN"), so each
// was individually verified against /api/item/search before being hardcoded
// here.
const COFLNET_BASE = "https://sky.coflnet.com/api";
const COFLNET_TAGS = {
  MITHRIL_ENGINE: "MITHRIL_DRILL_ENGINE",
  TITANIUM_ENGINE: "TITANIUM_DRILL_ENGINE",
  RUBY_ENGINE: "RUBY_POLISHED_DRILL_ENGINE",
  SAPPHIRE_ENGINE: "SAPPHIRE_POLISHED_DRILL_ENGINE",
  AMBER_ENGINE: "AMBER_POLISHED_DRILL_ENGINE",
  MITHRIL_TANK: "MITHRIL_FUEL_TANK",
  TITANIUM_TANK: "TITANIUM_FUEL_TANK",
  GEMSTONE_TANK: "GEMSTONE_FUEL_TANK",
  PERFECT_TANK: "PERFECTLY_CUT_FUEL_TANK",
  GOBLIN_OMELETTE: "GOBLIN_OMELETTE",
  BLUE_CHEESE_OMELETTE: "GOBLIN_OMELETTE_BLUE_CHEESE",
  PESTO_OMELETTE: "GOBLIN_OMELETTE_PESTO",
  SPICY_OMELETTE: "GOBLIN_OMELETTE_SPICY",
  SUNNY_OMELETTE: "GOBLIN_OMELETTE_SUNNY_SIDE",
  TUNGSTEN_REGULATOR: "TUNGSTEN_KEYCHAIN",
  STARFALL_SEASONING: "STARFALL_SEASONING",
};

const cache = new Map(); // partKey -> { price, fetchedAt }
const inFlight = new Map(); // partKey -> Promise

async function fetchFromCoflnet(partKey) {
  const tag = COFLNET_TAGS[partKey];
  if (!tag) throw new Error(`No Coflnet tag mapped for ${partKey}`);

  const res = await fetch(`${COFLNET_BASE}/item/price/${tag}/bin`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Coflnet API request failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return typeof json.lowest === "number" && json.lowest > 0 ? json.lowest : null;
}

// --- Fallback: scan Hypixel's own active-auction pages directly. Only used
// if Coflnet is unreachable. There's no server-side item filter, so this
// scans all pages once and finds every tracked part's price in one pass. ---
const AUCTIONS_URL = "https://api.hypixel.net/v2/skyblock/auctions";
const TARGET_LABELS = new Set(Object.values(PARTS).map((p) => p.label));
let fallbackCache = { data: null, fetchedAt: 0 };
let fallbackInFlight = null;

async function fetchAuctionPage(page, headers) {
  const res = await fetch(`${AUCTIONS_URL}?page=${page}`, { headers });
  if (!res.ok) {
    throw new Error(`Hypixel API request failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(`Hypixel API returned an error: ${json.cause ?? "unknown"}`);
  }
  return json;
}

function scanForLowestBins(auctions, lowest) {
  for (const a of auctions) {
    if (!a.bin || a.claimed) continue;
    if (!TARGET_LABELS.has(a.item_name)) continue;
    const current = lowest.get(a.item_name);
    if (current === undefined || a.starting_bid < current) {
      lowest.set(a.item_name, a.starting_bid);
    }
  }
}

async function fetchLowestBinsFromHypixel() {
  const headers = {};
  if (process.env.HYPIXEL_API_KEY) {
    headers["API-Key"] = process.env.HYPIXEL_API_KEY;
  }

  const lowest = new Map();
  const first = await fetchAuctionPage(0, headers);
  scanForLowestBins(first.auctions, lowest);

  const pageFetches = [];
  for (let page = 1; page < first.totalPages; page++) {
    pageFetches.push(fetchAuctionPage(page, headers).then((json) => scanForLowestBins(json.auctions, lowest)));
  }
  await Promise.all(pageFetches);

  return lowest;
}

async function getLowestBinFallback(partKey) {
  const now = Date.now();
  if (!fallbackCache.data || now - fallbackCache.fetchedAt >= CACHE_TTL_MS) {
    if (!fallbackInFlight) {
      fallbackInFlight = fetchLowestBinsFromHypixel()
        .then((data) => {
          fallbackCache = { data, fetchedAt: Date.now() };
          return data;
        })
        .finally(() => {
          fallbackInFlight = null;
        });
    }
    await fallbackInFlight;
  }

  const label = PARTS[partKey].label;
  return fallbackCache.data.has(label) ? fallbackCache.data.get(label) : null;
}

/**
 * Returns the lowest active BIN price for a drill part, or null if none
 * exists. Tries Coflnet first (fast, single request); if that fails for any
 * reason, falls back to scanning Hypixel's own auction pages directly.
 */
async function getLowestBin(partKey) {
  const now = Date.now();
  const cached = cache.get(partKey);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.price;
  }

  if (inFlight.has(partKey)) {
    return inFlight.get(partKey);
  }

  const promise = (async () => {
    let price;
    try {
      price = await fetchFromCoflnet(partKey);
    } catch (err) {
      console.error(`Coflnet lookup failed for ${partKey}, falling back to Hypixel auction scan:`, err.message);
      price = await getLowestBinFallback(partKey);
    }
    cache.set(partKey, { price, fetchedAt: Date.now() });
    return price;
  })().finally(() => {
    inFlight.delete(partKey);
  });

  inFlight.set(partKey, promise);
  return promise;
}

module.exports = { getLowestBin };
