// Hypixel Skyblock Bazaar product IDs (verified against the live /skyblock/bazaar endpoint).
const ITEMS = {
  ENCHANTED_UMBER: "ENCHANTED_UMBER",
  ENCHANTED_TUNGSTEN: "ENCHANTED_TUNGSTEN",
  REFINED_UMBER: "REFINED_UMBER",
  REFINED_TUNGSTEN: "REFINED_TUNGSTEN",
  UMBER_PLATE: "UMBER_PLATE",
  TUNGSTEN_PLATE: "TUNGSTEN_PLATE",
  MITHRIL_PLATE: "MITHRIL_PLATE",
  PERFECT_PLATE: "PERFECT_PLATE",
  GLACITE_AMALGAMATION: "GLACITE_AMALGAMATION",
  BEJEWELED_HANDLE: "BEJEWELED_HANDLE",
  SKELETON_KEY: "SKELETON_KEY",
  UMBER_KEY: "UMBER_KEY",
  TUNGSTEN_KEY: "TUNGSTEN_KEY",
  FINE_AMBER_GEM: "FINE_AMBER_GEM",
  FLAWLESS_AMBER_GEM: "FLAWLESS_AMBER_GEM",
  FINE_JADE_GEM: "FINE_JADE_GEM",
  FLAWLESS_JADE_GEM: "FLAWLESS_JADE_GEM",
  FINE_SAPPHIRE_GEM: "FINE_SAPPHIRE_GEM",
  FLAWLESS_SAPPHIRE_GEM: "FLAWLESS_SAPPHIRE_GEM",
  FINE_AMETHYST_GEM: "FINE_AMETHYST_GEM",
  FLAWLESS_AMETHYST_GEM: "FLAWLESS_AMETHYST_GEM",
  // Drill part raw materials. Note: DRILL_MOTOR and FUEL_CANISTER are legacy
  // Hypixel bazaar IDs that no longer match their current display names
  // (confirmed via the /resources/skyblock/items endpoint).
  DRILL_MOTOR: "DRILL_ENGINE", // display name: "Drill Motor"
  FUEL_CANISTER: "FUEL_TANK", // display name: "Fuel Canister"
  REFINED_TITANIUM: "REFINED_TITANIUM",
  REFINED_DIAMOND: "REFINED_DIAMOND",
  REFINED_MITHRIL: "REFINED_MITHRIL",
  PRECURSOR_APPARATUS: "PRECURSOR_APPARATUS",
  PLASMA: "PLASMA",
  GEMSTONE_MIXTURE: "GEMSTONE_MIXTURE",
  PERFECT_RUBY_GEM: "PERFECT_RUBY_GEM",
  PERFECT_SAPPHIRE_GEM: "PERFECT_SAPPHIRE_GEM",
  PERFECT_AMBER_GEM: "PERFECT_AMBER_GEM",
  PERFECT_OPAL_GEM: "PERFECT_OPAL_GEM",
  FLAWLESS_RUBY_GEM: "FLAWLESS_RUBY_GEM",
  FLAWLESS_TOPAZ_GEM: "FLAWLESS_TOPAZ_GEM",
  GOBLIN_EGG: "GOBLIN_EGG",
  GOBLIN_EGG_BLUE: "GOBLIN_EGG_BLUE",
  GOBLIN_EGG_GREEN: "GOBLIN_EGG_GREEN",
  GOBLIN_EGG_RED: "GOBLIN_EGG_RED",
  GOBLIN_EGG_YELLOW: "GOBLIN_EGG_YELLOW",
  STARFALL: "STARFALL",
  TREASURITE: "TREASURITE",
};

const FINE_PER_FLAWLESS = 80; // 80 Fine gems = 1 Flawless gem

// Recipe constants
const REFINED_PER_PLATE = 4; // 1 plate = 4 refined + 1 glacite amalgamation
const ENCHANTED_PER_REFINED = 160; // 1 refined = 160 enchanted
const ENCHANTED_PER_PLATE = REFINED_PER_PLATE * ENCHANTED_PER_REFINED; // 640
const ENCHANTED_PER_SIMPLE_KEY = 192; // 1 Umber/Tungsten Key = 192 enchanted + 1 Bejeweled Handle

// Forge times (hours). Only steps you personally forge cost slot time -
// bought materials (Amalgamation, Handle, Mithril Plate, the "missing" plate)
// don't consume a slot.
const FORGE_HOURS = {
  REFINED: 1, // 160 enchanted -> 1 Refined
  PLATE_STAGE: 3, // 4 Refined + 1 Glacite Amalgamation -> 1 Plate (excludes the 4 refining jobs)
  PERFECT_PLATE_STAGE: 0.5, // 3 plates -> 1 Perfect Plate
  SKELETON_KEY_STAGE: 0.5, // Perfect Plate + Handle -> 1 Skeleton Key
  SIMPLE_KEY: 30 / 3600, // 192 enchanted + Handle -> 1 Umber/Tungsten Key (30 seconds)
};
// Forging your own plate from scratch: 4 refining jobs + the plate-forge stage.
const FORGE_HOURS_OWN_PLATE = FORGE_HOURS.REFINED * REFINED_PER_PLATE + FORGE_HOURS.PLATE_STAGE; // 7h
const FORGE_SLOTS = 7;

module.exports = {
  ITEMS,
  REFINED_PER_PLATE,
  ENCHANTED_PER_REFINED,
  ENCHANTED_PER_PLATE,
  ENCHANTED_PER_SIMPLE_KEY,
  FORGE_HOURS,
  FORGE_HOURS_OWN_PLATE,
  FORGE_SLOTS,
  FINE_PER_FLAWLESS,
};
