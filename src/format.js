const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { PARTS } = require("./drillparts");

const MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "1️⃣1️⃣", "1️⃣2️⃣"];

// Custom application emojis uploaded to the bot (Discord Developer Portal -> Emojis).
const CUSTOM_EMOJI = {
  umber: "1539372067114197114",
  tungsten: "1539372257997103225",
  refined_umber: "1539372024617762876",
  refined_tungsten: "1539372226707722330",
  umber_plate: "1539372113654448219",
  tungsten_plate: "1539372293808193536",
  perfect_plate: "1539372507583217714",
  skeleton_key: "1539372480752386118",
  umber_key: "1539372088648011806",
  tungsten_key: "1539372275646734516",
  fine_amber_gem: "1539613848699543662",
  flawless_amber_gem: "1539613870824620103",
  fine_jade_gem: "1539613986557927424",
  flawless_jade_gem: "1539614003423346798",
  fine_sapphire_gem: "1539614041130016878",
  flawless_sapphire_gem: "1539614058712399967",
  fine_amethyst_gem: "1539613927946588170",
  flawless_amethyst_gem: "1539613943767765072",
  amber_polished_drill_engine: "1539695050311733269",
  mithril_plated_drill_engine: "1539695084864274522",
  ruby_polished_drill_engine: "1539695113373229086",
  sapphire_polished_drill_engine: "1539695141697232896",
  titanium_plated_drill_engine: "1539695169161535530",
  gemstone_fuel_tank: "1539695196000882891",
  mithril_infused_fuel_tank: "1539695221451792505",
  perfectly_cut_fuel_tank: "1539695247670378536",
  titanium_infused_fuel_tank: "1539695270797774908",
  blue_goblin_egg: "1539695792741294201",
  goblin_egg: "1539695818431271023",
  green_goblin_egg: "1539695836467040286",
  red_goblin_egg: "1539695856956088400",
  yellow_goblin_egg: "1539695877281550467",
  blue_cheese_goblin_omelette: "1539695963390611496",
  goblin_omelette: "1539695988015632534",
  pesto_goblin_omelette: "1539696009620488212",
  spicy_goblin_omelette: "1539696027387437167",
  sunny_side_goblin_omelette: "1539696046706393211",
  starfall: "1539696268698456134",
  starfall_seasoning: "1539696421387767898",
  tungsten_regulator: "1539696440190832671",
  precursor_apparatus: "1539697061577101393",
  plasma: "1539697095311626290",
  gemstone_mixture: "1539697135967146044",
  treasurite: "1539697213205381131",
  drill_motor: "1539697387218542652",
  perfect_amber_gem: "1539697694728130611",
  perfect_sapphire_gem: "1539697803779899433",
  perfect_ruby_gem: "1539697874084831442",
  flawless_ruby_gem: "1539698000304275546",
  flawless_topaz_gem: "1539698039248396308",
  refined_diamond: "1539698285911085116",
  refined_mithril: "1539698312696041574",
  refined_titanium: "1539698341976219668",
  fuel_canister: "1539698603898179585",
  mithril_plate: "1539698710743613523",
  perfect_opal_gem: "1539699502498320425",
};

const emojiTag = (name) => (CUSTOM_EMOJI[name] ? `<:${name}:${CUSTOM_EMOJI[name]}>` : "");

const SELECTION_META = {
  UMBER: { noun: "Umber", color: 0xc97a3d },
  TUNGSTEN: { noun: "Tungsten", color: 0x8e7cc3 },
  HYBRID: { noun: "Hybrid Umber & Tungsten", color: 0xf1c232 },
};

