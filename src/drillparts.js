const { ITEMS } = require("./config");
const { buyOrderCost, instantBuyCost } = require("./hypixel");

// Each part's recipe is a list of ingredients. `{ part: KEY }` means "the
// previous tier of this same chain" (always skipped when pricing - it's
// either what the user already owns, or something an earlier step in the
// same forge already accounts for). `{ raw: bazaarId }` is a bought material.
const PARTS = {
  MITHRIL_ENGINE: {
    label: "Mithril-Plated Drill Engine",
    category: "Drill Engine",
    icon: "mithril_plated_drill_engine",
    predecessor: null,
    recipe: [
      { raw: ITEMS.DRILL_MOTOR, qty: 2 },
      { raw: ITEMS.MITHRIL_PLATE, qty: 1 },
    ],
  },
  TITANIUM_ENGINE: {
    label: "Titanium-Plated Drill Engine",
    category: "Drill Engine",
    icon: "titanium_plated_drill_engine",
    predecessor: "MITHRIL_ENGINE",
    recipe: [
      { part: "MITHRIL_ENGINE", qty: 1 },
      { raw: ITEMS.REFINED_TITANIUM, qty: 8 },
      { raw: ITEMS.DRILL_MOTOR, qty: 2 },
    ],
  },
  RUBY_ENGINE: {
    label: "Ruby-Polished Drill Engine",
    category: "Drill Engine",
    icon: "ruby_polished_drill_engine",
    predecessor: "TITANIUM_ENGINE",
    recipe: [
      { part: "TITANIUM_ENGINE", qty: 1 },
      { raw: ITEMS.PERFECT_RUBY_GEM, qty: 1 },
      { raw: ITEMS.PRECURSOR_APPARATUS, qty: 4 },
      { raw: ITEMS.DRILL_MOTOR, qty: 5 },
    ],
  },
  SAPPHIRE_ENGINE: {
    label: "Sapphire-Polished Drill Engine",
    category: "Drill Engine",
    icon: "sapphire_polished_drill_engine",
    predecessor: "RUBY_ENGINE",
    recipe: [
      { part: "RUBY_ENGINE", qty: 1 },
      { raw: ITEMS.PERFECT_SAPPHIRE_GEM, qty: 3 },
      { raw: ITEMS.PRECURSOR_APPARATUS, qty: 8 },
      { raw: ITEMS.DRILL_MOTOR, qty: 5 },
      { raw: ITEMS.PLASMA, qty: 16 },
    ],
  },
  AMBER_ENGINE: {
    label: "Amber-Polished Drill Engine",
    category: "Drill Engine",
    icon: "amber_polished_drill_engine",
    predecessor: "SAPPHIRE_ENGINE",
    recipe: [
      { part: "SAPPHIRE_ENGINE", qty: 1 },
      { raw: ITEMS.PERFECT_AMBER_GEM, qty: 5 },
      { raw: ITEMS.PRECURSOR_APPARATUS, qty: 16 },
      { raw: ITEMS.DRILL_MOTOR, qty: 5 },
      { raw: ITEMS.PLASMA, qty: 32 },
    ],
  },

  MITHRIL_TANK: {
    label: "Mithril-Infused Fuel Tank",
    category: "Fuel Tank",
    icon: "mithril_infused_fuel_tank",
    predecessor: null,
    recipe: [
      { raw: ITEMS.REFINED_DIAMOND, qty: 5 },
      { raw: ITEMS.REFINED_MITHRIL, qty: 10 },
      { raw: ITEMS.FUEL_CANISTER, qty: 5 },
    ],
  },
  TITANIUM_TANK: {
    label: "Titanium-Infused Fuel Tank",
    category: "Fuel Tank",
    icon: "titanium_infused_fuel_tank",
    predecessor: "MITHRIL_TANK",
    recipe: [
      { part: "MITHRIL_TANK", qty: 1 },
      { raw: ITEMS.REFINED_TITANIUM, qty: 10 },
      { raw: ITEMS.REFINED_DIAMOND, qty: 5 },
      { raw: ITEMS.FUEL_CANISTER, qty: 5 },
    ],
  },
  GEMSTONE_TANK: {
    label: "Gemstone Fuel Tank",
    category: "Fuel Tank",
    icon: "gemstone_fuel_tank",
    predecessor: "TITANIUM_TANK",
    recipe: [
      { part: "TITANIUM_TANK", qty: 1 },
      { raw: ITEMS.PRECURSOR_APPARATUS, qty: 4 },
      { raw: ITEMS.GEMSTONE_MIXTURE, qty: 10 },
    ],
  },
  PERFECT_TANK: {
    label: "Perfectly-Cut Fuel Tank",
    category: "Fuel Tank",
    icon: "perfectly_cut_fuel_tank",
    predecessor: "GEMSTONE_TANK",
    recipe: [
      { part: "GEMSTONE_TANK", qty: 1 },
      { raw: ITEMS.PRECURSOR_APPARATUS, qty: 16 },
      { raw: ITEMS.GEMSTONE_MIXTURE, qty: 25 },
      { raw: ITEMS.PLASMA, qty: 32 },
    ],
  },

  GOBLIN_OMELETTE: {
    label: "Goblin Omelette",
    category: "Upgrade Module",
    icon: "goblin_omelette",
    predecessor: null,
    recipe: [{ raw: ITEMS.GOBLIN_EGG, qty: 96 }],
  },
  BLUE_CHEESE_OMELETTE: {
    label: "Blue Cheese Goblin Omelette",
    category: "Upgrade Module",
    icon: "blue_cheese_goblin_omelette",
    predecessor: "GOBLIN_OMELETTE",
    recipe: [
      { part: "GOBLIN_OMELETTE", qty: 1 },
      { raw: ITEMS.GOBLIN_EGG_BLUE, qty: 96 },
      { raw: ITEMS.FLAWLESS_SAPPHIRE_GEM, qty: 1 },
    ],
  },
  PESTO_OMELETTE: {
    label: "Pesto Goblin Omelette",
    category: "Upgrade Module",
    icon: "pesto_goblin_omelette",
    predecessor: "GOBLIN_OMELETTE",
    recipe: [
      { part: "GOBLIN_OMELETTE", qty: 1 },
      { raw: ITEMS.GOBLIN_EGG_GREEN, qty: 96 },
      { raw: ITEMS.FLAWLESS_JADE_GEM, qty: 1 },
    ],
  },
  SPICY_OMELETTE: {
    label: "Spicy Goblin Omelette",
    category: "Upgrade Module",
    icon: "spicy_goblin_omelette",
    predecessor: "GOBLIN_OMELETTE",
    recipe: [
      { part: "GOBLIN_OMELETTE", qty: 1 },
      { raw: ITEMS.GOBLIN_EGG_RED, qty: 96 },
      { raw: ITEMS.FLAWLESS_RUBY_GEM, qty: 1 },
    ],
  },
  SUNNY_OMELETTE: {
    label: "Sunny Side Goblin Omelette",
    category: "Upgrade Module",
    icon: "sunny_side_goblin_omelette",
    predecessor: "GOBLIN_OMELETTE",
    recipe: [
      { part: "GOBLIN_OMELETTE", qty: 1 },
      { raw: ITEMS.GOBLIN_EGG_YELLOW, qty: 96 },
      { raw: ITEMS.FLAWLESS_TOPAZ_GEM, qty: 1 },
    ],
  },
  TUNGSTEN_REGULATOR: {
    label: "Tungsten Regulator",
    category: "Upgrade Module",
    icon: "tungsten_regulator",
    predecessor: null,
    recipe: [
      { raw: ITEMS.PERFECT_OPAL_GEM, qty: 1 },
      { raw: ITEMS.FUEL_CANISTER, qty: 5 },
      { raw: ITEMS.TUNGSTEN_PLATE, qty: 5 },
    ],
  },
  STARFALL_SEASONING: {
    label: "Starfall Seasoning",
    category: "Upgrade Module",
    icon: "starfall_seasoning",
    predecessor: null,
    recipe: [
      { raw: ITEMS.STARFALL, qty: 64 },
      { raw: ITEMS.TREASURITE, qty: 16 },
    ],
  },
};

