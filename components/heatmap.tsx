import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Bot,
  Box,
  BriefcaseBusiness,
  Bug,
  ChartNoAxesCombined,
  CircleDollarSign,
  Code2,
  FileText,
  Globe2,
  Mail,
  Megaphone,
  MousePointer2,
  Pickaxe,
  Search,
  Send,
  Sparkles,
  Tags,
  UserPlus,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { ecosystemColorStyle } from "@/lib/ecosystem-colors";
import { ecosystemTagSlug } from "@/lib/ecosystem-tags";
import { displayCategory } from "@/lib/format";
import type { AttentionSubCategory, Category } from "@/lib/types";
import { MovementBadge } from "./movement-badge";

export function CategoryHeatmap({ categories }: { categories: Category[] }) {
  return (
    <div className="heatmapGrid">
      {categories.map((category) => (
        <Link
          href={`/categories/${category.slug}`}
          className="heatTile"
          key={category.id}
          style={
            {
              "--heat": `${Math.min(category.momentumScore, 90)}%`,
              ...ecosystemColorStyle(category.name),
            } as CSSProperties
          }
        >
          <div className="heatTileTop">
            <span>{displayCategory(category.name)}</span>
            <em>category rotation</em>
          </div>
          <strong>
            {category.momentumScore}
            <small> score</small>
          </strong>
          <div className="heatTileFlow">
            <MovementBadge value={category.growth24h} />
            <small>
              7d <MovementBadge value={category.growth7d} />
            </small>
          </div>
          <div className="heatIntensity">
            <i
              style={{
                width: `${Math.min(
                  100,
                  category.momentumScore + category.growth24h
                )}%`,
              }}
            />
          </div>
          <small>{category.toolsTracked} products tracked</small>
        </Link>
      ))}
    </div>
  );
}

type AttentionHeatmapInteractionMode = "links" | "buttons";

export function AttentionHeatmap({ items, interactionMode = "links", onSelect, activeLabel }: { items: AttentionSubCategory[]; interactionMode?: AttentionHeatmapInteractionMode; onSelect?: (label: string) => void; activeLabel?: string }) {
  void items;

  const renderCluster = (cluster: AttentionClusterConfig) => {
    const clusterStyle = {
      "--cluster-color": cluster.color,
    } as CSSProperties;

    return (
      <section className={`attentionCluster ${cluster.id}`} key={cluster.id} style={clusterStyle} aria-label={cluster.title}>
        <div className="attentionClusterLabel">
          <cluster.icon size={14} />
          <span>{cluster.title}</span>
        </div>
        <div className="attentionClusterBody">
          {cluster.tags.map((tag, index) => renderAttentionNode(tag, `${cluster.id}-${tag.label}-${index}`, interactionMode, onSelect, activeLabel))}
        </div>
      </section>
    );
  };

  return (
    <div className="attentionHeatmapComponent">
      <div className="heatmapCanvasFrame heatmap-container-relative-wrapper" aria-label="Attention heatmap">
        <div className="attentionTaxonomyGrid heatmap-grid-container heatmap-grid-main">
          {attentionClusters.map(renderCluster)}
        </div>
      </div>
    </div>
  );
}

function renderAttentionNode(tag: AttentionTagConfig, key: string, interactionMode: AttentionHeatmapInteractionMode, onSelect?: (label: string) => void, activeLabel?: string) {
  const content = (
    <>
      <tag.icon size={tag.iconSize ?? 14} />
      <span>{tag.label}</span>
    </>
  );

  if (interactionMode === "buttons") {
    return (
      <button
        className={`attentionNode heatmap-tag-button ${tag.size}${activeLabel === tag.label ? " active" : ""}`}
        type="button"
        key={key}
        onClick={() => onSelect?.(tag.label)}
      >
        {content}
      </button>
    );
  }

  return (
    <Link className={`attentionNode heatmap-tag-button ${tag.size}`} href={`/tags/${ecosystemTagSlug(tag.label)}`} key={key}>
      {content}
    </Link>
  );
}

type AttentionTagConfig = {
  label: string;
  icon: LucideIcon;
  size: "large" | "medium" | "small";
  badge?: "High" | "Rising";
  iconSize?: number;
  top: number;
  left: number;
  width: number;
  height: number;
};

type AttentionClusterConfig = {
  id: string;
  title: string;
  color: string;
  icon: LucideIcon;
  top: number;
  left: number;
  width: number;
  height: number;
  tags: AttentionTagConfig[];
};