// Abbreviated coin format, e.g. "2.37 M" instead of "2,370,000".
function fmtCoinsShort(n) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)} B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)} M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)} K`;
  return `${sign}${Math.round(abs).toLocaleString("en-US")}`;
}

function fmtForgeTime(hours) {
  if (hours < 1 / 60) return `${Math.round(hours * 3600)}s`;
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

// Drop the trailing "(Umber)" / "(Tungsten)" / "(Hybrid)" suffix: it's always
// redundant now, since single-material selections are unambiguous and Hybrid
// only ever shows the combined Perfect Plate/Skeleton Key rows (no
// per-material versions alongside them to disambiguate against).
function stripMaterialSuffix(label) {
  return label.replace(/ \((Umber|Tungsten|Hybrid)\)$/, "");
}

// Orders a pair row's two sides higher-profit-first.
function sortedPair(row, profitKey) {
  return row.a[profitKey] >= row.b[profitKey] ? [row.a, row.b] : [row.b, row.a];
}

function fieldForRow(row) {
  if (row.method === "pair") {
    const [top, bottom] = sortedPair(row, "profitPerEnchanted");
    return {
      name: row.label,
      value:
        `${emojiTag(top.icon)} **${fmtCoinsShort(top.profitPerEnchanted)} coins** per enchanted\n` +
        `${emojiTag(bottom.icon)} **${fmtCoinsShort(bottom.profitPerEnchanted)} coins** per enchanted`,
    };
  }

  const emoji = emojiTag(row.icon);
  const label = stripMaterialSuffix(row.label);
  return {
    name: `${emoji} ${label}`,
    value: `**${fmtCoinsShort(row.profitPerEnchanted)} coins** per enchanted`,
  };
}

function buildResultsEmbed(selection, rows) {
  const meta = SELECTION_META[selection];

  const embed = new EmbedBuilder()
    .setTitle("💰 Metal Profit Ranking")
    .setColor(meta.color)
    .setDescription(`Highest profit forge for **${meta.noun}**.`)
    .setTimestamp();

  rows.forEach((row, i) => {
    const medal = MEDALS[i] ?? `${i + 1}.`;
    const { name, value } = fieldForRow(row);
    embed.addFields({ name: `${medal} ${name}`, value, inline: false });
  });

  embed.setFooter({ text: "Made by ilovecatsyes 💜" });

  return embed;
}

function fieldForForgeRow(row) {
  if (row.method === "pair") {
    const [top, bottom] = sortedPair(row, "profitPerSlotHour");
    return {
      name: `${row.label} (${fmtForgeTime(row.a.forgeHours)} to craft)`,
      value:
        `${emojiTag(top.icon)} **${fmtCoinsShort(top.profitPerSlotHour)} coins** per forge-hour\n` +
        `${emojiTag(bottom.icon)} **${fmtCoinsShort(bottom.profitPerSlotHour)} coins** per forge-hour`,
    };
  }

  const emoji = emojiTag(row.icon);
  const label = stripMaterialSuffix(row.label);
  return {
    name: `${emoji} ${label} (${fmtForgeTime(row.forgeHours)} to craft)`,
    value: `**${fmtCoinsShort(row.profitPerSlotHour)} coins** per forge-hour`,
  };
}

function buildForgeResultsEmbed(selection, rows) {
  const meta = SELECTION_META[selection];

  const embed = new EmbedBuilder()
    .setTitle("⚒️ Forge Profit Ranking")
    .setColor(meta.color)
    .setDescription(
      `Highest profit forge for **${meta.noun}** - By forge time, profit per slot.`,
    )
    .setTimestamp();

  rows.forEach((row, i) => {
    const medal = MEDALS[i] ?? `${i + 1}.`;
    const { name, value } = fieldForForgeRow(row);
    embed.addFields({ name: `${medal} ${name}`, value, inline: false });
  });

  embed.setFooter({ text: "Made by ilovecatsyes 💜" });

  return embed;
}

function fieldForGemRow(row) {
  const fineLine = `${emojiTag(row.fineIcon)} Fine: **${fmtCoinsShort(row.fineRate)} coins** per Fine`;
  const flawlessLine =
    `${emojiTag(row.flawlessIcon)} Flawless: **${fmtCoinsShort(row.flawlessPrice)} coins** per Flawless ` +
    `(${fmtCoinsShort(row.flawlessRate)} per Fine)`;

  const lines = row.best === "FLAWLESS" ? [flawlessLine, fineLine] : [fineLine, flawlessLine];

  return {
    name: `${emojiTag(row.bestIcon)} ${row.label}`,
    value: lines.join("\n"),
  };
}

function buildGemsEmbed(rows) {
  const embed = new EmbedBuilder()
    .setTitle("💎 Gemstone Profit Ranking")
    .setColor(0x5865f2)
    .setDescription("Crystal Hollows bp7 gems ranked by price.")
    .setTimestamp();

  rows.forEach((row, i) => {
    const medal = MEDALS[i] ?? `${i + 1}.`;
    const { name, value } = fieldForGemRow(row);
    embed.addFields({ name: `${medal} ${name}`, value, inline: false });
  });

  embed.setFooter({ text: "Made by ilovecatsyes 💜" });

  return embed;
}

const MATERIAL_ORDER = ["TUNGSTEN", "UMBER", "HYBRID"];
const MATERIAL_LABELS = { TUNGSTEN: "Tungsten", UMBER: "Umber", HYBRID: "Hybrid" };
const OTHER_MODE = { ENCHANTED: "FORGE", FORGE: "ENCHANTED" };
const MODE_SWITCH_LABEL = { ENCHANTED: "Switch to Forge Time", FORGE: "Switch to Per Enchanted" };

// customId format: "mp|<material>|<mode>|<ownerId>" - each button's ID is the
// full state to switch TO when clicked, plus the original command user's ID
// so only they can click it.
function buildComponents(selection, mode, ownerId) {
  const row = new ActionRowBuilder();

  for (const material of MATERIAL_ORDER) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`mp|${material}|${mode}|${ownerId}`)
        .setLabel(MATERIAL_LABELS[material])
        .setStyle(material === selection ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(material === selection),
    );
  }

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`mp|${selection}|${OTHER_MODE[mode]}|${ownerId}`)
      .setLabel(MODE_SWITCH_LABEL[mode])
      .setStyle(ButtonStyle.Success),
  );

  return row;
}

const PRICE_MODE_LABEL = { BUYORDER: "Buy Order", INSTANT: "Instant Buy" };
const OTHER_PRICE_MODE = { BUYORDER: "INSTANT", INSTANT: "BUYORDER" };
const PRICE_MODE_SWITCH_LABEL = { BUYORDER: "Switch to Instant Buy", INSTANT: "Switch to Buy Order" };

function buildDrillPartsEmbed(startKey, endKey, priceMode, priced, lowestBin) {
  const endLabel = PARTS[endKey].label;
  const endIcon = emojiTag(PARTS[endKey].icon);
  const startLabel = startKey ? PARTS[startKey].label : null;
  const startIcon = startKey ? emojiTag(PARTS[startKey].icon) : null;
  const modeLabel = PRICE_MODE_LABEL[priceMode];

  const embed = new EmbedBuilder()
    .setTitle("🛠️ Drill Part Forge Cost")
    .setColor(0x71368a)
    .setDescription(
      startLabel
        ? `Forging ${startIcon} **${startLabel}** → ${endIcon} **${endLabel}** · priced at **${modeLabel}**`
        : `Forging ${endIcon} **${endLabel}** from scratch · priced at **${modeLabel}**`,
    )
    .setTimestamp();

  if (priced.lines.length === 0) {
    embed.addFields({ name: "Materials Needed", value: "None.", inline: false });
  } else {
    const materialLines = priced.lines.map(
      (l) =>
        `${emojiTag(l.icon)} ${l.label} x${l.qty.toLocaleString("en-US")} — ${fmtCoinsShort(l.unitPrice)} each = **${fmtCoinsShort(l.subtotal)}**`,
    );
    embed.addFields({ name: "Materials Needed", value: materialLines.join("\n"), inline: false });
  }

  embed.addFields({ name: "Total Cost", value: `**${fmtCoinsShort(priced.grandTotal)} coins**`, inline: false });

  if (lowestBin !== undefined) {
    if (lowestBin === null) {
      embed.addFields({ name: "Lowest Active BIN", value: "No active BIN listings found.", inline: false });
    } else {
      const diff = Math.abs(priced.grandTotal - lowestBin);
      const verdict =
        priced.grandTotal < lowestBin
          ? `Forging is **${fmtCoinsShort(diff)} cheaper** than buying.`
          : `Buying is **${fmtCoinsShort(diff)} cheaper** than forging.`;
      embed.addFields({
        name: "Lowest Active BIN",
        value: `**${fmtCoinsShort(lowestBin)} coins**\n${verdict}`,
        inline: false,
      });
    }
  }

  embed.setFooter({ text: "Made by ilovecatsyes 💜" });

  return embed;
}

// customId format: "dp|<startKeyOrNONE>|<endKey>|<priceMode>|<ownerId>"
function buildDrillPartsComponents(startKey, endKey, priceMode, ownerId) {
  const row = new ActionRowBuilder();

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`dp|${startKey ?? "NONE"}|${endKey}|${OTHER_PRICE_MODE[priceMode]}|${ownerId}`)
      .setLabel(PRICE_MODE_SWITCH_LABEL[priceMode])
      .setStyle(ButtonStyle.Success),
  );

  return row;
}

module.exports = {
  buildResultsEmbed,
  buildForgeResultsEmbed,
  buildComponents,
  buildGemsEmbed,
  buildDrillPartsEmbed,
  buildDrillPartsComponents,
};
