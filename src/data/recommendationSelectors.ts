import { quarterLabel, quarterOf } from '@/data/cube'
import type { AppliedFilters } from '@/data/types'

export type RecommendationCategory =
  | 'customer-retention'
  | 'customer-experience'
  | 'product'
  | 'pricing-promotion'
  | 'loyalty'
  | 'marketing-efficiency'
  | 'campaign-optimization'
  | 'outlet-operations'
  | 'inventory-demand'
  | 'revenue-growth'
  | 'digital-experience'
  | 'measurement-tracking'
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low'
export type RecommendationStatus = 'new' | 'review' | 'planned' | 'in-progress' | 'completed' | 'dismissed' | 'blocked'
export type RecommendationEffort = 'low' | 'medium' | 'high'
export type RecommendationImpact = 'low' | 'medium' | 'high'

export interface RecommendationEvidence {
  id: string
  label: string
  formattedValue: string
  rawValue?: number
  sourceModule: string
  sourceMetric?: string
  period?: string
  entityType?: string
  entityId?: string
  entityLabel?: string
}

export interface RecommendationActionStep {
  id: string
  order: number
  label: string
  description?: string
  owner?: string
}

export interface RecommendationItem {
  id: string
  category: RecommendationCategory
  title: string
  summary: string
  problemOrOpportunity: string
  action: string
  actionSteps: RecommendationActionStep[]
  target: { entityType: string; entityId?: string; entityLabel: string; affectedCount?: number }
  evidence: RecommendationEvidence[]
  sourceInsightIds: string[]
  sourceModules: string[]
  owner: string
  priority: RecommendationPriority
  impact: RecommendationImpact
  effort: RecommendationEffort
  urgencyScore: number
  confidenceScore: number
  confidenceLabel: 'high' | 'medium' | 'low'
  recommendationScore: number
  estimatedImpact?: { metric: string; direction: 'increase' | 'decrease' | 'protect'; rangeLow?: number; rangeHigh?: number; unit?: string; basis: string }
  dependencyIds?: string[]
  blocker?: string
  riskNote?: string
  limitationNote: string
  route?: string
  queryParams?: Record<string, string>
  status: RecommendationStatus
  createdForPeriod: string
  createdAt?: string
  updatedAt?: string
  dimensions: { month: number; quarter: string; outlet: number; outletId?: string; city?: string; region?: string; gender: number; age: number }
  conflictIds?: string[]
  scoreFormula: string
  confidenceFormula: string
  impactBasis: string
}

export interface RecommendationJson {
  meta: {
    generatedAt: string
    engineVersion: string
    decisionSupportNote: string
    scoreFormula: string
    confidenceFormula: string
    deduplicationMethod: string
    conflictMethod: string
  }
  dims: {
    months: string[]
    outlets: { id: string; name: string; city: string; region: string; type: string }[]
    genders: string[]
    ageBands: string[]
    categories: RecommendationCategory[]
    categoryLabels: Record<string, string>
    owners: string[]
  }
  recommendations: RecommendationItem[]
  conflicts: Array<{ id: string; entity: string; primaryRecommendationId: string; recommendationIds: string[]; reason: string }>
  dependencies: Array<{ sourceRecommendationId: string; targetRecommendationId: string; relation: 'depends-on' | 'blocks' | 'related' }>
  risks: Array<{ id: string; module: string; issueType: string; target: string; reason: string }>
  unaddressedRisks: Array<{ id: string; module: string; issueType: string; target: string; reason: string; reasonRecommendationMissing: string }>
  coverage: { eligibleRisks: number; risksWithRecommendation: number; actionCoverage: number }
}

export interface RecommendationFilters {
  category: RecommendationCategory | 'all'
  priority: RecommendationPriority | 'all'
  owner: string
  status: RecommendationStatus | 'all'
  impact: RecommendationImpact | 'all'
  effort: RecommendationEffort | 'all'
  confidence: 'high' | 'medium' | 'low' | 'all'
  sourceModule: string
  entityType: string
  blocked: 'all' | 'blocked' | 'not-blocked'
  conflicted: 'all' | 'conflicted' | 'not-conflicted'
  sortBy: 'score' | 'priority' | 'impact' | 'confidence' | 'effort' | 'latest'
}