// Display order for the slash command's option choices.
const PART_ORDER = [
  "MITHRIL_ENGINE",
  "TITANIUM_ENGINE",
  "RUBY_ENGINE",
  "SAPPHIRE_ENGINE",
  "AMBER_ENGINE",
  "MITHRIL_TANK",
  "TITANIUM_TANK",
  "GEMSTONE_TANK",
  "PERFECT_TANK",
  "GOBLIN_OMELETTE",
  "BLUE_CHEESE_OMELETTE",
  "PESTO_OMELETTE",
  "SPICY_OMELETTE",
  "SUNNY_OMELETTE",
  "TUNGSTEN_REGULATOR",
  "STARFALL_SEASONING",
];

const RAW_ITEMS = {
  [ITEMS.DRILL_MOTOR]: { label: "Drill Motor", icon: "drill_motor" },
  [ITEMS.MITHRIL_PLATE]: { label: "Mithril Plate", icon: "mithril_plate" },
  [ITEMS.REFINED_TITANIUM]: { label: "Refined Titanium", icon: "refined_titanium" },
  [ITEMS.PERFECT_RUBY_GEM]: { label: "Perfect Ruby Gemstone", icon: "perfect_ruby_gem" },
  [ITEMS.PRECURSOR_APPARATUS]: { label: "Precursor Apparatus", icon: "precursor_apparatus" },
  [ITEMS.PERFECT_SAPPHIRE_GEM]: { label: "Perfect Sapphire Gemstone", icon: "perfect_sapphire_gem" },
  [ITEMS.PLASMA]: { label: "Plasma", icon: "plasma" },
  [ITEMS.PERFECT_AMBER_GEM]: { label: "Perfect Amber Gemstone", icon: "perfect_amber_gem" },
  [ITEMS.REFINED_DIAMOND]: { label: "Refined Diamond", icon: "refined_diamond" },
  [ITEMS.REFINED_MITHRIL]: { label: "Refined Mithril", icon: "refined_mithril" },
  [ITEMS.FUEL_CANISTER]: { label: "Fuel Canister", icon: "fuel_canister" },
  [ITEMS.GEMSTONE_MIXTURE]: { label: "Gemstone Mixture", icon: "gemstone_mixture" },
  [ITEMS.GOBLIN_EGG]: { label: "Goblin Egg", icon: "goblin_egg" },
  [ITEMS.GOBLIN_EGG_BLUE]: { label: "Blue Goblin Egg", icon: "blue_goblin_egg" },
  [ITEMS.FLAWLESS_SAPPHIRE_GEM]: { label: "Flawless Sapphire Gemstone", icon: "flawless_sapphire_gem" },
  [ITEMS.GOBLIN_EGG_GREEN]: { label: "Green Goblin Egg", icon: "green_goblin_egg" },
  [ITEMS.FLAWLESS_JADE_GEM]: { label: "Flawless Jade Gemstone", icon: "flawless_jade_gem" },
  [ITEMS.GOBLIN_EGG_RED]: { label: "Red Goblin Egg", icon: "red_goblin_egg" },
  [ITEMS.FLAWLESS_RUBY_GEM]: { label: "Flawless Ruby Gemstone", icon: "flawless_ruby_gem" },
  [ITEMS.GOBLIN_EGG_YELLOW]: { label: "Yellow Goblin Egg", icon: "yellow_goblin_egg" },
  [ITEMS.FLAWLESS_TOPAZ_GEM]: { label: "Flawless Topaz Gemstone", icon: "flawless_topaz_gem" },
  [ITEMS.PERFECT_OPAL_GEM]: { label: "Perfect Opal Gemstone", icon: "perfect_opal_gem" },
  [ITEMS.TUNGSTEN_PLATE]: { label: "Tungsten Plate", icon: "tungsten_plate" },
  [ITEMS.STARFALL]: { label: "Starfall", icon: "starfall" },
  [ITEMS.TREASURITE]: { label: "Treasurite", icon: "treasurite" },
};

