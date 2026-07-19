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

export function AttentionHeatmap({ items }: { items: AttentionSubCategory[] }) {
  void items;
  const centerpiece = attentionClusters.find((cluster) => cluster.id === "center");
  const topLeft = attentionClusters.find((cluster) => cluster.id === "markets");
  const topRight = attentionClusters.find((cluster) => cluster.id === "growth");
  const bottomLeft = attentionClusters.find((cluster) => cluster.id === "builders");
  const bottomRight = attentionClusters.find((cluster) => cluster.id === "ops");

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
          {cluster.tags.map((tag, index) => (
            <Link className={`attentionNode heatmap-tag-button ${tag.size}`} href={`/tags/${ecosystemTagSlug(tag.label)}`} key={`${cluster.id}-${tag.label}-${index}`}>
              <tag.icon size={tag.iconSize ?? 14} />
              <span>{tag.label}</span>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="attentionHeatmapComponent">
      <div className="heatmapCanvasFrame heatmap-container-relative-wrapper" aria-label="Attention heatmap">
        <div className="attentionTaxonomyGrid heatmap-grid-container heatmap-grid-main">
          {topLeft ? renderCluster(topLeft) : null}
          {topRight ? renderCluster(topRight) : null}
          {bottomLeft ? renderCluster(bottomLeft) : null}
          {bottomRight ? renderCluster(bottomRight) : null}
        </div>

        {centerpiece ? (
          <div className="attentionCenterpiece centerpiece-overlay heatmap-centerpiece-overlay">
            <section className={`attentionCluster ${centerpiece.id}`} style={{ "--cluster-color": centerpiece.color } as CSSProperties} aria-label={centerpiece.title}>
              <div className="attentionClusterLabel">
                <centerpiece.icon size={14} />
                <span>{centerpiece.title}</span>
              </div>
              <div className="attentionClusterBody">
                {centerpiece.tags.filter((tag) => tag.label !== "TikTok Clips").map((tag, index) => (
                  <Link className={`attentionNode heatmap-tag-button ${tag.size}`} href={`/tags/${ecosystemTagSlug(tag.label)}`} key={`${centerpiece.id}-${tag.label}-${index}`}>
                    <tag.icon size={tag.iconSize ?? 14} />
                    <span>{tag.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
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
    title: "Category",
    color: "#64748B",
    icon: ChartNoAxesCombined,
    top: 70,
    left: 0,
    width: 330,
    height: 250,
    tags: [
      { label: "Subcategory 1", icon: Bot, size: "large", badge: "High", top: 32, left: 35, width: 260, height: 52 },
      { label: "Subcategory 2", icon: ChartNoAxesCombined, size: "medium", top: 98, left: 55, width: 220, height: 40 },
      { label: "—", icon: CircleDollarSign, size: "small", top: 150, left: 75, width: 180, height: 40 },
      { label: "—", icon: Pickaxe, size: "small", top: 202, left: 70, width: 190, height: 40 }
    ]
  },
  {
    id: "growth",
    title: "Category",
    color: "#64748B",
    icon: Megaphone,
    top: 70,
    left: 370,
    width: 330,
    height: 250,
    tags: [
      { label: "Subcategory 3", icon: Mail, size: "large", badge: "High", top: 32, left: 35, width: 260, height: 52 },
      { label: "Subcategory 4", icon: UserPlus, size: "small", top: 98, left: 55, width: 220, height: 40 },
      { label: "—", icon: Send, size: "small", top: 150, left: 75, width: 180, height: 40 },
      { label: "—", icon: Globe2, size: "medium", top: 202, left: 70, width: 190, height: 40 }
    ]
  },
  {
    id: "center",
    title: "Category",
    color: "#64748B",
    icon: Sparkles,
    top: 362,
    left: 185,
    width: 330,
    height: 150,
    tags: [
      { label: "Subcategory 5", icon: MousePointer2, size: "large", badge: "Rising", top: 24, left: 30, width: 270, height: 52 }
    ]
  },
  {
    id: "builders",
    title: "Category",
    color: "#64748B",
    icon: Code2,
    top: 575,
    left: 0,
    width: 330,
    height: 250,
    tags: [
      { label: "Subcategory 6", icon: Box, size: "large", badge: "High", top: 34, left: 35, width: 260, height: 52 },
      { label: "Subcategory 7", icon: Code2, size: "small", top: 98, left: 55, width: 220, height: 40 },
      { label: "—", icon: Bug, size: "small", top: 150, left: 75, width: 180, height: 40 },
      { label: "—", icon: Tags, size: "medium", top: 202, left: 70, width: 190, height: 40 }
    ]
  },
  {
    id: "ops",
    title: "Category",
    color: "#64748B",
    icon: BriefcaseBusiness,
    top: 575,
    left: 370,
    width: 330,
    height: 250,
    tags: [
      { label: "Subcategory 8", icon: Search, size: "large", badge: "Rising", top: 34, left: 35, width: 260, height: 52 },
      { label: "Subcategory 9", icon: Users, size: "small", top: 98, left: 55, width: 220, height: 40 },
      { label: "—", icon: Video, size: "small", top: 150, left: 75, width: 180, height: 40 },
      { label: "—", icon: BriefcaseBusiness, size: "medium", top: 202, left: 70, width: 190, height: 40 }
    ]
  }
];
