const { ITEMS } = require("./config");
const { buyOrderCost, instantBuyCost } = require("./hypixel");

// Chance (%) that throwing this egg spawns a Golden Goblin.
const GOBLIN_EGGS = {
  GOBLIN_EGG: { label: "Goblin Egg", item: ITEMS.GOBLIN_EGG, icon: "goblin_egg", chance: 2 },
  GREEN_GOBLIN_EGG: {
    label: "Green Goblin Egg",
    item: ITEMS.GOBLIN_EGG_GREEN,
    icon: "green_goblin_egg",
    chance: 2.5,
  },
  YELLOW_GOBLIN_EGG: {
    label: "Yellow Goblin Egg",
    item: ITEMS.GOBLIN_EGG_YELLOW,
    icon: "yellow_goblin_egg",
    chance: 3.33,
  },
  RED_GOBLIN_EGG: { label: "Red Goblin Egg", item: ITEMS.GOBLIN_EGG_RED, icon: "red_goblin_egg", chance: 5 },
  BLUE_GOBLIN_EGG: {
    label: "Blue Goblin Egg",
    item: ITEMS.GOBLIN_EGG_BLUE,
    icon: "blue_goblin_egg",
    chance: 10,
  },
};

/**
 * Cost per spawned Golden Goblin = egg price ÷ spawn chance, i.e. the
 * expected coin cost of throwing eggs until one triggers a spawn.
 */
function calcGoblinEgg(products, key, priceMode) {
  const egg = GOBLIN_EGGS[key];
  const priceFn = priceMode === "INSTANT" ? instantBuyCost : buyOrderCost;
  const eggPrice = priceFn(products, egg.item);
  const costPerGoblin = eggPrice / (egg.chance / 100);

  return {
    key,
    label: egg.label,
    icon: egg.icon,
    chance: egg.chance,
    eggPrice,
    costPerGoblin,
  };
}

/** Ranks all 5 goblin eggs cheapest-per-Goblin first (best to worst). */
function getGoblinEggRankings(products, priceMode) {
  const rows = Object.keys(GOBLIN_EGGS).map((key) => calcGoblinEgg(products, key, priceMode));
  rows.sort((a, b) => a.costPerGoblin - b.costPerGoblin);
  return rows;
}

module.exports = { GOBLIN_EGGS, calcGoblinEgg, getGoblinEggRankings };
