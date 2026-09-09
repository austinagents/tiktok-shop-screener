"use client";

import { DiscordSDK, RPCCloseCodes } from "@discord/embedded-app-sdk";
import type { ReactNode } from "react";
import { useEffect } from "react";

const DISCORD_APPLICATION_ID = "1547077950199828480";

function isDiscordActivityLaunch() {
  const params = new URLSearchParams(window.location.search);
  const platform = params.get("platform");

  return (
    Boolean(params.get("frame_id")) &&
    Boolean(params.get("instance_id")) &&
    (platform === "desktop" || platform === "mobile")
  );
}

export function DiscordActivityProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!isDiscordActivityLaunch()) {
      return;
    }

    const discordSdk = new DiscordSDK(DISCORD_APPLICATION_ID, {
      disableConsoleLogOverride: true
    });

    discordSdk.ready().catch((error) => {
      console.error("Discord Activity initialization failed", error);
    });

    return () => {
      discordSdk.close(RPCCloseCodes.CLOSE_NORMAL, "Activity closed");
    };
  }, []);

  return children;
}
