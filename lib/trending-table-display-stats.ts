export type TrendingTableDisplayStats = {
  creatorCount: number;
  sourceCount: number;
  workflowCount: number;
};

export const emptyTrendingTableDisplayStats: TrendingTableDisplayStats = {
  creatorCount: 0,
  sourceCount: 0,
  workflowCount: 0
};

export const trendingTableDisplayStatsBySlug: Record<string, TrendingTableDisplayStats> = {};
export const thirtyDayTrendingTableDisplayStatsBySlug: Record<string, TrendingTableDisplayStats> = {};
export const allTimeTrendingTableDisplayStatsBySlug: Record<string, TrendingTableDisplayStats> = {};
