require("dotenv").config();
const { Client, GatewayIntentBits, MessageFlags } = require("discord.js");
const { getBazaarProducts } = require("./hypixel");
const { getRankedResults, getForgeRankedResults } = require("./calculator");
const { getGemRankings } = require("./gems");
const { getForgeSteps, computeRawMaterials, priceMaterials } = require("./drillparts");
const { getLowestBin } = require("./auctions");
const { getGoblinEggRankings } = require("./goblineggs");
const { getDrillFuelRankings } = require("./drillfuel");
const {
  buildResultsEmbed,
  buildForgeResultsEmbed,
  buildComponents,
  buildGemsEmbed,
  buildDrillPartsEmbed,
  buildDrillPartsComponents,
  buildGoblinEggsEmbed,
  buildGoblinEggsComponents,
  buildDrillFuelEmbed,
  buildDrillFuelComponents,
} = require("./format");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Discord has no way to restrict who can add the app as a personal
// (User Install) app, so it's enforced here instead - but only for that
// install type. Guild installs (the bot properly added to a server) stay
// open to everyone in that server; this allowlist only applies when the
// interaction came through someone's personal install (no guild install
// backing it). Leave empty (the default) to allow anyone via either path.
// Comma-separated Discord user IDs in .env.
const ALLOWED_USER_IDS = (process.env.ALLOWED_USER_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

// Returns true (and sends a rejection reply) if this user isn't allowed to use the bot.
async function isNotAllowed(interaction) {
  const isGuildInstall = Boolean(interaction.authorizingIntegrationOwners.guildId);
  if (isGuildInstall) return false;

  if (ALLOWED_USER_IDS.length === 0 || ALLOWED_USER_IDS.includes(interaction.user.id)) {
    return false;
  }
  await interaction.reply({
    content: "Profile adding is restricted for now, please add the Bot to the Server to use it.",
    flags: MessageFlags.Ephemeral,
  });
  return true;
}

// Simple per-user cooldown so spamming the command/buttons can't flood the
// channel or hammer the bot/Discord's rate limits. Keyed by user ID, holds
// the timestamp they're next allowed to act.
const COOLDOWN_MS = 5_000;
const cooldowns = new Map();

// Periodically drop expired entries so the map doesn't grow forever on a
// long-running, low-resource host.
setInterval(() => {
  const now = Date.now();
  for (const [userId, readyAt] of cooldowns) {
    if (now >= readyAt) cooldowns.delete(userId);
  }
}, 10 * 60 * 1000).unref();

// Returns true (and sends the cooldown reply) if this user should be blocked.
async function isOnCooldown(interaction) {
  const now = Date.now();
  const readyAt = cooldowns.get(interaction.user.id) ?? 0;
  if (now < readyAt) {
    const secondsLeft = ((readyAt - now) / 1000).toFixed(1);
    await interaction.reply({
      content: `Slow down — try again in ${secondsLeft}s.`,
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }
  cooldowns.set(interaction.user.id, now + COOLDOWN_MS);
  return false;
}

function buildEmbed(products, selection, mode) {
  if (mode === "FORGE") {
    return buildForgeResultsEmbed(selection, getForgeRankedResults(products, selection));
  }
  return buildResultsEmbed(selection, getRankedResults(products, selection));
}

// Strips the buttons off a message after 15 minutes without a new
// interaction. Keyed by message ID; each interaction resets the timer.
const BUTTON_TIMEOUT_MS = 15 * 60 * 1000;
const buttonTimers = new Map();

function scheduleButtonRemoval(message) {
  const existing = buttonTimers.get(message.id);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    buttonTimers.delete(message.id);
    try {
      await message.edit({ components: [] });
    } catch {
      // Message may have been deleted, or the bot may have lost access - nothing to do.
    }
  }, BUTTON_TIMEOUT_MS);
  timer.unref();

  buttonTimers.set(message.id, timer);
}

// Shared by both the initial slash command and every button click. Assumes
// the interaction has already been deferred (deferReply/deferUpdate).
async function respond(interaction, selection, mode, ownerId) {
  try {
    const products = await getBazaarProducts();
    const embed = buildEmbed(products, selection, mode);
    const components = [buildComponents(selection, mode, ownerId)];
    await interaction.editReply({ embeds: [embed], components });

    const message = await interaction.fetchReply();
    scheduleButtonRemoval(message);
  } catch (err) {
    console.error(err);
    await interaction.editReply({
      content: `Something went wrong fetching Bazaar data: \`${err.message}\``,
      embeds: [],
      components: [],
    });
  }
}

// /mfgems has no options and no buttons - just a straight ranked embed.
async function respondGems(interaction) {
  try {
    const products = await getBazaarProducts();
    const embed = buildGemsEmbed(getGemRankings(products));
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error(err);
    await interaction.editReply({
      content: `Something went wrong fetching Bazaar data: \`${err.message}\``,
    });
  }
}

// Shared by the initial /drillparts command and its price-mode toggle button.
// Assumes `steps` has already been validated (getForgeSteps succeeded).
async function respondDrillParts(interaction, startKey, endKey, priceMode, steps, ownerId) {
  try {
    const products = await getBazaarProducts();
    const priced = priceMaterials(products, computeRawMaterials(steps), priceMode);

    // From scratch: compare forging against just buying the end part.
    // With a start: compare forging against selling the start part and
    // buying the end part instead. `bins` stays undefined (section hidden
    // entirely) if the AH lookup fails outright.
    let bins;
    try {
      if (startKey) {
        const [startBin, endBin] = await Promise.all([getLowestBin(startKey), getLowestBin(endKey)]);
        bins = { start: startBin, end: endBin };
      } else {
        bins = { start: null, end: await getLowestBin(endKey) };
      }
    } catch (err) {
      console.error("Failed to fetch lowest BIN:", err);
      bins = undefined;
    }

    const embed = buildDrillPartsEmbed(startKey, endKey, priceMode, priced, bins);
    const components = [buildDrillPartsComponents(startKey, endKey, priceMode, ownerId)];
    await interaction.editReply({ embeds: [embed], components });

    const message = await interaction.fetchReply();
    scheduleButtonRemoval(message);
  } catch (err) {
    console.error(err);
    await interaction.editReply({
      content: `Something went wrong fetching Bazaar data: \`${err.message}\``,
      embeds: [],
      components: [],
    });
  }
}

// Shared by the initial /goblineggs command and its price-mode toggle button.
async function respondGoblinEggs(interaction, priceMode, ownerId) {
  try {
    const products = await getBazaarProducts();
    const embed = buildGoblinEggsEmbed(getGoblinEggRankings(products, priceMode), priceMode);
    const components = [buildGoblinEggsComponents(priceMode, ownerId)];
    await interaction.editReply({ embeds: [embed], components });

    const message = await interaction.fetchReply();
    scheduleButtonRemoval(message);
  } catch (err) {
    console.error(err);
    await interaction.editReply({
      content: `Something went wrong fetching Bazaar data: \`${err.message}\``,
      embeds: [],
      components: [],
    });
  }
}

// /drillfuel has no options and no buttons - just a straight top-5 embed.
async function respondDrillFuel(interaction, priceMode, ownerId) {
  try {
    const products = await getBazaarProducts();
    const embed = buildDrillFuelEmbed(getDrillFuelRankings(products, priceMode), priceMode);
    const components = [buildDrillFuelComponents(priceMode, ownerId)];
    await interaction.editReply({ embeds: [embed], components });

    const message = await interaction.fetchReply();
    scheduleButtonRemoval(message);
  } catch (err) {
    console.error(err);
    await interaction.editReply({
      content: `Something went wrong fetching Bazaar data: \`${err.message}\``,
      embeds: [],
      components: [],
    });
  }
}

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// This is a long-running unattended service - a single interaction failing
// (e.g. a race between multiple bot instances briefly running at once, or
// any other unexpected Discord API error) must never take the whole process
// down with it.
client.on("interactionCreate", async (interaction) => {
  try {
    await handleInteraction(interaction);
  } catch (err) {
    console.error("Unhandled interaction error:", err);
  }
});

async function handleInteraction(interaction) {
  if (interaction.isChatInputCommand() && interaction.commandName === "metalprofit") {
    if (await isNotAllowed(interaction)) return;
    if (await isOnCooldown(interaction)) return;

    const selection = interaction.options.getString("material", true);
    const mode = interaction.options.getString("mode") ?? "ENCHANTED";

    await interaction.deferReply();
    await respond(interaction, selection, mode, interaction.user.id);
    return;
  }

  if (interaction.isChatInputCommand() && interaction.commandName === "mfgems") {
    if (await isNotAllowed(interaction)) return;
    if (await isOnCooldown(interaction)) return;

    await interaction.deferReply();
    await respondGems(interaction);
    return;
  }

  if (interaction.isChatInputCommand() && interaction.commandName === "drillparts") {
    if (await isNotAllowed(interaction)) return;
    if (await isOnCooldown(interaction)) return;

    const endKey = interaction.options.getString("part", true);
    const startKey = interaction.options.getString("start");

    const result = getForgeSteps(startKey, endKey);
    if (result.error) {
      await interaction.reply({ content: result.error, flags: MessageFlags.Ephemeral });
      return;
    }
    if (result.alreadyOwned) {
      await interaction.reply({
        content: "You already have that part — there's nothing to forge.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();
    await respondDrillParts(interaction, startKey, endKey, "BUYORDER", result.steps, interaction.user.id);
    return;
  }

  if (interaction.isChatInputCommand() && interaction.commandName === "drillfuel") {
    if (await isNotAllowed(interaction)) return;
    if (await isOnCooldown(interaction)) return;

    await interaction.deferReply();
    await respondDrillFuel(interaction, "INSTANT", interaction.user.id);
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith("df|")) {
    const [, priceMode, ownerId] = interaction.customId.split("|");

    if (interaction.user.id !== ownerId) {
      await interaction.reply({
        content: "You did not run this command, trying to steal huh?",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (await isNotAllowed(interaction)) return;
    if (await isOnCooldown(interaction)) return;

    await interaction.deferUpdate();
    await respondDrillFuel(interaction, priceMode, ownerId);
    return;
  }

  if (interaction.isChatInputCommand() && interaction.commandName === "goblineggs") {
    if (await isNotAllowed(interaction)) return;
    if (await isOnCooldown(interaction)) return;

    await interaction.deferReply();
    await respondGoblinEggs(interaction, "BUYORDER", interaction.user.id);
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith("ge|")) {
    const [, priceMode, ownerId] = interaction.customId.split("|");

    if (interaction.user.id !== ownerId) {
      await interaction.reply({
        content: "You did not run this command, trying to steal huh?",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (await isNotAllowed(interaction)) return;
    if (await isOnCooldown(interaction)) return;

    await interaction.deferUpdate();
    await respondGoblinEggs(interaction, priceMode, ownerId);
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith("dp|")) {
    const [, rawStartKey, endKey, priceMode, ownerId] = interaction.customId.split("|");
    const startKey = rawStartKey === "NONE" ? null : rawStartKey;

    if (interaction.user.id !== ownerId) {
      await interaction.reply({
        content: "You did not run this command, trying to steal huh?",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (await isNotAllowed(interaction)) return;
    if (await isOnCooldown(interaction)) return;

    const result = getForgeSteps(startKey, endKey);
    if (result.error || result.alreadyOwned) {
      // Shouldn't happen - start/end never change via this button - but stay safe.
      await interaction.reply({ content: "Something went wrong reading this button's state.", flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferUpdate();
    await respondDrillParts(interaction, startKey, endKey, priceMode, result.steps, ownerId);
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith("mp|")) {
    const [, selection, mode, ownerId] = interaction.customId.split("|");

    if (interaction.user.id !== ownerId) {
      await interaction.reply({
        content: "You did not run this command, trying to steal huh?",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (await isNotAllowed(interaction)) return;
    if (await isOnCooldown(interaction)) return;

    await interaction.deferUpdate();
    await respond(interaction, selection, mode, ownerId);
  }
}

client.login(process.env.DISCORD_TOKEN);
