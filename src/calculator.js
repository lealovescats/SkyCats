const {
  ITEMS,
  ENCHANTED_PER_REFINED,
  ENCHANTED_PER_PLATE,
  ENCHANTED_PER_SIMPLE_KEY,
  FORGE_HOURS,
  FORGE_HOURS_OWN_PLATE,
} = require("./config");
const { buyOrderCost, sellOfferRevenue } = require("./hypixel");

const MATERIALS = {
  UMBER: {
    key: "UMBER",
    label: "Umber",
    icon: "umber",
    enchantedItem: ITEMS.ENCHANTED_UMBER,
    refinedItem: ITEMS.REFINED_UMBER,
    refinedLabel: "Refined Umber",
    refinedIcon: "refined_umber",
    plateItem: ITEMS.UMBER_PLATE,
    plateLabel: "Umber Plate",
    plateIcon: "umber_plate",
    simpleKeyItem: ITEMS.UMBER_KEY,
    simpleKeyLabel: "Umber Key",
    simpleKeyIcon: "umber_key",
  },
  TUNGSTEN: {
    key: "TUNGSTEN",
    label: "Tungsten",
    icon: "tungsten",
    enchantedItem: ITEMS.ENCHANTED_TUNGSTEN,
    refinedItem: ITEMS.REFINED_TUNGSTEN,
    refinedLabel: "Refined Tungsten",
    refinedIcon: "refined_tungsten",
    plateItem: ITEMS.TUNGSTEN_PLATE,
    plateLabel: "Tungsten Plate",
    plateIcon: "tungsten_plate",
    simpleKeyItem: ITEMS.TUNGSTEN_KEY,
    simpleKeyLabel: "Tungsten Key",
    simpleKeyIcon: "tungsten_key",
  },
};

/** Stop point 1: sell the raw enchanted material straight to the bazaar. */
function calcSellEnchanted(products, materialKey) {
  const mat = MATERIALS[materialKey];
  const revenue = sellOfferRevenue(products, mat.enchantedItem);
  return {
    method: "sell",
    label: `Sell Enchanted ${mat.label}`,
    material: mat.label,
    icon: mat.icon,
    enchantedUsed: 1,
    cost: 0,
    revenue,
    profit: revenue,
    profitPerEnchanted: revenue,
  };
}

/** Stop point 2: craft 160 enchanted into 1 Refined and sell that. */
function calcSellRefined(products, materialKey) {
  const mat = MATERIALS[materialKey];
  const revenue = sellOfferRevenue(products, mat.refinedItem);
  return {
    method: "refined",
    label: `Sell ${mat.refinedLabel}`,
    material: mat.label,
    icon: mat.refinedIcon,
    enchantedUsed: ENCHANTED_PER_REFINED,
    cost: 0,
    revenue,
    profit: revenue,
    profitPerEnchanted: revenue / ENCHANTED_PER_REFINED,
    forgeHours: FORGE_HOURS.REFINED,
    profitPerSlotHour: revenue / FORGE_HOURS.REFINED,
  };
}

/**
 * Stop point 3: craft a plate (4 refined = 640 enchanted + 1 Glacite
 * Amalgamation, buy ordered), then sell the plate.
 */
function calcPlate(products, materialKey) {
  const mat = MATERIALS[materialKey];
  const glaciteCost = buyOrderCost(products, ITEMS.GLACITE_AMALGAMATION);
  const revenue = sellOfferRevenue(products, mat.plateItem);
  const cost = glaciteCost;
  const profit = revenue - cost;
  return {
    method: "plate",
    label: mat.plateLabel,
    material: mat.label,
    icon: mat.plateIcon,
    enchantedUsed: ENCHANTED_PER_PLATE,
    cost,
    revenue,
    profit,
    profitPerEnchanted: profit / ENCHANTED_PER_PLATE,
    forgeHours: FORGE_HOURS_OWN_PLATE,
    profitPerSlotHour: profit / FORGE_HOURS_OWN_PLATE,
  };
}