const attentionClusters: AttentionClusterConfig[] = [
  {
    id: "markets",
    title: "SPORTS & OUTDOORS",
    color: "#64748B",
    icon: ChartNoAxesCombined,
    top: 70,
    left: 0,
    width: 330,
    height: 250,
    tags: [
      { label: "Golf", icon: Bot, size: "large", badge: "High", top: 32, left: 35, width: 260, height: 52 },
      { label: "Pickleball", icon: ChartNoAxesCombined, size: "medium", top: 98, left: 55, width: 220, height: 40 },
      { label: "Fitness", icon: CircleDollarSign, size: "small", top: 150, left: 75, width: 180, height: 40 },
      { label: "Running", icon: Pickaxe, size: "small", top: 202, left: 70, width: 190, height: 40 },
        { label: "Camping", icon: Tags, size: "small", top: 254, left: 70, width: 190, height: 40 },
        { label: "Fishing", icon: Sparkles, size: "small", top: 306, left: 70, width: 190, height: 40 }
    ]
  },
  {
    id: "growth",
    title: "FASHION",
    color: "#64748B",
    icon: Megaphone,
    top: 70,
    left: 370,
    width: 330,
    height: 250,
    tags: [
      { label: "Dresses", icon: Mail, size: "large", badge: "High", top: 32, left: 35, width: 260, height: 52 },
      { label: "Activewear", icon: UserPlus, size: "small", top: 98, left: 55, width: 220, height: 40 },
      { label: "Shoes", icon: Send, size: "small", top: 150, left: 75, width: 180, height: 40 },
      { label: "Jewelry", icon: Globe2, size: "medium", top: 202, left: 70, width: 190, height: 40 },
        { label: "Handbags", icon: Sparkles, size: "small", top: 254, left: 70, width: 190, height: 40 },
        { label: "Menswear", icon: Tags, size: "small", top: 306, left: 70, width: 190, height: 40 }
    ]
  },
  {
    id: "kitchen",
    title: "BEAUTY & CARE",
    color: "#64748B",
    icon: Sparkles,
    top: 362,
    left: 185,
    width: 330,
    height: 250,
    tags: [
      { label: "Skincare", icon: MousePointer2, size: "large", badge: "Rising", top: 24, left: 30, width: 270, height: 52 },
      { label: "Makeup", icon: CircleDollarSign, size: "medium", top: 82, left: 55, width: 220, height: 40 },
      { label: "Haircare", icon: FileText, size: "small", top: 134, left: 75, width: 180, height: 40 },
      { label: "Fragrance", icon: Globe2, size: "small", top: 186, left: 70, width: 190, height: 40 },
        { label: "Bodycare", icon: Box, size: "small", top: 238, left: 70, width: 190, height: 40 },
        { label: "Nails", icon: BriefcaseBusiness, size: "small", top: 290, left: 70, width: 190, height: 40 }
    ]
  },
  {
    id: "builders",
    title: "FOOD & BEVERAGE",
    color: "#64748B",
    icon: Code2,
    top: 575,
    left: 0,
    width: 330,
    height: 250,
    tags: [
      { label: "Energy", icon: Box, size: "large", badge: "High", top: 34, left: 35, width: 260, height: 52 },
      { label: "Snacks", icon: Code2, size: "small", top: 98, left: 55, width: 220, height: 40 },
      { label: "Coffee", icon: Bug, size: "small", top: 150, left: 75, width: 180, height: 40 },
      { label: "Protein", icon: Tags, size: "medium", top: 202, left: 70, width: 190, height: 40 },
        { label: "Hydration", icon: Box, size: "small", top: 254, left: 70, width: 190, height: 40 },
        { label: "Candy", icon: Video, size: "small", top: 306, left: 70, width: 190, height: 40 }
    ]
  },
  {
    id: "ops",
    title: "HOME & LIVING",
    color: "#64748B",
    icon: BriefcaseBusiness,
    top: 575,
    left: 370,
    width: 330,
    height: 250,
    tags: [
      { label: "Kitchen", icon: Search, size: "large", badge: "Rising", top: 34, left: 35, width: 260, height: 52 },
      { label: "Cleaning", icon: Users, size: "small", top: 98, left: 55, width: 220, height: 40 },
      { label: "Storage", icon: Video, size: "small", top: 150, left: 75, width: 180, height: 40 },
      { label: "Decor", icon: BriefcaseBusiness, size: "medium", top: 202, left: 70, width: 190, height: 40 },
        { label: "Bedding", icon: Pickaxe, size: "small", top: 254, left: 70, width: 190, height: 40 },
        { label: "Bathroom", icon: Tags, size: "small", top: 306, left: 70, width: 190, height: 40 }
    ]
  },
  {
    id: "beauty-tools",
    title: "PETS & HOBBIES",
    color: "#64748B",
    icon: Sparkles,
    top: 575,
    left: 370,
    width: 330,
    height: 250,
    tags: [
      { label: "Dogs", icon: Search, size: "large", badge: "Rising", top: 34, left: 35, width: 260, height: 52 },
      { label: "Cats", icon: Tags, size: "small", top: 98, left: 55, width: 220, height: 40 },
      { label: "Toys", icon: Mail, size: "small", top: 150, left: 75, width: 180, height: 40 },
      { label: "Collectibles", icon: UserPlus, size: "medium", top: 202, left: 70, width: 190, height: 40 },
        { label: "Cards", icon: Sparkles, size: "small", top: 254, left: 70, width: 190, height: 40 },
        { label: "Crafts", icon: Search, size: "small", top: 306, left: 70, width: 190, height: 40 }
    ]
  }
];
