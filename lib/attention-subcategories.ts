export type AttentionSubCategoryTag = {
  id: string;
  slug: string;
  label: string;
  color: string;
};

export const canonicalAttentionSubCategories: AttentionSubCategoryTag[] = [
  { id: "subcat_websites", slug: "websites", label: "Websites", color: "#38BDF8" },
  { id: "subcat_mass_email", slug: "mass-email", label: "Mass Email", color: "#34D399" },
  { id: "subcat_prediction_markets", slug: "prediction-markets", label: "Prediction Markets", color: "#A3E635" },
  { id: "subcat_tiktok_clips", slug: "tiktok-clips", label: "TikTok Clips", color: "#FB7185" },
  { id: "subcat_lead_generation", slug: "lead-generation", label: "Lead Generation", color: "#2DD4BF" },
  { id: "subcat_animation", slug: "animation", label: "Animation", color: "#F472B6" },
  { id: "subcat_thumbnails", slug: "thumbnails", label: "Thumbnails", color: "#FBBF24" },
  { id: "subcat_trading_bots", slug: "trading-bots", label: "Trading Bots", color: "#22C55E" },
  { id: "subcat_gta_6", slug: "gta-6", label: "GTA 6", color: "#C084FC" },
  { id: "subcat_whale_tracking", slug: "whale-tracking", label: "Whale Tracking", color: "#14B8A6" },
  { id: "subcat_cold_outreach", slug: "cold-outreach", label: "Cold Outreach", color: "#059669" },
  { id: "subcat_market_analysis", slug: "market-analysis", label: "Market Analysis", color: "#65A30D" },
  { id: "subcat_research_agents", slug: "research-agents", label: "Research Agents", color: "#9333EA" },
  { id: "subcat_debugging", slug: "debugging", label: "Debugging", color: "#06B6D4" },
  { id: "subcat_3d_assets", slug: "3d-assets", label: "3D Assets", color: "#0EA5E9" },
  { id: "subcat_vibe_coding", slug: "vibe-coding", label: "Vibe Coding", color: "#60A5FA" },
  { id: "subcat_ai_employees", slug: "ai-employees", label: "AI Employees", color: "#8B5CF6" },
  { id: "subcat_document_analysis", slug: "document-analysis", label: "Document Analysis", color: "#818CF8" },
  { id: "subcat_video_editing", slug: "video-editing", label: "Video Editing", color: "#16A34A" },
  { id: "subcat_web_scraping", slug: "web-scraping", label: "Web Scraping", color: "#64748B" },
  { id: "subcat_customer_support", slug: "customer-support", label: "Customer Support", color: "#0284C7" }
];

export const attentionSubCategoryLabels = canonicalAttentionSubCategories.map((tag) => tag.label);

export function attentionSubCategoryByLabel(label: string) {
  return canonicalAttentionSubCategories.find((tag) => tag.label === label);
}

export function attentionSubCategoryStyle(label: string) {
  const color = attentionSubCategoryByLabel(label)?.color ?? "#64748B";
  return { "--ecosystem-color": color, "--tag-color": color } as Record<string, string>;
}