/**
 * Shared math for the two "assemble from all 3 plates" stop points
 * (Skeleton Key and Perfect Plate): 1 Tungsten Plate + 1 Umber Plate +
 * 1 Mithril Plate, optionally + 1 Bejeweled Handle.
 *
 * mode "UMBER"    -> you supply the Umber Plate's enchanted umber yourself,
 *                    buy-order everything else (incl. the Glacite Amalgamation
 *                    needed to craft your own Umber Plate).
 * mode "TUNGSTEN" -> symmetric, you supply enchanted tungsten.
 * mode "HYBRID"   -> you supply enchanted material for BOTH plates yourself
 *                    (craft both plates), only buy-order the Mithril Plate
 *                    (and the Bejeweled Handle, if included). Profit is
 *                    blended per enchanted across both materials combined.
 */
function calcPlateAssembly(products, mode, { outputItem, includeHandle, labelBase, icon, stageHours }) {
  const mithrilCost = buyOrderCost(products, ITEMS.MITHRIL_PLATE);
  const glaciteCost = buyOrderCost(products, ITEMS.GLACITE_AMALGAMATION);
  const handleCost = includeHandle ? buyOrderCost(products, ITEMS.BEJEWELED_HANDLE) : 0;
  const revenue = sellOfferRevenue(products, outputItem);

  if (mode === "HYBRID") {
    // You craft both plates yourself -> need 2x Glacite Amalgamation, and
    // 2x the own-plate forge chain (both plates forged from scratch).
    const cost = mithrilCost + handleCost + 2 * glaciteCost;
    const profit = revenue - cost;
    const enchantedUsed = 2 * ENCHANTED_PER_PLATE; // 640 umber + 640 tungsten
    const forgeHours = 2 * FORGE_HOURS_OWN_PLATE + stageHours;
    return {
      label: `${labelBase} (Hybrid)`,
      material: "Umber + Tungsten",
      icon,
      enchantedUsed,
      cost,
      revenue,
      profit,
      profitPerEnchanted: profit / enchantedUsed,
      forgeHours,
      profitPerSlotHour: profit / forgeHours,
    };
  }

  const mat = MATERIALS[mode];
  const otherMat = mode === "UMBER" ? MATERIALS.TUNGSTEN : MATERIALS.UMBER;
  const otherPlateCost = buyOrderCost(products, otherMat.plateItem);

  // Cost = the other plate (bought whole) + mithril + handle (if any) + the
  // glacite amalgamation needed to craft YOUR OWN plate.
  const cost = otherPlateCost + mithrilCost + handleCost + glaciteCost;
  const profit = revenue - cost;
  const forgeHours = FORGE_HOURS_OWN_PLATE + stageHours;
  return {
    label: `${labelBase} (${mat.label})`,
    material: mat.label,
    icon,
    enchantedUsed: ENCHANTED_PER_PLATE,
    cost,
    revenue,
    profit,
    profitPerEnchanted: profit / ENCHANTED_PER_PLATE,
    forgeHours,
    profitPerSlotHour: profit / forgeHours,
  };
}

/** Stop point 4a: assemble a Skeleton Key (adds a Bejeweled Handle). */
function calcKey(products, mode) {
  const result = calcPlateAssembly(products, mode, {
    outputItem: ITEMS.SKELETON_KEY,
    includeHandle: true,
    labelBase: "Skeleton Key",
    icon: "skeleton_key",
    // Forging a key requires the Perfect Plate stage first, then the key stage.
    stageHours: FORGE_HOURS.PERFECT_PLATE_STAGE + FORGE_HOURS.SKELETON_KEY_STAGE,
  });
  return { method: "key", ...result };
}

/** Stop point 4b: assemble a Perfect Plate (Skeleton Key minus the handle). */
function calcPerfectPlate(products, mode) {
  const result = calcPlateAssembly(products, mode, {
    outputItem: ITEMS.PERFECT_PLATE,
    includeHandle: false,
    labelBase: "Perfect Plate",
    stageHours: FORGE_HOURS.PERFECT_PLATE_STAGE,
    icon: "perfect_plate",
  });
  return { method: "perfectplate", ...result };
}

/**
 * Alternate stop point: craft an Umber/Tungsten Key directly from 192
 * enchanted + 1 Bejeweled Handle (buy ordered), then sell the key.
 */
