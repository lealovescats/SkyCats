const { ITEMS } = require("./config");
const { buyOrderCost, instantBuyCost } = require("./hypixel");

// Fuel amount each item provides when thrown into a drill. Red Thornleaf is
// excluded - not bazaar-tradable, and has no NPC price either. Biofuel isn't
// bazaar-tradable, but has a fixed NPC purchase price instead of a `item` ID.
const DRILL_FUELS = {
  POPPY: { label: "Poppy", item: ITEMS.POPPY, fuel: 2, icon: "poppy" },
  BIOFUEL: { label: "Biofuel", fixedPrice: 20_000, fuel: 3000, icon: "biofuel" },
  DANDELION: { label: "Dandelion", item: ITEMS.DANDELION, fuel: 2, icon: "dandelion" },
  PLANT_MATTER: { label: "Plant Matter", item: ITEMS.PLANT_MATTER, fuel: 150, icon: "plant_matter" },
  // Enchanted materials reuse their base item's icon - Hypixel doesn't give
  // them a visually distinct texture.
  ENCHANTED_DANDELION: {
    label: "Enchanted Dandelion",
    item: ITEMS.ENCHANTED_DANDELION,
    fuel: 360,
    icon: "dandelion",
  },
  ENCHANTED_POPPY: { label: "Enchanted Poppy", item: ITEMS.ENCHANTED_POPPY, fuel: 1024, icon: "poppy" },
  GOBLIN_EGG: { label: "Goblin Egg", item: ITEMS.GOBLIN_EGG, fuel: 2000, icon: "goblin_egg" },
  GREEN_GOBLIN_EGG: {
    label: "Green Goblin Egg",
    item: ITEMS.GOBLIN_EGG_GREEN,
    fuel: 5000,
    icon: "green_goblin_egg",
  },
  COALROOT: { label: "Coalroot", item: ITEMS.COALROOT, fuel: 5000, icon: "coalroot" },
  VOLTA: { label: "Volta", item: ITEMS.VOLTA, fuel: 10000, icon: "volta" },
  OIL_BARREL: { label: "Oil Barrel", item: ITEMS.OIL_BARREL, fuel: 10000, icon: "oil_barrel" },
  YELLOW_GOBLIN_EGG: {
    label: "Yellow Goblin Egg",
    item: ITEMS.GOBLIN_EGG_YELLOW,
    fuel: 10000,
    icon: "yellow_goblin_egg",
  },
  RED_GOBLIN_EGG: { label: "Red Goblin Egg", item: ITEMS.GOBLIN_EGG_RED, fuel: 15000, icon: "red_goblin_egg" },
  BLUE_GOBLIN_EGG: {
    label: "Blue Goblin Egg",
    item: ITEMS.GOBLIN_EGG_BLUE,
    fuel: 20000,
    icon: "blue_goblin_egg",
  },
  SUNFLOWER_OIL: { label: "Sunflower Oil", item: ITEMS.SUNFLOWER_OIL, fuel: 20000, icon: "sunflower_oil" },
  UGLY_FOSSIL: { label: "Ugly Fossil", item: ITEMS.UGLY_FOSSIL, fuel: 50000, icon: "ugly_fossil" },
  HELIX_FOSSIL: { label: "Helix Fossil", item: ITEMS.HELIX_FOSSIL, fuel: 50000, icon: "helix_fossil" },
  TUSK_FOSSIL: { label: "Tusk Fossil", item: ITEMS.TUSK_FOSSIL, fuel: 50000, icon: "tusk_fossil" },
  WEBBED_FOSSIL: { label: "Webbed Fossil", item: ITEMS.WEBBED_FOSSIL, fuel: 50000, icon: "webbed_fossil" },
  FOOTPRINT_FOSSIL: {
    label: "Footprint Fossil",
    item: ITEMS.FOOTPRINT_FOSSIL,
    fuel: 50000,
    icon: "footprint_fossil",
  },
  SPINE_FOSSIL: { label: "Spine Fossil", item: ITEMS.SPINE_FOSSIL, fuel: 50000, icon: "spine_fossil" },
  CLUBBED_FOSSIL: { label: "Clubbed Fossil", item: ITEMS.CLUBBED_FOSSIL, fuel: 50000, icon: "clubbed_fossil" },
  CLAW_FOSSIL: { label: "Claw Fossil", item: ITEMS.CLAW_FOSSIL, fuel: 50000, icon: "claw_fossil" },
};

// Biofuel's fixed NPC price doesn't change with the buy-order/instant-buy
// toggle - only bazaar-sourced items do.
function calcDrillFuel(products, key, priceMode) {
  const entry = DRILL_FUELS[key];
  const isFixedPrice = entry.fixedPrice !== undefined;
  const priceFn = priceMode === "INSTANT" ? instantBuyCost : buyOrderCost;
  const price = isFixedPrice ? entry.fixedPrice : priceFn(products, entry.item);
  const costPerFuel = price / entry.fuel;

  return {
    key,
    label: entry.label,
    icon: entry.icon,
    price,
    isFixedPrice,
    fuelAmount: entry.fuel,
    costPerFuel,
  };
}

/** Ranks every fuel cheapest-per-Fuel-point first, returning only the top 5. */
function getDrillFuelRankings(products, priceMode) {
  const rows = Object.keys(DRILL_FUELS).map((key) => calcDrillFuel(products, key, priceMode));
  rows.sort((a, b) => a.costPerFuel - b.costPerFuel);
  return rows.slice(0, 5);
}

module.exports = { DRILL_FUELS, calcDrillFuel, getDrillFuelRankings };
