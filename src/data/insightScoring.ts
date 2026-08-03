import { INSIGHT_THRESHOLDS } from '@/config/insightThresholds'
import type { AIInsightItem, InsightPriority } from '@/data/insightEngine'

export const safeDivide = (value: number, total: number) => (total ? value / total : 0)

export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))

export const relativeDelta = (current: number, previous: number) => {
  if (!previous) return current ? 1 : 0
  return (current - previous) / Math.abs(previous)
}

export const confidenceLabel = (confidence: number) => {
  if (confidence >= INSIGHT_THRESHOLDS.highEvidence) return 'high'
  if (confidence >= INSIGHT_THRESHOLDS.mediumEvidence) return 'medium'
  return 'low'
}

export function confidenceScore({
  sampleSize,
  magnitude,
  consistency = 0.6,
  evidenceCount,
  missingDataPenalty = 0,
}: {
  sampleSize: number
  magnitude: number
  consistency?: number
  evidenceCount: number
  missingDataPenalty?: number
}) {
  const sampleSizeScore = clamp(sampleSize / 2_000)
  const magnitudeScore = clamp(Math.abs(magnitude) / 0.35)
  const consistencyScore = clamp(consistency)
  const evidenceCountScore = clamp(evidenceCount / 4)
  return clamp(
    sampleSizeScore * 0.3 +
      magnitudeScore * 0.25 +
      consistencyScore * 0.25 +
      evidenceCountScore * 0.2 -
      missingDataPenalty,
  )
}

export function priorityScore({
  magnitude,
  affectedShare,
  businessImpact,
  confidence,
}: {
  magnitude: number
  affectedShare: number
  businessImpact: number
  confidence: number
}) {
  return clamp(
    clamp(Math.abs(magnitude) / 0.45) * 0.35 +
      clamp(affectedShare) * 0.25 +
      clamp(businessImpact) * 0.25 +
      clamp(confidence) * 0.15,
  ) * 100
}

export function priorityLabel(score: number): InsightPriority {
  if (score >= INSIGHT_THRESHOLDS.priority.critical) return 'critical'
  if (score >= INSIGHT_THRESHOLDS.priority.high) return 'high'
  if (score >= INSIGHT_THRESHOLDS.priority.medium) return 'medium'
  return 'low'
}

export function stableInsightSort(a: AIInsightItem, b: AIInsightItem) {
  const priority = b.priorityScore - a.priorityScore
  if (Math.abs(priority) > 0.001) return priority
  const confidence = b.confidence - a.confidence
  if (Math.abs(confidence) > 0.001) return confidence
  return a.id.localeCompare(b.id, 'id-ID')
}

export function zScore(value: number, values: number[]) {
  if (values.length < 3) return 0
  const mean = values.reduce((sum, item) => sum + item, 0) / values.length
  const variance = values.reduce((sum, item) => sum + (item - mean) ** 2, 0) / values.length
  const sd = Math.sqrt(variance)
  return sd ? (value - mean) / sd : 0
}

export function pearson(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length)
  if (length < 3) return 0
  const xs = left.slice(0, length)
  const ys = right.slice(0, length)
  const xMean = xs.reduce((sum, item) => sum + item, 0) / length
  const yMean = ys.reduce((sum, item) => sum + item, 0) / length
  const numerator = xs.reduce((sum, item, index) => sum + (item - xMean) * ((ys[index] ?? 0) - yMean), 0)
  const xDen = Math.sqrt(xs.reduce((sum, item) => sum + (item - xMean) ** 2, 0))
  const yDen = Math.sqrt(ys.reduce((sum, item) => sum + (item - yMean) ** 2, 0))
  return xDen && yDen ? numerator / (xDen * yDen) : 0
}