function calcSimpleKey(products, materialKey) {
  const mat = MATERIALS[materialKey];
  const handleCost = buyOrderCost(products, ITEMS.BEJEWELED_HANDLE);
  const revenue = sellOfferRevenue(products, mat.simpleKeyItem);
  const cost = handleCost;
  const profit = revenue - cost;
  return {
    method: "simplekey",
    label: mat.simpleKeyLabel,
    material: mat.label,
    icon: mat.simpleKeyIcon,
    enchantedUsed: ENCHANTED_PER_SIMPLE_KEY,
    cost,
    revenue,
    profit,
    profitPerEnchanted: profit / ENCHANTED_PER_SIMPLE_KEY,
    forgeHours: FORGE_HOURS.SIMPLE_KEY,
    profitPerSlotHour: profit / FORGE_HOURS.SIMPLE_KEY,
  };
}

/**
 * Combines the Umber and Tungsten version of a stop point into a single row
 * for Hybrid mode. Both individual profits are kept for display; the row is
 * ranked by the midpoint between the two.
 */
function pairForRanking(label, rowA, rowB) {
  const result = { method: "pair", label, a: rowA, b: rowB };
  if (rowA.profitPerEnchanted !== undefined && rowB.profitPerEnchanted !== undefined) {
    result.profitPerEnchanted = (rowA.profitPerEnchanted + rowB.profitPerEnchanted) / 2;
  }
  if (rowA.profitPerSlotHour !== undefined && rowB.profitPerSlotHour !== undefined) {
    result.profitPerSlotHour = (rowA.profitPerSlotHour + rowB.profitPerSlotHour) / 2;
  }
  return result;
}

/**
 * Builds the ranked comparison for a given selection.
 * selection: "UMBER" | "TUNGSTEN" | "HYBRID"
 */
function getRankedResults(products, selection) {
  let rows;
  if (selection === "HYBRID") {
    rows = [
      calcKey(products, "HYBRID"),
      calcPerfectPlate(products, "HYBRID"),
      pairForRanking("Plate", calcPlate(products, "UMBER"), calcPlate(products, "TUNGSTEN")),
      pairForRanking("Key", calcSimpleKey(products, "UMBER"), calcSimpleKey(products, "TUNGSTEN")),
      pairForRanking("Refined", calcSellRefined(products, "UMBER"), calcSellRefined(products, "TUNGSTEN")),
      pairForRanking("Enchanted", calcSellEnchanted(products, "UMBER"), calcSellEnchanted(products, "TUNGSTEN")),
    ];
  } else {
    rows = [
      calcSellEnchanted(products, selection),
      calcSellRefined(products, selection),
      calcPlate(products, selection),
      calcKey(products, selection),
      calcPerfectPlate(products, selection),
      calcSimpleKey(products, selection),
    ];
  }

  rows.sort((a, b) => b.profitPerEnchanted - a.profitPerEnchanted);
  return rows;
}

/**
 * Builds the ranked comparison by profit-per-forge-slot-hour, for when the 7
 * forge slots (not enchanted material) are the bottleneck. Sell Enchanted is
 * excluded since it doesn't use the forge at all, so it can't be ranked
 * against options that do.
 *
 * Forge slots aren't tied to a material, so in Hybrid mode the Umber and
 * Tungsten Refined/Plate/Simple Key options are combined into one row each
 * (ranked by the midpoint, same as the per-enchanted view), while Perfect
 * Plate and Skeleton Key only appear as their combined Hybrid form (forging
 * both plates yourself), since that's the only way to make them when you're
 * not committing to a single material.
 */
function getForgeRankedResults(products, selection) {
  let rows;
  if (selection === "HYBRID") {
    rows = [
      pairForRanking("Refined", calcSellRefined(products, "UMBER"), calcSellRefined(products, "TUNGSTEN")),
      pairForRanking("Plate", calcPlate(products, "UMBER"), calcPlate(products, "TUNGSTEN")),
      pairForRanking("Key", calcSimpleKey(products, "UMBER"), calcSimpleKey(products, "TUNGSTEN")),
      calcPerfectPlate(products, "HYBRID"),
      calcKey(products, "HYBRID"),
    ];
  } else {
    rows = [
      calcSellRefined(products, selection),
      calcPlate(products, selection),
      calcSimpleKey(products, selection),
      calcPerfectPlate(products, selection),
      calcKey(products, selection),
    ];
  }

  rows.sort((a, b) => b.profitPerSlotHour - a.profitPerSlotHour);
  return rows;
}

module.exports = {
  MATERIALS,
  calcSellEnchanted,
  calcSellRefined,
  calcPlate,
  calcKey,
  calcPerfectPlate,
  calcSimpleKey,
  pairForRanking,
  getRankedResults,
  getForgeRankedResults,
};