/** Returns the chain from `partKey` up to its root base tier: [partKey, ..., base]. */
function getAncestorChain(partKey) {
  const chain = [];
  let cur = partKey;
  while (cur) {
    chain.push(cur);
    cur = PARTS[cur].predecessor;
  }
  return chain;
}

/**
 * Validates a start/end combination and returns the ordered list of forge
 * steps (base-first) to walk, exclusive of `startKey`.
 *
 * Returns one of:
 *  - { steps: [...] } on success
 *  - { alreadyOwned: true } if start === end
 *  - { error: "..." } if start isn't an ancestor of end (different chain/branch)
 */
function getForgeSteps(startKey, endKey) {
  const chain = getAncestorChain(endKey); // [end, ..., base]

  if (!startKey) {
    return { steps: chain.reverse() };
  }

  if (startKey === endKey) {
    return { alreadyOwned: true };
  }

  const idx = chain.indexOf(startKey);
  if (idx === -1) {
    return {
      error: `**${PARTS[startKey].label}** is not a valid starting point for **${PARTS[endKey].label}** — it isn't part of that item's upgrade chain.`,
    };
  }

  chain.length = idx; // drop everything from startKey down to base
  return { steps: chain.reverse() };
}

/** Sums raw material quantities needed across a list of forge steps. */
function computeRawMaterials(steps) {
  const totals = new Map();
  for (const partKey of steps) {
    for (const ing of PARTS[partKey].recipe) {
      if (ing.part) continue; // chain-link - already owned or covered by an earlier step
      totals.set(ing.raw, (totals.get(ing.raw) ?? 0) + ing.qty);
    }
  }
  return totals;
}

/**
 * Prices a raw-material totals map. priceMode: "BUYORDER" (default, patient
 * buy order) or "INSTANT" (instant buy).
 */
function priceMaterials(products, totals, priceMode) {
  const priceFn = priceMode === "INSTANT" ? instantBuyCost : buyOrderCost;
  const lines = [];
  let grandTotal = 0;

  for (const [itemId, qty] of totals) {
    const unitPrice = priceFn(products, itemId);
    const subtotal = unitPrice * qty;
    grandTotal += subtotal;
    const info = RAW_ITEMS[itemId];
    lines.push({ itemId, label: info?.label ?? itemId, icon: info?.icon, qty, unitPrice, subtotal });
  }

  lines.sort((a, b) => b.subtotal - a.subtotal);
  return { lines, grandTotal };
}

module.exports = {
  PARTS,
  PART_ORDER,
  getAncestorChain,
  getForgeSteps,
  computeRawMaterials,
  priceMaterials,
};
