require("dotenv").config();
const {
  REST,
  Routes,
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
} = require("discord.js");
const { PARTS, PART_ORDER } = require("./drillparts");

const DRILL_PART_CHOICES = PART_ORDER.map((key) => ({ name: PARTS[key].label, value: key }));

const commands = [
  new SlashCommandBuilder()
    .setName("metalprofit")
    .setDescription("Find the most profitable way to use your Enchanted Umber/Tungsten.")
    // Allow both: added to a server (GuildInstall) and added to someone's
    // own account (UserInstall) - usable in DMs/any channel for the latter.
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .addStringOption((option) =>
      option
        .setName("material")
        .setDescription("Which metal are you mining?")
        .setRequired(true)
        .addChoices(
          { name: "Tungsten", value: "TUNGSTEN" },
          { name: "Umber", value: "UMBER" },
          { name: "Hybrid", value: "HYBRID" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("What kind of profit do you want to see?")
        .setRequired(false)
        .addChoices(
          { name: "Profit per Enchanted", value: "ENCHANTED" },
          { name: "Profit via forgetime", value: "FORGE" },
        ),
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("mfgems")
    .setDescription("Ranks Amber/Jade/Sapphire/Amethyst gems by best value: Fine vs. Flawless.")
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .toJSON(),
  new SlashCommandBuilder()
    .setName("drillparts")
    .setDescription("Calculates the bazaar cost to forge a drill part.")
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .addStringOption((option) =>
      option
        .setName("part")
        .setDescription("The part you want to forge")
        .setRequired(true)
        .addChoices(...DRILL_PART_CHOICES),
    )
    .addStringOption((option) =>
      option
        .setName("start")
        .setDescription("A part you already own to start from (default: from scratch)")
        .setRequired(false)
        .addChoices(...DRILL_PART_CHOICES),
    )
    .toJSON(),
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`Registered ${commands.length} guild command(s) for guild ${guildId}.`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(`Registered ${commands.length} global command(s). This can take up to an hour to propagate.`);
    }
  } catch (err) {
    console.error("Failed to register commands:", err);
    process.exit(1);
  }
})();
