require("dotenv").config();

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  ContainerBuilder,
  Events,
  EmbedBuilder,
  GatewayIntentBits,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder
} = require("discord.js");

const DISCORD_APPLICATION_ID = "1547077950199828480";
const SCREENER_CHANNEL_ID = "1547082017471070288";
const LAUNCH_CUSTOM_ID = "screener:launch";
const MODERATED_CHANNEL_ID = "1568479851889954836";
const MODERATION_LOG_CHANNEL_ID = "1573591477420957829";
const LINK_EXEMPT_USER_ID = "1499515682964902070";
const LINK_PATTERN = /(?:https?:\/\/|www\.)\S+|\b(?:[a-z0-9-]+\.)+[a-z]{2,24}(?:[\/?#]\S*)?/i;

if (!process.env.DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN is missing from the environment.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
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


// Quiet moderation: only the designated channel; never reply or send a DM.
async function silentlyRemoveLinks(message) {
  if (!message || message.channelId !== MODERATED_CHANNEL_ID || message.author?.bot || message.author?.id === LINK_EXEMPT_USER_ID) {
    return;
  }

  // Only links in message text are prohibited. Images and other uploads are allowed.
  if (!LINK_PATTERN.test(message.content || "")) {
    return;
  }

  const reason = "Link";

  try {
    await message.delete();
  } catch (error) {
    if (error.code !== 10008) {
      console.error("Screener channel moderation delete failed:", error);
    }
    return;
  }

  // Log only successful deletions; no public response or user notification.
  try {
    const logChannel = await client.channels.fetch(MODERATION_LOG_CHANNEL_ID);
    if (!logChannel?.isTextBased() || typeof logChannel.send !== "function") {
      throw new Error("Moderation log channel is not a writable text channel.");
    }

    const originalContent = message.content || "";
    const attachmentList = [...(message.attachments?.values() || [])]
      .map((file) => file.name || file.url || "Unnamed attachment")
      .join("\n");
    const embed = new EmbedBuilder()
      .setColor(0xc75b5b)
      .setTitle("Message removed")
      .addFields(
        { name: "User", value: (message.author?.username || "Unknown") + " (ID: " + (message.author?.id || "unknown") + ")" },
        { name: "Channel", value: "<#" + MODERATED_CHANNEL_ID + ">" },
        { name: "Reason", value: reason },
        { name: "Message", value: originalContent.slice(0, 1024) || "(No text)" }
      )
      .setTimestamp(new Date());
    if (attachmentList) {
      embed.addFields({ name: "Attachments", value: attachmentList.slice(0, 1024) });
    }
    if (originalContent.length > 1024) {
      embed.addFields({ name: "Note", value: "Message truncated to 1,024 characters." });
    }
    await logChannel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (error) {
    console.error("Screener moderation admin log failed:", error);
  }
}

client.on(Events.MessageCreate, silentlyRemoveLinks);
client.on(Events.MessageUpdate, (_oldMessage, newMessage) => {
  void silentlyRemoveLinks(newMessage);
});

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
