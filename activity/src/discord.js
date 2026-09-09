import { DiscordSDK } from "@discord/embedded-app-sdk";

const DISCORD_APPLICATION_ID = "1547077950199828480";

let discordSdk = null;

export function isDiscordActivity() {
  const params = new URLSearchParams(window.location.search);

  return Boolean(
    params.get("frame_id") ||
    params.get("instance_id")
  );
}

export async function initializeDiscord() {
  if (!isDiscordActivity()) {
    return null;
  }

  discordSdk = new DiscordSDK(DISCORD_APPLICATION_ID);

  await discordSdk.ready();

  console.log("Discord Activity SDK ready");

  return discordSdk;
}
