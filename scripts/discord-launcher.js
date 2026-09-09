require("dotenv").config();

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  ContainerBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder
} = require("discord.js");

const DISCORD_APPLICATION_ID = "1547077950199828480";
const SCREENER_CHANNEL_ID = "1547082017471070288";
const LAUNCH_CUSTOM_ID = "screener:launch";

if (!process.env.DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN is missing from the environment.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function componentsV2(components, extra = {}) {
  return {
    flags: MessageFlags.IsComponentsV2,
    components,
    ...extra
  };
}

function componentHasCustomId(component, customId) {
  if (!component) {
    return false;
  }

  if (component.customId === customId || component.custom_id === customId) {
    return true;
  }

  const children = component.components || component.data?.components || [];

  return Array.isArray(children) &&
    children.some((child) => componentHasCustomId(child, customId));
}

function messageHasCustomId(message, customId) {
  return (message.components || []).some((component) =>
    componentHasCustomId(component, customId)
  );
}

function buildPublicMessage() {
  const container = new ContainerBuilder()
    .setAccentColor(0x95B87B)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          "## TikTok Shop Screener",
          "-# Browse TikTok Shop categories, seller rankings, and momentum signals from inside Discord."
        ].join("\n")
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(LAUNCH_CUSTOM_ID)
          .setLabel("Open Shop Screener")
          .setStyle(ButtonStyle.Primary)
      )
    );

  return componentsV2([container], {
    allowedMentions: { parse: [] }
  });
}

async function ensurePublicMessage() {
  const channel = await client.channels.fetch(SCREENER_CHANNEL_ID);

  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error("SCREENER_CHANNEL_ID must point to a text channel.");
  }

  const launcherMessage = buildPublicMessage();
  const messages = await channel.messages.fetch({ limit: 50 });
  const existing = messages.find((message) =>
    message.author.id === client.user.id &&
    messageHasCustomId(message, LAUNCH_CUSTOM_ID)
  );

  if (existing) {
    await existing.edit(launcherMessage);
    console.log("Existing TikTok Shop Screener launcher updated.");
    return existing;
  }

  const message = await channel.send(launcherMessage);
  console.log("TikTok Shop Screener launcher created.");
  return message;
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton() || interaction.customId !== LAUNCH_CUSTOM_ID) {
    return;
  }

  try {
    await interaction.launchActivity();
  } catch (error) {
    console.error("TikTok Shop Screener Activity launch failed:", error);
  }
});

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  if (client.application?.id !== DISCORD_APPLICATION_ID) {
    throw new Error(
      `Expected Discord application ${DISCORD_APPLICATION_ID}, got ${client.application?.id || "unknown"}.`
    );
  }

  await ensurePublicMessage();
});

client.login(process.env.DISCORD_TOKEN);
