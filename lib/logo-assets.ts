export type LogoSource = "website-icon" | "apple-touch-icon" | "favicon" | "clearbit" | "google-favicon" | "local" | "generated-fallback";

export type LogoAsset = {
  officialLogoUrl: string;
  faviconUrl: string;
  logoSource: LogoSource;
};

export const logoAssets: Record<string, LogoAsset> = {};
