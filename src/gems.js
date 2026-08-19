const { ITEMS, FINE_PER_FLAWLESS } = require("./config");
const { sellOfferRevenue, instantSellRevenue } = require("./hypixel");

const GEMS = {
  AMBER: {
    label: "Amber",
    fineItem: ITEMS.FINE_AMBER_GEM,
    flawlessItem: ITEMS.FLAWLESS_AMBER_GEM,
    fineIcon: "fine_amber_gem",
    flawlessIcon: "flawless_amber_gem",
  },
  JADE: {
    label: "Jade",
    fineItem: ITEMS.FINE_JADE_GEM,
    flawlessItem: ITEMS.FLAWLESS_JADE_GEM,
    fineIcon: "fine_jade_gem",
    flawlessIcon: "flawless_jade_gem",
  },
  SAPPHIRE: {
    label: "Sapphire",
    fineItem: ITEMS.FINE_SAPPHIRE_GEM,
    flawlessItem: ITEMS.FLAWLESS_SAPPHIRE_GEM,
    fineIcon: "fine_sapphire_gem",
    flawlessIcon: "flawless_sapphire_gem",
  },
  AMETHYST: {
    label: "Amethyst",
    fineItem: ITEMS.FINE_AMETHYST_GEM,
    flawlessItem: ITEMS.FLAWLESS_AMETHYST_GEM,
    fineIcon: "fine_amethyst_gem",
    flawlessIcon: "flawless_amethyst_gem",
  },
};

/**
 * For one gem type, compares:
 *  - selling Fine gems instantly (instant-sell price, per Fine gem)
 *  - combining 80 Fine into 1 Flawless and selling that via a sell offer
 *    (sell offer price ÷ 80, expressed per Fine-gem-equivalent)
 * so the two are directly comparable per unit of raw Fine gem.
 */
function calcGem(products, gemKey) {
  const gem = GEMS[gemKey];

  const fineRate = instantSellRevenue(products, gem.fineItem);
  const flawlessPrice = sellOfferRevenue(products, gem.flawlessItem);
  const flawlessRate = flawlessPrice / FINE_PER_FLAWLESS;

  const best = flawlessRate > fineRate ? "FLAWLESS" : "FINE";

  return {
    key: gemKey,
    label: gem.label,
    fineRate,
    flawlessPrice,
    flawlessRate,
    fineIcon: gem.fineIcon,
    flawlessIcon: gem.flawlessIcon,
    best,
    bestRate: best === "FLAWLESS" ? flawlessRate : fineRate,
    bestIcon: best === "FLAWLESS" ? gem.flawlessIcon : gem.fineIcon,
  };
}

/**
 * Ranks all 4 gem types by each one's OWN best option (Fine vs Flawless),
 * highest to lowest - not by a blended/middle value.
 */
function getGemRankings(products) {
  const rows = Object.keys(GEMS).map((key) => calcGem(products, key));
  rows.sort((a, b) => b.bestRate - a.bestRate);
  return rows;
}

module.exports = { GEMS, calcGem, getGemRankings };
