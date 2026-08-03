import { generateAIInsights } from '@/data/insightEngine'
import type { AIInsightLocalFilters, AIInsightResult } from '@/data/insightEngine'
import type { AppliedFilters, InsightCube } from '@/data/types'

export type { AIInsightLocalFilters, AIInsightResult }
export type {
  AIInsightAction,
  AIInsightAnomaly,
  AIInsightChange,
  AIInsightEvidence,
  AIInsightItem,
  AIInsightRelationship,
  AIInsightTheme,
  InsightCategory,
  InsightPriority,
  InsightSentiment,
  SourceModule,
} from '@/data/insightEngine'

export const defaultAIInsightLocalFilters: AIInsightLocalFilters = {
  category: 'all',
  priority: 'all',
  confidence: 'all',
  sourceModule: 'all',
  sentiment: 'all',
  affectedEntity: 'all',
  sort: 'priority',
  search: '',
}

export function queryAIInsights(cube: InsightCube, filters: AppliedFilters, localFilters: AIInsightLocalFilters): AIInsightResult {
  return generateAIInsights(cube, filters, localFilters)
}
