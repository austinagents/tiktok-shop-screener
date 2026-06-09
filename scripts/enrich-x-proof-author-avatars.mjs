#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fetchAuthorAvatar, normalizeHandle } from "./lib/x-avatar-lookup.mjs";

for (const fileName of [".env.sources", ".env.local", ".env"]) {
  if (!existsSync(fileName)) continue;
  for (const line of readFileSync(fileName, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

const apiKey = process.env.TWITTERAPI_IO_API_KEY || process.env.TWITTERAPI_API_KEY || process.env.TWITTER_API_IO_KEY || process.env.TWITTERAPIIO_API_KEY || "";
if (!apiKey) throw new Error("TWITTERAPI_IO_API_KEY missing");

const sourcesPath = "data/x-proof-sources-v2-all.json";
const qualityPath = "data/x-proof-quality-v3-clean.json";
const reportPath = "data/x-proof-author-avatar-enrichment-v1.csv";
const delayMs = Number(process.env.TWITTERAPI_DELAY_MS || "350");

const sources = JSON.parse(readFileSync(sourcesPath, "utf8"));
const quality = JSON.parse(readFileSync(qualityPath, "utf8"));
const eligibleSlugs = new Set((quality.records || []).filter((record) => Number(record.useful_count || 0) >= 3).map((record) => record.slug));
const displayedUrlsBySlug = new Map((quality.records || []).map((record) => [
  record.slug,
  new Set(String(record.best_3_tweet_urls || "").split("|").map((url) => url.trim()).filter(Boolean))
]));

const displayedTweets = [];
for (const record of sources.records || []) {
  if (!eligibleSlugs.has(record.slug)) continue;
  const displayedUrls = displayedUrlsBySlug.get(record.slug) || new Set();
  for (const tweet of record.top_tweets || []) {
    if (!tweet?.url || !displayedUrls.has(tweet.url)) continue;
    displayedTweets.push({ record, tweet });
  }
}

const authors = [...new Set(displayedTweets.map(({ tweet }) => normalizeHandle(tweet.author)).filter(Boolean))];
const avatarByAuthor = new Map();
const errors = [];

for (const [index, author] of authors.entries()) {
  console.log(`[${index + 1}/${authors.length}] @${author}`);
  try {
    const avatar = await fetchAuthorAvatar(author, { apiKey, userAgent: "AppScreener X Proof Avatar Enrichment" });
    if (avatar) avatarByAuthor.set(author, avatar);
  } catch (error) {
    errors.push({ author, error: error.message });
  }
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

let enriched = 0;
let fallback = 0;

for (const { tweet } of displayedTweets) {
  const author = normalizeHandle(tweet.author);
  tweet.authorHandle = author ? `@${author}` : tweet.authorHandle || "";
  tweet.authorName = tweet.authorName || "";
  const avatar = avatarByAuthor.get(author);
  if (avatar) {
    tweet.authorProfileImageUrl = avatar;
    enriched += 1;
  } else {
    fallback += 1;
  }
}

writeFileSync(sourcesPath, `${JSON.stringify(sources, null, 2)}\n`);
writeFileSync(reportPath, [
  "metric,value",
  `x_proof_items_checked,${displayedTweets.length}`,
  `x_proof_items_enriched,${enriched}`,
  `x_proof_items_fallback,${fallback}`,
  `unique_authors_checked,${authors.length}`,
  `author_lookup_errors,${errors.length}`,
  ...errors.map((error) => `"error:${error.author}","${error.error.replace(/"/g, '""')}"`)
].join("\n") + "\n");

console.log(JSON.stringify({
  checked: displayedTweets.length,
  enriched,
  fallback,
  uniqueAuthors: authors.length,
  errors: errors.length,
  reportPath
}, null, 2));
