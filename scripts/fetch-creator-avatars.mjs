import fs from "node:fs/promises";
import path from "node:path";

const DATA_PATH = path.join(process.cwd(), "data", "pdf-x-creators.json");
const REPORT_PATH = path.join(process.cwd(), "data", "creator-avatar-fetch-report.json");
const BATCH_SIZE = 20;

function handleFor(creator) {
  return (creator.xHandle || creator.handle || "").replace(/^@/, "").trim();
}

async function fetchXProfiles(handles) {
  const url = `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${handles.join(",")}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AppScreener creator avatar importer",
      "Accept": "application/json,text/plain,*/*"
    }
  });
  if (!response.ok) throw new Error(`X syndication returned ${response.status}`);
  const text = await response.text();
  if (!text.trim()) throw new Error("X syndication returned an empty response");
  return JSON.parse(text);
}

const creators = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
const byHandle = new Map(creators.map((creator) => [handleFor(creator).toLowerCase(), creator]));
const handles = [...byHandle.keys()].filter(Boolean);
const report = {
  attemptedAt: new Date().toISOString(),
  source: "x_profile_image_url",
  attemptedHandles: handles.length,
  updated: 0,
  missing: 0,
  failedBatches: [],
  notes: []
};

for (let index = 0; index < handles.length; index += BATCH_SIZE) {
  const batch = handles.slice(index, index + BATCH_SIZE);
  try {
    const profiles = await fetchXProfiles(batch);
    for (const profile of profiles) {
      const screenName = String(profile.screen_name || profile.screenName || "").toLowerCase();
      const creator = byHandle.get(screenName);
      const imageUrl = profile.profile_image_url_https || profile.profile_image_url;
      if (!creator || !imageUrl) {
        report.missing += 1;
        continue;
      }
      creator.avatarUrl = imageUrl.replace("_normal.", "_400x400.");
      creator.avatarSourceType = "x_profile_image";
      creator.avatarSourceUrl = `https://x.com/${screenName}`;
      creator.avatarVerified = true;
      if (!creator.verificationSignals.includes("x_profile_image_verified")) creator.verificationSignals.push("x_profile_image_verified");
      report.updated += 1;
    }
  } catch (error) {
    report.failedBatches.push({ handles: batch, reason: error instanceof Error ? error.message : String(error) });
  }
}

if (!report.updated) {
  report.notes.push("No avatars were updated. X profile metadata was unavailable or blocked from this environment.");
}

await fs.writeFile(DATA_PATH, `${JSON.stringify(creators, null, 2)}\n`);
await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
