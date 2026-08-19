const { PARTS } = require("./drillparts");

const AUCTIONS_URL = "https://api.hypixel.net/v2/skyblock/auctions";
// Finding the lowest BIN for an item means scanning every active-auction page
// (currently ~51 pages, no server-side item filter exists), unlike the
// Bazaar's single-request snapshot. That's expensive enough that this is
// cached far longer than Bazaar data, and only ever fetched lazily when a
// /drillparts run without a `start` actually needs it.
const CACHE_TTL_MS = 5 * 60 * 1000;

const TARGET_LABELS = new Set(Object.values(PARTS).map((p) => p.label));

let cache = { data: null, fetchedAt: 0 };
let inFlightRequest = null;

async function fetchPage(page, headers) {
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

async function fetchLowestBins() {
  const headers = {};
  if (process.env.HYPIXEL_API_KEY) {
    headers["API-Key"] = process.env.HYPIXEL_API_KEY;
  }

  const lowest = new Map();
  const first = await fetchPage(0, headers);
  scanForLowestBins(first.auctions, lowest);

  const pageFetches = [];
  for (let page = 1; page < first.totalPages; page++) {
    pageFetches.push(fetchPage(page, headers).then((json) => scanForLowestBins(json.auctions, lowest)));
  }
  await Promise.all(pageFetches);

  return lowest;
}

/**
 * Returns a Map<itemLabel, lowestActiveBinPrice> covering every drill part
 * label, cached for 5 minutes. Missing entries mean no active BIN listing
 * was found for that item.
 */
async function getLowestBins() {
  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = fetchLowestBins()
    .then((data) => {
      cache = { data, fetchedAt: Date.now() };
      return data;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
}

module.exports = { getLowestBins };