export interface RecommendationSummary {
  totalRecommendations: number
  criticalCount: number
  highCount: number
  opportunityCount: number
  riskMitigationCount: number
  estimatedHighImpactCount: number
  blockedCount: number
  averageConfidence: number
  topCategory: string
  topOwner: string
  actionCoverage: number
  unaddressedRiskCount: number
}

export interface RecommendationResult {
  periodLabel: string
  filterLabel: string
  engineLabel: string
  lastGenerated: string
  summary: RecommendationSummary
  executiveRecommendations: RecommendationItem[]
  recommendations: RecommendationItem[]
  categories: Array<{ category: RecommendationCategory; label: string; recommendationCount: number; criticalCount: number; highImpactCount: number; averageConfidence: number; topOwner: string }>
  owners: Array<{ owner: string; recommendationCount: number; criticalCount: number; estimatedEffort: number; blockedCount: number }>
  impactEffortMatrix: Array<{ recommendationId: string; title: string; impactScore: number; effortScore: number; priority: RecommendationPriority; category: RecommendationCategory; score: number }>
  dependencies: RecommendationJson['dependencies']
  conflicts: RecommendationJson['conflicts']
  insights: string[]
  unaddressedRisks: RecommendationJson['unaddressedRisks']
  coverage: RecommendationJson['coverage']
  availableCategories: RecommendationCategory[]
  availableOwners: string[]
  availableSourceModules: string[]
  availableEntityTypes: string[]
  localFilters: RecommendationFilters
  methodology: string[]
}

export const defaultRecommendationFilters: RecommendationFilters = {
  category: 'all',
  priority: 'all',
  owner: 'all',
  status: 'all',
  impact: 'all',
  effort: 'all',
  confidence: 'all',
  sourceModule: 'all',
  entityType: 'all',
  blocked: 'all',
  conflicted: 'all',
  sortBy: 'score',
}

const priorityOrder: Record<RecommendationPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const impactScore: Record<RecommendationImpact, number> = { low: 1, medium: 2, high: 3 }
const effortScore: Record<RecommendationEffort, number> = { low: 1, medium: 2, high: 3 }
const safeDivide = (value: number, total: number) => (total ? value / total : 0)

function matchesGlobal(payload: RecommendationJson, filters: AppliedFilters, item: RecommendationItem) {
  const dims = item.dimensions
  if (filters.quarter) {
    if (dims.quarter !== 'all' && dims.quarter !== filters.quarter) return false
    if (dims.month >= 0 && quarterOf(payload.dims.months[dims.month] ?? '') !== filters.quarter) return false
  }
  if (filters.outlet && dims.outletId && dims.outletId !== filters.outlet) return false
  if (filters.city && dims.city && dims.city !== filters.city) return false
  if (filters.region && dims.region && dims.region !== filters.region) return false
  if (filters.gender && dims.gender >= 0 && payload.dims.genders[dims.gender] !== filters.gender) return false
  if (filters.ageBand && dims.age >= 0 && payload.dims.ageBands[dims.age] !== filters.ageBand) return false
  return true
}

function matchesLocal(item: RecommendationItem, local: RecommendationFilters) {
  if (local.category !== 'all' && item.category !== local.category) return false
  if (local.priority !== 'all' && item.priority !== local.priority) return false
  if (local.owner !== 'all' && item.owner !== local.owner) return false
  if (local.status !== 'all' && item.status !== local.status) return false
  if (local.impact !== 'all' && item.impact !== local.impact) return false
  if (local.effort !== 'all' && item.effort !== local.effort) return false
  if (local.confidence !== 'all' && item.confidenceLabel !== local.confidence) return false
  if (local.sourceModule !== 'all' && !item.sourceModules.includes(local.sourceModule)) return false
  if (local.entityType !== 'all' && item.target.entityType !== local.entityType) return false
  if (local.blocked === 'blocked' && item.status !== 'blocked') return false
  if (local.blocked === 'not-blocked' && item.status === 'blocked') return false
  if (local.conflicted === 'conflicted' && !item.conflictIds?.length) return false
  if (local.conflicted === 'not-conflicted' && item.conflictIds?.length) return false
  return true
}

