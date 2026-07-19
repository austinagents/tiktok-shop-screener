import { placeholderCategoryNames } from "./placeholder-data";
import { ecosystemColorFor } from "./ecosystem-colors";
import type { CategoryName } from "./types";

export type AttentionHeatmapCluster = string;

export type AttentionSubCategoryTag = {
  id: string;
  slug: string;
  label: string;
  cluster: AttentionHeatmapCluster;
  category: CategoryName;
  categories: CategoryName[];
  color: string;
};

const attentionTagSlug = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const attentionTag = (
  label: string,
  cluster: AttentionHeatmapCluster,
  categories: CategoryName[]
): AttentionSubCategoryTag => {
  const slug = attentionTagSlug(label);

  return {
    id: `subcat_${slug.replace(/-/g, "_")}`,
    slug,
    label,
    cluster,
    category: categories[0],
    categories,
    color: ecosystemColorFor(categories[0])
  };
};

export const canonicalAttentionSubCategories: AttentionSubCategoryTag[] = Array.from({ length: 9 }, (_, index) =>
  attentionTag(`Subcategory ${index + 1}`, "Category", [placeholderCategoryNames[index % placeholderCategoryNames.length]])
);

export const attentionSubCategoryLabels = canonicalAttentionSubCategories.map((tag) => tag.label);

export function attentionSubCategoryByLabel(label: string) {
  return canonicalAttentionSubCategories.find((tag) => tag.label === label);
}

export function attentionSubCategoryStyle(label: string) {
  const color = attentionSubCategoryByLabel(label)?.color ?? "#64748B";
  return { "--ecosystem-color": color, "--tag-color": color } as Record<string, string>;
}