function sortItems(items: RecommendationItem[], sortBy: RecommendationFilters['sortBy']) {
  return [...items].sort((a, b) => {
    if (sortBy === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority] || b.recommendationScore - a.recommendationScore || a.id.localeCompare(b.id)
    if (sortBy === 'impact') return impactScore[b.impact] - impactScore[a.impact] || b.recommendationScore - a.recommendationScore || a.id.localeCompare(b.id)
    if (sortBy === 'confidence') return b.confidenceScore - a.confidenceScore || b.recommendationScore - a.recommendationScore || a.id.localeCompare(b.id)
    if (sortBy === 'effort') return effortScore[a.effort] - effortScore[b.effort] || b.recommendationScore - a.recommendationScore || a.id.localeCompare(b.id)
    if (sortBy === 'latest') return (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || a.id.localeCompare(b.id)
    return priorityOrder[a.priority] - priorityOrder[b.priority] || b.recommendationScore - a.recommendationScore || b.confidenceScore - a.confidenceScore || a.id.localeCompare(b.id)
  })
}

function summary(items: RecommendationItem[], payload: RecommendationJson): RecommendationSummary {
  const categoryCounts = new Map<string, number>()
  const ownerCounts = new Map<string, number>()
  items.forEach((item) => {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1)
    ownerCounts.set(item.owner, (ownerCounts.get(item.owner) ?? 0) + 1)
  })
  const topCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-'
  const topOwner = [...ownerCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-'
  return {
    totalRecommendations: items.length,
    criticalCount: items.filter((item) => item.priority === 'critical').length,
    highCount: items.filter((item) => item.priority === 'high').length,
    opportunityCount: items.filter((item) => item.estimatedImpact?.direction === 'increase').length,
    riskMitigationCount: items.filter((item) => item.estimatedImpact?.direction === 'protect' || item.priority === 'critical').length,
    estimatedHighImpactCount: items.filter((item) => item.impact === 'high').length,
    blockedCount: items.filter((item) => item.status === 'blocked').length,
    averageConfidence: safeDivide(items.reduce((sum, item) => sum + item.confidenceScore, 0), items.length),
    topCategory: payload.dims.categoryLabels[topCategory] ?? topCategory,
    topOwner,
    actionCoverage: payload.coverage.actionCoverage,
    unaddressedRiskCount: payload.unaddressedRisks.length,
  }
}

function groupCategories(items: RecommendationItem[], payload: RecommendationJson) {
  return payload.dims.categories.map((category) => {
    const rows = items.filter((item) => item.category === category)
    const owner = [...new Set(rows.map((row) => row.owner))].sort((a, b) => rows.filter((row) => row.owner === b).length - rows.filter((row) => row.owner === a).length)[0] ?? '-'
    return {
      category,
      label: payload.dims.categoryLabels[category] ?? category,
      recommendationCount: rows.length,
      criticalCount: rows.filter((row) => row.priority === 'critical').length,
      highImpactCount: rows.filter((row) => row.impact === 'high').length,
      averageConfidence: safeDivide(rows.reduce((sum, row) => sum + row.confidenceScore, 0), rows.length),
      topOwner: owner,
    }
  }).filter((row) => row.recommendationCount > 0).sort((a, b) => b.criticalCount - a.criticalCount || b.recommendationCount - a.recommendationCount)
}

function groupOwners(items: RecommendationItem[]) {
  return [...new Set(items.map((item) => item.owner))].map((owner) => {
    const rows = items.filter((item) => item.owner === owner)
    return {
      owner,
      recommendationCount: rows.length,
      criticalCount: rows.filter((row) => row.priority === 'critical').length,
      estimatedEffort: rows.reduce((sum, row) => sum + effortScore[row.effort], 0),
      blockedCount: rows.filter((row) => row.status === 'blocked').length,
    }
  }).sort((a, b) => b.criticalCount - a.criticalCount || b.recommendationCount - a.recommendationCount)
}

function insights(items: RecommendationItem[], resultSummary: RecommendationSummary, categories: ReturnType<typeof groupCategories>, owners: ReturnType<typeof groupOwners>, unaddressed: RecommendationJson['unaddressedRisks']) {
  const quickWin = items.find((item) => item.impact === 'high' && item.effort === 'low')
  const lowConfidence = items.filter((item) => item.confidenceLabel === 'low').length
  return [
    categories[0] ? `${categories[0].label} memiliki backlog terbesar dengan ${categories[0].recommendationCount.toLocaleString('id-ID')} recommendation.` : null,
    owners[0] ? `${owners[0].owner} menjadi owner dengan beban recommendation tertinggi (${owners[0].recommendationCount.toLocaleString('id-ID')}).` : null,
    quickWin ? `Quick win tertinggi: ${quickWin.title} dengan score ${quickWin.recommendationScore}/100.` : null,
    resultSummary.blockedCount ? `${resultSummary.blockedCount.toLocaleString('id-ID')} recommendation berstatus blocked karena dependency atau data belum tersedia.` : null,
    lowConfidence ? `${lowConfidence.toLocaleString('id-ID')} recommendation memiliki confidence rendah dan perlu review manual.` : null,
    unaddressed.length ? `${unaddressed.length.toLocaleString('id-ID')} risk belum memiliki recommendation valid dan ditampilkan sebagai Unaddressed Risks.` : null,
  ].filter(Boolean) as string[]
}

export function queryRecommendations(payload: RecommendationJson, filters: AppliedFilters, local: RecommendationFilters): RecommendationResult {
  const globallyScoped = payload.recommendations.filter((item) => matchesGlobal(payload, filters, item))
  const filtered = sortItems(globallyScoped.filter((item) => matchesLocal(item, local)), local.sortBy)
  const resultSummary = summary(filtered, payload)
  const categories = groupCategories(filtered, payload)
  const owners = groupOwners(filtered)
  const activeMonths = payload.dims.months.filter((month) => !filters.quarter || quarterOf(month) === filters.quarter)
  const periodLabel = filters.quarter ? quarterLabel(filters.quarter) : `${activeMonths[0] ?? '-'} - ${activeMonths[activeMonths.length - 1] ?? '-'}`
  return {
    periodLabel,
    filterLabel: [filters.region ?? 'Semua Wilayah', filters.city, filters.outlet, filters.gender, filters.ageBand ? `${filters.ageBand} tahun` : null].filter(Boolean).join(' · '),
    engineLabel: payload.meta.engineVersion,
    lastGenerated: payload.meta.generatedAt,
    summary: resultSummary,
    executiveRecommendations: filtered.slice(0, 5),
    recommendations: filtered,
    categories,
    owners,
    impactEffortMatrix: filtered.slice(0, 40).map((item) => ({ recommendationId: item.id, title: item.title, impactScore: impactScore[item.impact], effortScore: effortScore[item.effort], priority: item.priority, category: item.category, score: item.recommendationScore })),
    dependencies: payload.dependencies.filter((dep) => filtered.some((item) => item.id === dep.sourceRecommendationId || item.id === dep.targetRecommendationId)),
    conflicts: payload.conflicts.filter((conflict) => conflict.recommendationIds.some((id) => filtered.some((item) => item.id === id))),
    insights: insights(filtered, resultSummary, categories, owners, payload.unaddressedRisks),
    unaddressedRisks: payload.unaddressedRisks,
    coverage: payload.coverage,
    availableCategories: payload.dims.categories,
    availableOwners: payload.dims.owners,
    availableSourceModules: [...new Set(payload.recommendations.flatMap((item) => item.sourceModules))].sort(),
    availableEntityTypes: [...new Set(payload.recommendations.map((item) => item.target.entityType))].sort(),
    localFilters: local,
    methodology: [payload.meta.decisionSupportNote, payload.meta.scoreFormula, payload.meta.confidenceFormula, payload.meta.deduplicationMethod, payload.meta.conflictMethod],
  }
}
