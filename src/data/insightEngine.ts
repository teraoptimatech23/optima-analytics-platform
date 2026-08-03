import { INSIGHT_THRESHOLDS } from '@/config/insightThresholds'
import { A, F, M, quarterLabel, quarterOf, V } from '@/data/cube'
import { queryCampaignPerformance } from '@/data/campaignPerformanceSelectors'
import type { CampaignPerformanceLocalFilters } from '@/data/campaignPerformanceSelectors'
import { formatClv, formatCompactCurrency, formatCompactNumber, formatNumber, formatPercent, formatRoas, formatScore, formatSignedPercent } from '@/data/formatters'
import { queryCustomerNeeds } from '@/data/customerNeedsSelectors'
import { queryCustomerProfile } from '@/data/customerProfileSelectors'
import { queryPainPoints } from '@/data/painPointSelectors'
import { queryPurchaseBehaviour } from '@/data/purchaseBehaviourSelectors'
import { clamp, confidenceLabel, confidenceScore, pearson, priorityLabel, priorityScore, relativeDelta, safeDivide, stableInsightSort, zScore } from '@/data/insightScoring'
import type { AppliedFilters, InsightCube } from '@/data/types'

export type InsightCategory =
  | 'opportunity'
  | 'risk'
  | 'trend'
  | 'anomaly'
  | 'customer'
  | 'product'
  | 'outlet'
  | 'marketing'
  | 'retention'
  | 'revenue'

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low'
export type InsightSentiment = 'positive' | 'negative' | 'neutral'
export type SourceModule = 'Ringkasan' | 'Profil Pelanggan' | 'Kebutuhan Pelanggan' | 'Pain Points' | 'Perilaku Pembelian' | 'Google Ads' | 'Meta Ads' | 'Campaign Performance'

export interface AIInsightEvidence {
  label: string
  value: string
  sourceModule: SourceModule
}

export interface AIInsightItem {
  id: string
  category: InsightCategory
  title: string
  summary: string
  explanation: string
  primaryMetric: {
    label: string
    value: number
    formattedValue: string
  }
  comparison?: {
    label: string
    value: number
    formattedValue: string
    delta: number
    deltaPercent?: number
  }
  affectedEntities: Array<{
    type: string
    id?: string
    label: string
  }>
  evidence: AIInsightEvidence[]
  confidence: number
  confidenceLabel: 'high' | 'medium' | 'low'
  priority: InsightPriority
  priorityScore: number
  severity: number
  sentiment: InsightSentiment
  sourceModules: SourceModule[]
  recommendedAction?: string
  route?: string
  createdForPeriod: string
  metricFormula?: string
  limitations?: string[]
}

export interface AIInsightAnomaly {
  id: string
  metric: string
  period: string
  observedValue: number
  formattedObserved: string
  expectedRange: string
  deviation: number
  affectedDimension: string
  confidence: number
  possibleRelatedFactors: string[]
  route?: string
}

export interface AIInsightRelationship {
  source: string
  target: string
  strength: number
  direction: 'positive' | 'negative'
  label: string
  sampleSize: number
  interpretation: string
}

export interface AIInsightAction {
  id: string
  title: string
  reason: string
  evidence: string[]
  priority: InsightPriority
  sourceInsightIds: string[]
  affectedEntity: string
  expectedDirection: string
  owner: 'Operations' | 'Marketing' | 'CRM' | 'Product' | 'Customer Experience' | 'Store Management' | 'Data Team'
  route?: string
}

export interface AIInsightTheme {
  id: string
  label: string
  insightCount: number
  criticalCount: number
  avgPriorityScore: number
  avgConfidence: number
  sentiment: InsightSentiment
  topAffectedEntity: string
}

export interface AIInsightChange {
  id: string
  label: string
  sourceModule: SourceModule
  current: string
  previous: string
  delta: number
  sentiment: InsightSentiment
  route: string
}

export interface AIInsightLocalFilters {
  category: InsightCategory | 'all'
  priority: InsightPriority | 'all'
  confidence: 'all' | 'high' | 'medium' | 'low'
  sourceModule: SourceModule | 'all'
  sentiment: InsightSentiment | 'all'
  affectedEntity: string
  sort: 'priority' | 'confidence' | 'latest' | 'impact'
  search: string
}

export interface AIInsightResult {
  periodLabel: string
  filterLabel: string
  engineLabel: string
  summary: {
    totalInsights: number
    criticalInsights: number
    opportunities: number
    risks: number
    anomalies: number
    avgConfidence: number
  }
  executiveInsights: AIInsightItem[]
  allInsights: AIInsightItem[]
  filteredInsights: AIInsightItem[]
  themes: AIInsightTheme[]
  relationships: AIInsightRelationship[]
  anomalies: AIInsightAnomaly[]
  actions: AIInsightAction[]
  changes: AIInsightChange[]
  availableCategories: InsightCategory[]
  availablePriorities: InsightPriority[]
  availableSourceModules: SourceModule[]
  availableEntities: string[]
  methodology: {
    thresholds: typeof INSIGHT_THRESHOLDS
    priorityFormula: string
    confidenceFormula: string
    anomalyMethod: string
  }
}

interface EngineContext {
  cube: InsightCube
  filters: AppliedFilters
  previousFilters: AppliedFilters
  periodLabel: string
  current: ReturnType<typeof buildModuleData>
  previous: ReturnType<typeof buildModuleData>
}

const campaignDefaults: CampaignPerformanceLocalFilters = {
  channel: 'all',
  objective: 'all',
  status: 'all',
  trendStatus: 'all',
  metric: 'spend',
  granularity: 'monthly',
  rankingMetric: 'campaignScore',
}

const sourceRoutes: Record<SourceModule, string> = {
  Ringkasan: '/',
  'Profil Pelanggan': '/customer-insights/profil-pelanggan',
  'Kebutuhan Pelanggan': '/customer-insights/kebutuhan-pelanggan',
  'Pain Points': '/customer-insights/pain-points',
  'Perilaku Pembelian': '/purchase-analytics/perilaku-pembelian',
  'Google Ads': '/marketing-analytics/google-ads',
  'Meta Ads': '/marketing-analytics/meta-ads',
  'Campaign Performance': '/marketing-analytics/campaign-performance',
}

function previousQuarter(quarter: string | null) {
  if (!quarter) return null
  const [yearRaw, qRaw] = quarter.split('-Q')
  const year = Number(yearRaw)
  const q = Number(qRaw)
  if (!year || !q) return null
  return q === 1 ? `${year - 1}-Q4` : `${year}-Q${q - 1}`
}

function buildModuleData(cube: InsightCube, filters: AppliedFilters) {
  const profile = queryCustomerProfile(cube, filters)
  const needs = queryCustomerNeeds(cube, filters)
  const pain = queryPainPoints(cube, filters)
  const purchase = queryPurchaseBehaviour(cube, filters)
  const campaign = queryCampaignPerformance(cube, filters, campaignDefaults)
  return { profile, needs, pain, purchase, campaign }
}

function makeFilterLabel(cube: InsightCube, filters: AppliedFilters) {
  const outletName = filters.outlet ? cube.dims.outlets.find((row) => row.id === filters.outlet)?.name : null
  return [
    filters.quarter ? quarterLabel(filters.quarter) : 'Semua Periode',
    filters.region ?? 'Semua Wilayah',
    filters.city,
    outletName,
    filters.gender ? `Gender ${filters.gender}` : null,
    filters.ageBand ? `${filters.ageBand} tahun` : null,
    'Semua Channel',
  ].filter(Boolean).join(' · ')
}

function makeInsight(input: Omit<AIInsightItem, 'confidenceLabel' | 'priority' | 'priorityScore' | 'severity'> & { affectedShare: number; businessImpact: number; magnitude: number }): AIInsightItem | null {
  if (input.confidence < INSIGHT_THRESHOLDS.minimumConfidence) return null
  const score = priorityScore({
    magnitude: input.magnitude,
    affectedShare: input.affectedShare,
    businessImpact: input.businessImpact,
    confidence: input.confidence,
  })
  if (score < 24) return null
  return {
    ...input,
    confidenceLabel: confidenceLabel(input.confidence),
    priority: priorityLabel(score),
    priorityScore: score,
    severity: score,
  }
}

function pushInsight(out: AIInsightItem[], item: AIInsightItem | null) {
  if (item) out.push(item)
}

function insightId(parts: Array<string | number>) {
  return parts.join('|').toLowerCase().replace(/[^a-z0-9|]+/g, '-').replace(/\|/g, '--')
}

function trendWord(delta: number) {
  return delta >= 0 ? 'naik' : 'turun'
}

function customerRules(ctx: EngineContext) {
  const insights: AIInsightItem[] = []
  const { current, previous, periodLabel } = ctx
  const topSegment = current.profile.segments[0]
  const bestClv = [...current.profile.segments].sort((a, b) => b.clv - a.clv)[0]
  const previousBest = previous.profile.segments.find((row) => row.label === bestClv?.label)
  const repeatDelta = relativeDelta(current.purchase.summary.repeatRate, previous.purchase.summary.repeatRate)
  const memberLift = safeDivide(current.purchase.loyalty.member.clv, current.purchase.loyalty.nonMember.clv || 1) - 1

  if (bestClv && bestClv.count >= INSIGHT_THRESHOLDS.minimumSampleSize && bestClv.clv > current.profile.summary.avgClv * 1.12) {
    const magnitude = safeDivide(bestClv.clv, current.profile.summary.avgClv || 1) - 1
    const confidence = confidenceScore({ sampleSize: bestClv.count, magnitude, consistency: previousBest ? 0.75 : 0.55, evidenceCount: 3 })
    pushInsight(insights, makeInsight({
      id: insightId(['customer-clv', periodLabel, bestClv.label]),
      category: 'opportunity',
      title: `Segmen ${bestClv.label} punya CLV di atas rata-rata`,
      summary: `CLV ${bestClv.label} berada ${formatSignedPercent(magnitude)} dibanding rata-rata pelanggan pada filter aktif.`,
      explanation: `Segmen ini bernilai lebih tinggi dari baseline dan masih dapat menjadi prioritas retention, upsell, atau lookalike audience selama ukuran segmennya memadai.`,
      primaryMetric: { label: 'CLV Segmen', value: bestClv.clv, formattedValue: formatClv(bestClv.clv) },
      comparison: { label: 'Rata-rata CLV', value: current.profile.summary.avgClv, formattedValue: formatClv(current.profile.summary.avgClv), delta: bestClv.clv - current.profile.summary.avgClv, deltaPercent: magnitude },
      affectedEntities: [{ type: 'segment', label: bestClv.label, id: bestClv.id }],
      evidence: [
        { label: 'Jumlah pelanggan', value: formatNumber(bestClv.count), sourceModule: 'Profil Pelanggan' },
        { label: 'Share segmen', value: formatPercent(bestClv.share), sourceModule: 'Profil Pelanggan' },
        { label: 'Frekuensi rata-rata', value: `${formatScore(bestClv.avgFrequency)}x`, sourceModule: 'Profil Pelanggan' },
      ],
      confidence,
      affectedShare: bestClv.share,
      businessImpact: clamp(bestClv.clv / (current.profile.summary.avgClv || 1) / 2),
      magnitude,
      sentiment: 'positive',
      sourceModules: ['Profil Pelanggan', 'Perilaku Pembelian'],
      recommendedAction: `Prioritaskan campaign retention dan bundle premium untuk segmen ${bestClv.label}.`,
      route: `${sourceRoutes['Profil Pelanggan']}?segment=${encodeURIComponent(bestClv.label)}`,
      createdForPeriod: periodLabel,
      metricFormula: 'CLV segmen - rata-rata CLV pelanggan aktif pada filter yang sama.',
    }))
  }

  if (Math.abs(repeatDelta) >= INSIGHT_THRESHOLDS.relativeChangeThreshold && current.purchase.summary.totalTransactions >= INSIGHT_THRESHOLDS.minimumSampleSize) {
    const negative = repeatDelta < 0
    const confidence = confidenceScore({ sampleSize: current.purchase.summary.totalTransactions, magnitude: repeatDelta, consistency: 0.7, evidenceCount: 3 })
    pushInsight(insights, makeInsight({
      id: insightId(['repeat-rate', periodLabel, trendWord(repeatDelta)]),
      category: negative ? 'risk' : 'trend',
      title: `Repeat rate ${trendWord(repeatDelta)} ${formatSignedPercent(repeatDelta)}`,
      summary: `Repeat rate periode ini ${formatPercent(current.purchase.summary.repeatRate)} dibanding ${formatPercent(previous.purchase.summary.repeatRate)} pada periode sebelumnya.`,
      explanation: negative
        ? 'Penurunan repeat rate menunjukkan risiko retensi. Sinyal ini perlu dibaca bersama pain point dan churn distribution.'
        : 'Kenaikan repeat rate menunjukkan kualitas kunjungan ulang membaik dan dapat diperkuat melalui loyalty activation.',
      primaryMetric: { label: 'Repeat Rate', value: current.purchase.summary.repeatRate, formattedValue: formatPercent(current.purchase.summary.repeatRate) },
      comparison: { label: 'Periode sebelumnya', value: previous.purchase.summary.repeatRate, formattedValue: formatPercent(previous.purchase.summary.repeatRate), delta: current.purchase.summary.repeatRate - previous.purchase.summary.repeatRate, deltaPercent: repeatDelta },
      affectedEntities: topSegment ? [{ type: 'segment', label: topSegment.label, id: topSegment.id }] : [],
      evidence: [
        { label: 'Transaksi', value: formatCompactNumber(current.purchase.summary.totalTransactions), sourceModule: 'Perilaku Pembelian' },
        { label: 'Churn risk customers', value: formatNumber(current.purchase.churn[2]?.count ?? 0), sourceModule: 'Perilaku Pembelian' },
        { label: 'Pain point utama', value: current.pain.summary.mostCriticalPainPoint, sourceModule: 'Pain Points' },
      ],
      confidence,
      affectedShare: current.purchase.churn[2]?.share ?? current.profile.behaviour.churnRate,
      businessImpact: clamp(Math.abs(repeatDelta) * 2),
      magnitude: repeatDelta,
      sentiment: negative ? 'negative' : 'positive',
      sourceModules: ['Perilaku Pembelian', 'Pain Points'],
      recommendedAction: negative ? 'Audit segmen churn risk dan jalankan reactivation berbasis pain point utama.' : 'Scale loyalty activation pada channel dengan repeat rate tertinggi.',
      route: sourceRoutes['Perilaku Pembelian'],
      createdForPeriod: periodLabel,
      metricFormula: 'Repeat customers / active customers, memakai definisi selector Perilaku Pembelian.',
    }))
  }

  if (memberLift >= 0.12 && current.purchase.loyalty.nonMember.customers >= INSIGHT_THRESHOLDS.minimumSampleSize) {
    const confidence = confidenceScore({ sampleSize: current.purchase.loyalty.member.customers + current.purchase.loyalty.nonMember.customers, magnitude: memberLift, consistency: 0.65, evidenceCount: 3 })
    pushInsight(insights, makeInsight({
      id: insightId(['member-lift', periodLabel]),
      category: 'retention',
      title: `Member menghasilkan CLV ${formatSignedPercent(memberLift)} lebih tinggi`,
      summary: `CLV member ${formatClv(current.purchase.loyalty.member.clv)} dibanding non-member ${formatClv(current.purchase.loyalty.nonMember.clv)}.`,
      explanation: 'Perbedaan nilai pelanggan ini mendukung prioritas conversion non-member ke loyalty, terutama pada channel transaksi terbesar.',
      primaryMetric: { label: 'CLV Lift Member', value: memberLift, formattedValue: formatSignedPercent(memberLift) },
      comparison: { label: 'CLV Non-member', value: current.purchase.loyalty.nonMember.clv, formattedValue: formatClv(current.purchase.loyalty.nonMember.clv), delta: current.purchase.loyalty.member.clv - current.purchase.loyalty.nonMember.clv, deltaPercent: memberLift },
      affectedEntities: [{ type: 'segment', label: 'Non Member' }],
      evidence: [
        { label: 'Member customers', value: formatNumber(current.purchase.loyalty.member.customers), sourceModule: 'Perilaku Pembelian' },
        { label: 'Non-member customers', value: formatNumber(current.purchase.loyalty.nonMember.customers), sourceModule: 'Perilaku Pembelian' },
        { label: 'Membership rate', value: formatPercent(current.profile.behaviour.membershipRate), sourceModule: 'Profil Pelanggan' },
      ],
      confidence,
      affectedShare: safeDivide(current.purchase.loyalty.nonMember.customers, current.profile.summary.totalCustomers),
      businessImpact: clamp(memberLift),
      magnitude: memberLift,
      sentiment: 'positive',
      sourceModules: ['Profil Pelanggan', 'Perilaku Pembelian'],
      recommendedAction: 'Dorong enrollment loyalty di channel transaksi terbesar dengan benefit yang terukur terhadap basket dan repeat.',
      route: sourceRoutes['Perilaku Pembelian'],
      createdForPeriod: periodLabel,
      metricFormula: '(CLV member / CLV non-member) - 1.',
    }))
  }

  return insights
}

function experienceRules(ctx: EngineContext) {
  const insights: AIInsightItem[] = []
  const { current, previous, periodLabel } = ctx
  const topNeed = current.needs.needs[0]
  const topPain = current.pain.painPoints[0]
  const painDelta = relativeDelta(current.pain.summary.affectedRate, previous.pain.summary.affectedRate)
  const worstOutlet = current.pain.locations[0]
  const outletRevenue = current.purchase.outlets.find((row) => row.label === worstOutlet?.label)

  if (topNeed && topNeed.responseCount >= INSIGHT_THRESHOLDS.minimumSampleSize && topNeed.gap > 0.35) {
    const confidence = confidenceScore({ sampleSize: topNeed.responseCount, magnitude: topNeed.gap / 5, consistency: topNeed.status === 'critical' ? 0.8 : 0.62, evidenceCount: 4 })
    pushInsight(insights, makeInsight({
      id: insightId(['need-gap', periodLabel, topNeed.id]),
      category: 'customer',
      title: `${topNeed.label} menjadi gap kebutuhan utama`,
      summary: `Importance ${formatScore(topNeed.importance)} berjarak ${formatScore(topNeed.gap)} poin dari performance.`,
      explanation: 'Gap ini menunjukkan kebutuhan pelanggan yang penting tetapi belum terpenuhi relatif terhadap ekspektasi pada filter aktif.',
      primaryMetric: { label: 'Need Gap', value: topNeed.gap, formattedValue: formatScore(topNeed.gap) },
      comparison: { label: 'Performance', value: topNeed.performance, formattedValue: formatScore(topNeed.performance), delta: topNeed.gap, deltaPercent: safeDivide(topNeed.gap, topNeed.importance) },
      affectedEntities: [{ type: 'need', id: topNeed.id, label: topNeed.label }],
      evidence: [
        { label: 'Priority score', value: `${Math.round(topNeed.priorityScore)}/100`, sourceModule: 'Kebutuhan Pelanggan' },
        { label: 'Responden', value: formatNumber(topNeed.responseCount), sourceModule: 'Kebutuhan Pelanggan' },
        { label: 'Negative rate', value: formatPercent(topNeed.negativeRate), sourceModule: 'Kebutuhan Pelanggan' },
        { label: 'Related pain point', value: current.pain.summary.mostCriticalPainPoint, sourceModule: 'Pain Points' },
      ],
      confidence,
      affectedShare: topNeed.negativeRate,
      businessImpact: clamp(topNeed.priorityScore / 100),
      magnitude: safeDivide(topNeed.gap, 5),
      sentiment: 'negative',
      sourceModules: ['Kebutuhan Pelanggan', 'Pain Points'],
      recommendedAction: topNeed.recommendation,
      route: `${sourceRoutes['Kebutuhan Pelanggan']}?need=${encodeURIComponent(topNeed.id)}`,
      createdForPeriod: periodLabel,
      metricFormula: 'Importance score - performance score dari selector Kebutuhan Pelanggan.',
    }))
  }

  if (topPain && topPain.reportCount >= INSIGHT_THRESHOLDS.minimumSampleSize && (topPain.status === 'critical' || topPain.status === 'high')) {
    const confidence = confidenceScore({ sampleSize: topPain.reportCount, magnitude: topPain.frequencyRate, consistency: Math.abs(painDelta) > 0.04 ? 0.78 : 0.62, evidenceCount: 4 })
    pushInsight(insights, makeInsight({
      id: insightId(['pain-risk', periodLabel, topPain.id]),
      category: 'risk',
      title: `${topPain.label} perlu perhatian prioritas`,
      summary: `${formatCompactNumber(topPain.affectedCustomers)} pelanggan terdampak dengan severity ${formatScore(topPain.severity)}/5.`,
      explanation: 'Sinyal pain point ini melewati threshold frekuensi dan severity, sehingga menjadi risiko customer experience yang dapat memengaruhi repeat dan NPS.',
      primaryMetric: { label: 'Affected Rate', value: topPain.frequencyRate, formattedValue: formatPercent(topPain.frequencyRate) },
      comparison: { label: 'Affected Rate sebelumnya', value: previous.pain.summary.affectedRate, formattedValue: formatPercent(previous.pain.summary.affectedRate), delta: current.pain.summary.affectedRate - previous.pain.summary.affectedRate, deltaPercent: painDelta },
      affectedEntities: [{ type: 'pain_point', id: topPain.id, label: topPain.label }, { type: 'outlet', label: topPain.topOutlet }],
      evidence: [
        { label: 'Report count', value: formatNumber(topPain.reportCount), sourceModule: 'Pain Points' },
        { label: 'NPS impact', value: `${Math.round(topPain.npsImpact)} poin`, sourceModule: 'Pain Points' },
        { label: 'Repeat impact', value: formatSignedPercent(topPain.repeatImpact), sourceModule: 'Pain Points' },
        { label: 'Top segment', value: topPain.topSegment, sourceModule: 'Pain Points' },
      ],
      confidence,
      affectedShare: topPain.frequencyRate,
      businessImpact: clamp(topPain.businessImpact / 2),
      magnitude: topPain.frequencyRate,
      sentiment: 'negative',
      sourceModules: ['Pain Points', 'Perilaku Pembelian'],
      recommendedAction: topPain.action,
      route: `${sourceRoutes['Pain Points']}?painPoint=${encodeURIComponent(topPain.id)}`,
      createdForPeriod: periodLabel,
      metricFormula: 'Affected customers / scoped customers, dengan severity dari gap kebutuhan dan low scorer rate.',
    }))
  }

  if (worstOutlet && outletRevenue && outletRevenue.revenue > current.purchase.summary.avgBasket * INSIGHT_THRESHOLDS.minimumSampleSize && worstOutlet.nps < 40) {
    const confidence = confidenceScore({ sampleSize: worstOutlet.reportCount, magnitude: worstOutlet.painPointRate, consistency: 0.68, evidenceCount: 3 })
    pushInsight(insights, makeInsight({
      id: insightId(['outlet-revenue-nps', periodLabel, worstOutlet.id]),
      category: 'outlet',
      title: `${worstOutlet.label} bernilai tinggi tetapi NPS rendah`,
      summary: `Outlet ini mencatat revenue ${formatCompactCurrency(outletRevenue.revenue)} dengan NPS ${Math.round(worstOutlet.nps)}.`,
      explanation: 'Kombinasi revenue tinggi dan NPS rendah menunjukkan risiko pengalaman pelanggan pada outlet yang berdampak bisnis besar.',
      primaryMetric: { label: 'Revenue Outlet', value: outletRevenue.revenue, formattedValue: formatCompactCurrency(outletRevenue.revenue) },
      affectedEntities: [{ type: 'outlet', id: worstOutlet.id, label: worstOutlet.label }],
      evidence: [
        { label: 'Pain point rate', value: formatPercent(worstOutlet.painPointRate), sourceModule: 'Pain Points' },
        { label: 'Top pain point', value: worstOutlet.topPainPoint, sourceModule: 'Pain Points' },
        { label: 'Waiting time', value: `${formatScore(outletRevenue.waitingTime)} menit`, sourceModule: 'Perilaku Pembelian' },
      ],
      confidence,
      affectedShare: worstOutlet.painPointRate,
      businessImpact: clamp(outletRevenue.revenue / Math.max(1, current.purchase.outlets[0]?.revenue ?? outletRevenue.revenue)),
      magnitude: worstOutlet.painPointRate,
      sentiment: 'negative',
      sourceModules: ['Pain Points', 'Perilaku Pembelian'],
      recommendedAction: `Prioritaskan service recovery dan queue management di ${worstOutlet.label}.`,
      route: `${sourceRoutes['Pain Points']}?outletId=${encodeURIComponent(worstOutlet.id)}`,
      createdForPeriod: periodLabel,
      metricFormula: 'Outlet revenue dari transaksi dibanding NPS dan pain point rate outlet.',
    }))
  }

  return insights
}

function marketingRules(ctx: EngineContext) {
  const insights: AIInsightItem[] = []
  const { current, previous, periodLabel } = ctx
  const bestChannel = [...current.campaign.channels].sort((a, b) => b.efficiencyGap - a.efficiencyGap)[0]
  const weakChannel = [...current.campaign.channels].sort((a, b) => a.efficiencyGap - b.efficiencyGap)[0]
  const highSpendLowReturn = current.campaign.campaigns.find((row) => row.spend >= INSIGHT_THRESHOLDS.minimumCampaignSpend && row.roas < current.campaign.summary.roas * 0.75 && row.spend > current.campaign.summary.spend * 0.08)
  const conversionDelta = relativeDelta(current.campaign.summary.conversions, previous.campaign.summary.conversions)
  const spendDelta = relativeDelta(current.campaign.summary.spend, previous.campaign.summary.spend)

  if (bestChannel && bestChannel.efficiencyGap > 0.08 && bestChannel.conversions >= 100) {
    const confidence = confidenceScore({ sampleSize: bestChannel.conversions, magnitude: bestChannel.efficiencyGap, consistency: 0.7, evidenceCount: 3, missingDataPenalty: bestChannel.conversionValue ? 0 : 0.1 })
    pushInsight(insights, makeInsight({
      id: insightId(['channel-opportunity', periodLabel, bestChannel.id]),
      category: 'marketing',
      title: `${bestChannel.label} memberi return share lebih tinggi dari spend share`,
      summary: `Efficiency gap ${formatSignedPercent(bestChannel.efficiencyGap)} dengan spend share ${formatPercent(bestChannel.spendShare)}.`,
      explanation: 'Channel ini menunjukkan peluang alokasi karena kontribusi return atau conversion relatif lebih besar daripada porsi spend.',
      primaryMetric: { label: 'Efficiency Gap', value: bestChannel.efficiencyGap, formattedValue: formatSignedPercent(bestChannel.efficiencyGap) },
      affectedEntities: [{ type: 'channel', label: bestChannel.label }],
      evidence: [
        { label: 'Conversions', value: formatCompactNumber(bestChannel.conversions), sourceModule: 'Campaign Performance' },
        { label: 'CPA', value: formatCompactCurrency(bestChannel.cpa), sourceModule: 'Campaign Performance' },
        { label: 'ROAS', value: formatRoas(bestChannel.roas), sourceModule: bestChannel.label === 'Google Ads' ? 'Google Ads' : 'Campaign Performance' },
      ],
      confidence,
      affectedShare: bestChannel.conversionShare,
      businessImpact: clamp(bestChannel.efficiencyGap * 2),
      magnitude: bestChannel.efficiencyGap,
      sentiment: 'positive',
      sourceModules: [bestChannel.label === 'Google Ads' ? 'Google Ads' : bestChannel.label === 'Meta Ads' ? 'Meta Ads' : 'Campaign Performance', 'Campaign Performance'],
      recommendedAction: `Uji kenaikan budget bertahap pada campaign ${bestChannel.label} dengan CPA tetap terkendali.`,
      route: `${sourceRoutes['Campaign Performance']}?channel=${encodeURIComponent(bestChannel.label)}`,
      createdForPeriod: periodLabel,
      metricFormula: 'Efficiency gap = return share - spend share, memakai selector Campaign Performance.',
      limitations: bestChannel.conversionValue ? [] : ['Conversion value channel ini belum tersedia granular, sehingga return share memakai conversion value yang tersedia.'],
    }))
  }

  if (weakChannel && weakChannel.efficiencyGap < -0.08 && weakChannel.spend >= INSIGHT_THRESHOLDS.minimumCampaignSpend) {
    const confidence = confidenceScore({ sampleSize: weakChannel.conversions, magnitude: weakChannel.efficiencyGap, consistency: 0.7, evidenceCount: 3, missingDataPenalty: weakChannel.conversionValue ? 0 : 0.08 })
    pushInsight(insights, makeInsight({
      id: insightId(['channel-risk', periodLabel, weakChannel.id]),
      category: 'risk',
      title: `${weakChannel.label} memakai budget lebih besar dari kontribusi return`,
      summary: `Spend share ${formatPercent(weakChannel.spendShare)} sementara return share ${formatPercent(weakChannel.returnShare)}.`,
      explanation: 'Selisih negatif antara spend share dan return share adalah sinyal efisiensi yang perlu diaudit sebelum menambah budget.',
      primaryMetric: { label: 'Efficiency Gap', value: weakChannel.efficiencyGap, formattedValue: formatSignedPercent(weakChannel.efficiencyGap) },
      affectedEntities: [{ type: 'channel', label: weakChannel.label }],
      evidence: [
        { label: 'Spend', value: formatCompactCurrency(weakChannel.spend), sourceModule: 'Campaign Performance' },
        { label: 'CPA', value: formatCompactCurrency(weakChannel.cpa), sourceModule: 'Campaign Performance' },
        { label: 'Conversions', value: formatCompactNumber(weakChannel.conversions), sourceModule: 'Campaign Performance' },
      ],
      confidence,
      affectedShare: weakChannel.spendShare,
      businessImpact: clamp(Math.abs(weakChannel.efficiencyGap) * 2),
      magnitude: weakChannel.efficiencyGap,
      sentiment: 'negative',
      sourceModules: [weakChannel.label === 'Meta Ads' ? 'Meta Ads' : 'Campaign Performance', 'Campaign Performance'],
      recommendedAction: `Audit objective, creative fatigue, dan campaign underperforming di ${weakChannel.label}.`,
      route: `${sourceRoutes['Campaign Performance']}?channel=${encodeURIComponent(weakChannel.label)}`,
      createdForPeriod: periodLabel,
      metricFormula: 'Efficiency gap = return share - spend share, memakai selector Campaign Performance.',
      limitations: weakChannel.conversionValue ? [] : ['ROAS channel ini dibatasi karena conversion value tidak tersedia di aggregate.'],
    }))
  }

  if (highSpendLowReturn) {
    const magnitude = relativeDelta(highSpendLowReturn.roas, current.campaign.summary.roas)
    const confidence = confidenceScore({ sampleSize: highSpendLowReturn.conversions, magnitude, consistency: highSpendLowReturn.trendStatus === 'declining' ? 0.8 : 0.62, evidenceCount: 4, missingDataPenalty: highSpendLowReturn.conversionValue ? 0 : 0.12 })
    pushInsight(insights, makeInsight({
      id: insightId(['campaign-low-return', periodLabel, highSpendLowReturn.campaignId]),
      category: 'marketing',
      title: `${highSpendLowReturn.campaignName} butuh optimasi efisiensi`,
      summary: `Campaign ini memakai ${formatCompactCurrency(highSpendLowReturn.spend)} spend dengan score ${Math.round(highSpendLowReturn.campaignScore)}/100.`,
      explanation: 'Campaign ber-spend besar namun return relatif rendah dapat menekan blended efficiency jika tidak segera dioptimasi.',
      primaryMetric: { label: 'Campaign Score', value: highSpendLowReturn.campaignScore, formattedValue: `${Math.round(highSpendLowReturn.campaignScore)}/100` },
      comparison: { label: 'Blended ROAS', value: current.campaign.summary.roas, formattedValue: formatRoas(current.campaign.summary.roas), delta: highSpendLowReturn.roas - current.campaign.summary.roas, deltaPercent: magnitude },
      affectedEntities: [{ type: 'campaign', id: highSpendLowReturn.campaignId, label: highSpendLowReturn.campaignName }],
      evidence: [
        { label: 'Channel', value: highSpendLowReturn.channel, sourceModule: 'Campaign Performance' },
        { label: 'CPA', value: formatCompactCurrency(highSpendLowReturn.cpa), sourceModule: 'Campaign Performance' },
        { label: 'Trend status', value: highSpendLowReturn.trendStatus, sourceModule: 'Campaign Performance' },
        { label: 'Objective', value: highSpendLowReturn.objective, sourceModule: 'Campaign Performance' },
      ],
      confidence,
      affectedShare: safeDivide(highSpendLowReturn.spend, current.campaign.summary.spend),
      businessImpact: safeDivide(highSpendLowReturn.spend, current.campaign.summary.spend),
      magnitude,
      sentiment: 'negative',
      sourceModules: ['Campaign Performance'],
      recommendedAction: 'Review creative, bidding, targeting, dan landing page; kurangi budget bila CPA tetap tinggi.',
      route: `${sourceRoutes['Campaign Performance']}?campaignId=${encodeURIComponent(highSpendLowReturn.campaignId)}`,
      createdForPeriod: periodLabel,
      metricFormula: 'Campaign score dari weighted metrics Campaign Performance; ROAS = conversion value / spend.',
      limitations: highSpendLowReturn.conversionValue ? [] : ['Conversion value tidak tersedia untuk beberapa platform, sehingga ROAS perlu dibaca bersama CPA dan conversions.'],
    }))
  }

  if (spendDelta > INSIGHT_THRESHOLDS.relativeChangeThreshold && conversionDelta < spendDelta * 0.45) {
    const confidence = confidenceScore({ sampleSize: current.campaign.summary.conversions, magnitude: spendDelta - conversionDelta, consistency: 0.67, evidenceCount: 3 })
    pushInsight(insights, makeInsight({
      id: insightId(['spend-conversion-gap', periodLabel]),
      category: 'risk',
      title: 'Spend naik lebih cepat daripada conversions',
      summary: `Spend ${formatSignedPercent(spendDelta)} sementara conversions ${formatSignedPercent(conversionDelta)} dibanding periode sebelumnya.`,
      explanation: 'Kenaikan investasi marketing belum diikuti kenaikan conversion yang sebanding pada filter aktif.',
      primaryMetric: { label: 'Spend Growth Gap', value: spendDelta - conversionDelta, formattedValue: formatSignedPercent(spendDelta - conversionDelta) },
      comparison: { label: 'Conversion growth', value: conversionDelta, formattedValue: formatSignedPercent(conversionDelta), delta: spendDelta - conversionDelta, deltaPercent: spendDelta - conversionDelta },
      affectedEntities: [{ type: 'channel', label: 'All Channels' }],
      evidence: [
        { label: 'Current spend', value: formatCompactCurrency(current.campaign.summary.spend), sourceModule: 'Campaign Performance' },
        { label: 'Previous spend', value: formatCompactCurrency(previous.campaign.summary.spend), sourceModule: 'Campaign Performance' },
        { label: 'Current conversions', value: formatCompactNumber(current.campaign.summary.conversions), sourceModule: 'Campaign Performance' },
      ],
      confidence,
      affectedShare: 1,
      businessImpact: clamp(spendDelta),
      magnitude: spendDelta - conversionDelta,
      sentiment: 'negative',
      sourceModules: ['Campaign Performance'],
      recommendedAction: 'Rebalance budget ke channel/campaign dengan CPA dan efficiency gap terbaik sebelum scale lanjutan.',
      route: sourceRoutes['Campaign Performance'],
      createdForPeriod: periodLabel,
      metricFormula: 'Spend growth dikurangi conversion growth vs previous comparable period.',
    }))
  }

  return insights
}

function revenueRules(ctx: EngineContext) {
  const insights: AIInsightItem[] = []
  const { current, previous, periodLabel } = ctx
  const revenueDelta = relativeDelta(current.purchase.summary.totalTransactions * current.purchase.summary.avgBasket, previous.purchase.summary.totalTransactions * previous.purchase.summary.avgBasket)
  const basketDelta = relativeDelta(current.purchase.summary.avgBasket, previous.purchase.summary.avgBasket)
  const frequencyDelta = relativeDelta(current.purchase.summary.purchaseFrequency, previous.purchase.summary.purchaseFrequency)
  const topCategory = current.purchase.categories[0]
  const topChannel = current.purchase.channels[0]

  if (Math.abs(revenueDelta) >= INSIGHT_THRESHOLDS.relativeChangeThreshold && current.purchase.summary.totalTransactions >= INSIGHT_THRESHOLDS.minimumSampleSize) {
    const confidence = confidenceScore({ sampleSize: current.purchase.summary.totalTransactions, magnitude: revenueDelta, consistency: 0.7, evidenceCount: 4 })
    pushInsight(insights, makeInsight({
      id: insightId(['revenue-change', periodLabel, trendWord(revenueDelta)]),
      category: 'revenue',
      title: `Revenue transaksi ${trendWord(revenueDelta)} ${formatSignedPercent(revenueDelta)}`,
      summary: `Perubahan ini didukung basket ${formatSignedPercent(basketDelta)} dan frekuensi ${formatSignedPercent(frequencyDelta)}.`,
      explanation: 'Insight revenue menggabungkan total transaksi, average basket, dan purchase frequency agar tidak hanya membaca nilai penjualan tunggal.',
      primaryMetric: { label: 'Estimated Revenue', value: current.purchase.summary.totalTransactions * current.purchase.summary.avgBasket, formattedValue: formatCompactCurrency(current.purchase.summary.totalTransactions * current.purchase.summary.avgBasket) },
      comparison: { label: 'Periode sebelumnya', value: previous.purchase.summary.totalTransactions * previous.purchase.summary.avgBasket, formattedValue: formatCompactCurrency(previous.purchase.summary.totalTransactions * previous.purchase.summary.avgBasket), delta: current.purchase.summary.totalTransactions * current.purchase.summary.avgBasket - previous.purchase.summary.totalTransactions * previous.purchase.summary.avgBasket, deltaPercent: revenueDelta },
      affectedEntities: [
        ...(topCategory ? [{ type: 'product_category', label: topCategory.label }] : []),
        ...(topChannel ? [{ type: 'channel', label: topChannel.label }] : []),
      ],
      evidence: [
        { label: 'Transactions', value: formatCompactNumber(current.purchase.summary.totalTransactions), sourceModule: 'Perilaku Pembelian' },
        { label: 'Average basket', value: formatCompactCurrency(current.purchase.summary.avgBasket), sourceModule: 'Perilaku Pembelian' },
        { label: 'Top category', value: topCategory?.label ?? '-', sourceModule: 'Perilaku Pembelian' },
        { label: 'Top purchase channel', value: topChannel?.label ?? '-', sourceModule: 'Perilaku Pembelian' },
      ],
      confidence,
      affectedShare: 1,
      businessImpact: clamp(Math.abs(revenueDelta) * 1.7),
      magnitude: revenueDelta,
      sentiment: revenueDelta >= 0 ? 'positive' : 'negative',
      sourceModules: ['Ringkasan', 'Perilaku Pembelian'],
      recommendedAction: revenueDelta >= 0 ? 'Identifikasi kategori dan channel pendorong revenue untuk scale terkontrol.' : 'Prioritaskan recovery pada channel dan kategori dengan penurunan terbesar.',
      route: sourceRoutes['Perilaku Pembelian'],
      createdForPeriod: periodLabel,
      metricFormula: 'Estimated revenue = total transactions x average basket dari selector Perilaku Pembelian.',
    }))
  }

  if (current.purchase.promotion.voucher.share > 0.25 && current.purchase.promotion.voucher.basket < current.purchase.summary.avgBasket * 0.96) {
    const magnitude = safeDivide(current.purchase.promotion.voucher.basket, current.purchase.summary.avgBasket) - 1
    const confidence = confidenceScore({ sampleSize: current.purchase.promotion.voucher.transactions, magnitude, consistency: 0.62, evidenceCount: 3 })
    pushInsight(insights, makeInsight({
      id: insightId(['voucher-basket-risk', periodLabel]),
      category: 'revenue',
      title: 'Voucher berkontribusi besar tetapi basket lebih rendah',
      summary: `Voucher share ${formatPercent(current.purchase.promotion.voucher.share)} dengan basket ${formatSignedPercent(magnitude)} terhadap rata-rata.`,
      explanation: 'Promo terlihat membantu volume transaksi, namun perlu dikontrol agar tidak menekan basket terlalu dalam.',
      primaryMetric: { label: 'Voucher Share', value: current.purchase.promotion.voucher.share, formattedValue: formatPercent(current.purchase.promotion.voucher.share) },
      comparison: { label: 'Average basket', value: current.purchase.summary.avgBasket, formattedValue: formatCompactCurrency(current.purchase.summary.avgBasket), delta: current.purchase.promotion.voucher.basket - current.purchase.summary.avgBasket, deltaPercent: magnitude },
      affectedEntities: [{ type: 'promotion', label: 'Voucher' }],
      evidence: [
        { label: 'Voucher transactions', value: formatCompactNumber(current.purchase.promotion.voucher.transactions), sourceModule: 'Perilaku Pembelian' },
        { label: 'Voucher basket', value: formatCompactCurrency(current.purchase.promotion.voucher.basket), sourceModule: 'Perilaku Pembelian' },
        { label: 'Repeat lift voucher', value: formatPercent(current.purchase.promotion.voucher.repeatRate), sourceModule: 'Perilaku Pembelian' },
      ],
      confidence,
      affectedShare: current.purchase.promotion.voucher.share,
      businessImpact: current.purchase.promotion.voucher.share,
      magnitude,
      sentiment: 'negative',
      sourceModules: ['Perilaku Pembelian', 'Campaign Performance'],
      recommendedAction: 'Uji minimum basket, bundle, atau personalized voucher agar promo tetap mendorong repeat tanpa menekan nilai transaksi.',
      route: sourceRoutes['Perilaku Pembelian'],
      createdForPeriod: periodLabel,
      metricFormula: 'Voucher basket dibanding average basket pada filter aktif.',
    }))
  }

  return insights
}

function monthlySeries(cube: InsightCube, filters: AppliedFilters) {
  const outlets = new Set<number>()
  cube.dims.outlets.forEach((outlet, index) => {
    if (filters.outlet && outlet.id !== filters.outlet) return
    if (filters.city && outlet.city !== filters.city) return
    if (filters.region && outlet.region !== filters.region) return
    outlets.add(index)
  })
  const months = cube.dims.months.map((month, index) => ({ month, index })).filter(({ month }) => !filters.quarter || quarterOf(month) === filters.quarter)
  return months.map(({ month, index }) => {
    let tx = 0
    let revenue = 0
    let wait = 0
    let sat = 0
    let active = 0
    let repeat = 0
    let spend = 0
    let conversions = 0
    for (const row of cube.facts) {
      if (row[F.month] !== index || !outlets.has(row[F.outlet]!)) continue
      if (filters.gender && cube.dims.genders[row[F.gender]!] !== filters.gender) continue
      if (filters.ageBand && cube.dims.ageBands[row[F.age]!] !== filters.ageBand) continue
      tx += row[F.tx]!
      revenue += row[F.net]!
      wait += row[F.waitSum]!
      sat += row[F.satSum]!
    }
    for (const row of cube.activity) {
      if (row[A.month] !== index || !outlets.has(row[A.outlet]!)) continue
      if (filters.gender && cube.dims.genders[row[A.gender]!] !== filters.gender) continue
      if (filters.ageBand && cube.dims.ageBands[row[A.age]!] !== filters.ageBand) continue
      active += row[A.active]!
      repeat += row[A.repeat]!
    }
    for (const row of cube.media) {
      if (row[M.month] !== index) continue
      spend += row[M.spend]!
      conversions += row[M.conversions]!
    }
    return {
      month,
      revenue,
      transactions: tx,
      basket: safeDivide(revenue, tx),
      waitingTime: safeDivide(wait, tx),
      satisfaction: safeDivide(sat, tx),
      repeatRate: safeDivide(repeat, active),
      spend,
      conversions,
      cpa: safeDivide(spend, conversions),
    }
  })
}

function detectAnomalies(cube: InsightCube, filters: AppliedFilters): AIInsightAnomaly[] {
  const rows = monthlySeries(cube, filters)
  const metrics = [
    { key: 'revenue', label: 'Revenue', format: formatCompactCurrency, route: sourceRoutes['Perilaku Pembelian'] },
    { key: 'transactions', label: 'Transactions', format: formatCompactNumber, route: sourceRoutes['Ringkasan'] },
    { key: 'basket', label: 'Average Basket', format: formatCompactCurrency, route: sourceRoutes['Perilaku Pembelian'] },
    { key: 'repeatRate', label: 'Repeat Rate', format: (value: number) => formatPercent(value), route: sourceRoutes['Perilaku Pembelian'] },
    { key: 'waitingTime', label: 'Waiting Time', format: (value: number) => `${formatScore(value)} menit`, route: sourceRoutes['Pain Points'] },
    { key: 'spend', label: 'Marketing Spend', format: formatCompactCurrency, route: sourceRoutes['Campaign Performance'] },
    { key: 'conversions', label: 'Conversions', format: formatCompactNumber, route: sourceRoutes['Campaign Performance'] },
    { key: 'cpa', label: 'CPA', format: formatCompactCurrency, route: sourceRoutes['Campaign Performance'] },
  ] as const
  const anomalies: AIInsightAnomaly[] = []
  metrics.forEach((metric) => {
    const values = rows.map((row) => row[metric.key])
    rows.forEach((row, index) => {
      const baseline = values.filter((_, valueIndex) => valueIndex !== index)
      const score = Math.abs(zScore(row[metric.key], baseline))
      if (score < INSIGHT_THRESHOLDS.outlierZScore || baseline.length < 2) return
      const sorted = [...baseline].sort((a, b) => a - b)
      const min = sorted[Math.floor(sorted.length * 0.25)] ?? sorted[0] ?? 0
      const max = sorted[Math.ceil(sorted.length * 0.75)] ?? sorted[sorted.length - 1] ?? 0
      anomalies.push({
        id: insightId(['anomaly', metric.key, row.month]),
        metric: metric.label,
        period: row.month,
        observedValue: row[metric.key],
        formattedObserved: metric.format(row[metric.key]),
        expectedRange: `${metric.format(min)} - ${metric.format(max)}`,
        deviation: score,
        affectedDimension: filters.outlet ?? filters.city ?? filters.region ?? 'Semua wilayah',
        confidence: clamp(score / 2.6),
        possibleRelatedFactors: [
          row.waitingTime > 5 ? 'waiting time relatif tinggi' : '',
          row.spend > safeDivide(baseline.reduce((sum, item) => sum + item, 0), baseline.length) && metric.key !== 'spend' ? 'marketing spend bergerak naik' : '',
          row.repeatRate < 0.45 ? 'repeat rate relatif rendah' : '',
        ].filter(Boolean),
        route: metric.route,
      })
    })
  })
  return anomalies.sort((a, b) => b.confidence - a.confidence).slice(0, 6)
}

function anomalyInsights(anomalies: AIInsightAnomaly[], periodLabel: string) {
  return anomalies.slice(0, 3).map((anomaly) => {
    const confidence = confidenceScore({ sampleSize: 600, magnitude: anomaly.deviation / 3, consistency: anomaly.confidence, evidenceCount: 2 })
    return makeInsight({
      id: `insight-${anomaly.id}`,
      category: 'anomaly',
      title: `Anomali terdeteksi pada ${anomaly.metric}`,
      summary: `${anomaly.metric} di ${anomaly.period} tercatat ${anomaly.formattedObserved}, di luar rentang ${anomaly.expectedRange}.`,
      explanation: 'Anomali terdeteksi dari deviasi terhadap pola bulan lain pada periode aktif. Ini bukan klaim penyebab, melainkan sinyal untuk investigasi.',
      primaryMetric: { label: anomaly.metric, value: anomaly.observedValue, formattedValue: anomaly.formattedObserved },
      affectedEntities: [{ type: 'period', label: anomaly.period }],
      evidence: [
        { label: 'Expected range', value: anomaly.expectedRange, sourceModule: anomaly.route === sourceRoutes['Campaign Performance'] ? 'Campaign Performance' : 'Ringkasan' },
        { label: 'Deviation score', value: formatScore(anomaly.deviation), sourceModule: 'Ringkasan' },
      ],
      confidence,
      affectedShare: clamp(anomaly.deviation / 3),
      businessImpact: clamp(anomaly.deviation / 2.8),
      magnitude: anomaly.deviation / 3,
      sentiment: 'neutral',
      sourceModules: anomaly.route === sourceRoutes['Campaign Performance'] ? ['Campaign Performance'] : ['Ringkasan'],
      recommendedAction: `Investigasi ${anomaly.metric} pada ${anomaly.period} dan cek faktor terkait: ${anomaly.possibleRelatedFactors.join(', ') || 'perubahan operasional atau campaign'}.`,
      route: anomaly.route,
      createdForPeriod: periodLabel,
      metricFormula: 'Z-score terhadap nilai bulan lain dalam periode aktif; threshold anomaly mengikuti config.',
    })
  }).filter((row): row is AIInsightItem => row !== null)
}

function buildRelationships(current: ReturnType<typeof buildModuleData>) {
  const outletRows = current.purchase.outlets.map((outlet) => {
    const pain = current.pain.locations.find((row) => row.label === outlet.label)
    return {
      label: outlet.label,
      waitingTime: outlet.waitingTime,
      satisfaction: pain?.satisfaction ?? 0,
      repeatRate: outlet.repeatRate,
      revenue: outlet.revenue,
      painRate: pain?.painPointRate ?? 0,
      nps: pain?.nps ?? 0,
    }
  }).filter((row) => row.satisfaction || row.painRate)

  const pairs = [
    { source: 'Waiting Time', target: 'Satisfaction', left: outletRows.map((row) => row.waitingTime), right: outletRows.map((row) => row.satisfaction) },
    { source: 'Pain Point Rate', target: 'NPS', left: outletRows.map((row) => row.painRate), right: outletRows.map((row) => row.nps) },
    { source: 'Satisfaction', target: 'Repeat Rate', left: outletRows.map((row) => row.satisfaction), right: outletRows.map((row) => row.repeatRate) },
    { source: 'Revenue', target: 'Pain Point Rate', left: outletRows.map((row) => row.revenue), right: outletRows.map((row) => row.painRate) },
  ]

  return pairs.map((pair) => {
    const coefficient = pearson(pair.left, pair.right)
    const abs = Math.abs(coefficient)
    const strengthLabel = abs >= 0.65 ? 'kuat' : abs >= 0.35 ? 'sedang' : abs >= 0.18 ? 'lemah' : 'tidak menunjukkan hubungan berarti'
    return {
      source: pair.source,
      target: pair.target,
      strength: abs,
      direction: coefficient >= 0 ? 'positive' : 'negative',
      label: `${pair.source} dan ${pair.target} berkorelasi ${strengthLabel} (${coefficient.toFixed(2).replace('.', ',')}).`,
      sampleSize: pair.left.length,
      interpretation: abs >= 0.18 ? `Saat ${pair.source.toLowerCase()} bergerak, ${pair.target.toLowerCase()} cenderung bergerak ${coefficient >= 0 ? 'searah' : 'berlawanan arah'} pada outlet aktif.` : 'Tidak ada hubungan yang cukup berarti pada outlet aktif.',
    } satisfies AIInsightRelationship
  }).filter((row) => row.sampleSize >= 3).sort((a, b) => b.strength - a.strength)
}

function buildChanges(ctx: EngineContext): AIInsightChange[] {
  const { current, previous } = ctx
  const changes: AIInsightChange[] = [
    {
      id: 'change-repeat-rate',
      label: 'Repeat Rate',
      sourceModule: 'Perilaku Pembelian',
      current: formatPercent(current.purchase.summary.repeatRate),
      previous: formatPercent(previous.purchase.summary.repeatRate),
      delta: relativeDelta(current.purchase.summary.repeatRate, previous.purchase.summary.repeatRate),
      sentiment: current.purchase.summary.repeatRate >= previous.purchase.summary.repeatRate ? 'positive' : 'negative',
      route: sourceRoutes['Perilaku Pembelian'],
    },
    {
      id: 'change-need-fulfillment',
      label: 'Need Fulfillment',
      sourceModule: 'Kebutuhan Pelanggan',
      current: formatPercent(current.needs.summary.fulfillmentRate),
      previous: formatPercent(previous.needs.summary.fulfillmentRate),
      delta: relativeDelta(current.needs.summary.fulfillmentRate, previous.needs.summary.fulfillmentRate),
      sentiment: current.needs.summary.fulfillmentRate >= previous.needs.summary.fulfillmentRate ? 'positive' : 'negative',
      route: sourceRoutes['Kebutuhan Pelanggan'],
    },
    {
      id: 'change-pain-affected',
      label: 'Pain Point Affected Rate',
      sourceModule: 'Pain Points',
      current: formatPercent(current.pain.summary.affectedRate),
      previous: formatPercent(previous.pain.summary.affectedRate),
      delta: relativeDelta(current.pain.summary.affectedRate, previous.pain.summary.affectedRate),
      sentiment: current.pain.summary.affectedRate <= previous.pain.summary.affectedRate ? 'positive' : 'negative',
      route: sourceRoutes['Pain Points'],
    },
    {
      id: 'change-campaign-cpa',
      label: 'Campaign CPA',
      sourceModule: 'Campaign Performance',
      current: formatCompactCurrency(current.campaign.summary.cpa),
      previous: formatCompactCurrency(previous.campaign.summary.cpa),
      delta: relativeDelta(current.campaign.summary.cpa, previous.campaign.summary.cpa),
      sentiment: current.campaign.summary.cpa <= previous.campaign.summary.cpa ? 'positive' : 'negative',
      route: sourceRoutes['Campaign Performance'],
    },
    {
      id: 'change-campaign-conversions',
      label: 'Campaign Conversions',
      sourceModule: 'Campaign Performance',
      current: formatCompactNumber(current.campaign.summary.conversions),
      previous: formatCompactNumber(previous.campaign.summary.conversions),
      delta: relativeDelta(current.campaign.summary.conversions, previous.campaign.summary.conversions),
      sentiment: current.campaign.summary.conversions >= previous.campaign.summary.conversions ? 'positive' : 'negative',
      route: sourceRoutes['Campaign Performance'],
    },
  ]
  return changes
    .filter((row) => Math.abs(row.delta) >= INSIGHT_THRESHOLDS.relativeChangeThreshold)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 6)
}

const themeMap: Record<string, { label: string; matches: InsightCategory[] }> = {
  retention: { label: 'Customer Retention', matches: ['retention', 'risk', 'customer'] },
  experience: { label: 'Customer Experience', matches: ['customer', 'outlet', 'risk'] },
  revenue: { label: 'Revenue Growth', matches: ['revenue', 'opportunity'] },
  marketing: { label: 'Marketing Efficiency', matches: ['marketing'] },
  product: { label: 'Product Preference', matches: ['product', 'revenue'] },
  operations: { label: 'Outlet Operations', matches: ['outlet', 'anomaly'] },
  loyalty: { label: 'Loyalty', matches: ['retention'] },
  digital: { label: 'Digital Experience', matches: ['marketing', 'customer'] },
}

function buildThemes(insights: AIInsightItem[]): AIInsightTheme[] {
  return Object.entries(themeMap).map(([id, theme]) => {
    const rows = insights.filter((insight) => theme.matches.includes(insight.category))
    const sentimentBalance = rows.reduce((sum, row) => sum + (row.sentiment === 'positive' ? 1 : row.sentiment === 'negative' ? -1 : 0), 0)
    const entities = rows.flatMap((row) => row.affectedEntities.map((entity) => entity.label))
    const topEntity = [...new Set(entities)].sort((a, b) => entities.filter((item) => item === b).length - entities.filter((item) => item === a).length)[0]
    return {
      id,
      label: theme.label,
      insightCount: rows.length,
      criticalCount: rows.filter((row) => row.priority === 'critical').length,
      avgPriorityScore: safeDivide(rows.reduce((sum, row) => sum + row.priorityScore, 0), rows.length),
      avgConfidence: safeDivide(rows.reduce((sum, row) => sum + row.confidence, 0), rows.length),
      sentiment: sentimentBalance > 0 ? 'positive' : sentimentBalance < 0 ? 'negative' : 'neutral',
      topAffectedEntity: topEntity ?? '-',
    } satisfies AIInsightTheme
  }).filter((theme) => theme.insightCount > 0).sort((a, b) => b.avgPriorityScore - a.avgPriorityScore)
}

function actionKey(insight: AIInsightItem) {
  if (insight.category === 'marketing') return `marketing-${insight.affectedEntities[0]?.label ?? insight.category}`
  if (insight.category === 'outlet') return `store-${insight.affectedEntities[0]?.label ?? insight.category}`
  if (insight.sourceModules.includes('Pain Points')) return `cx-${insight.affectedEntities[0]?.label ?? insight.category}`
  if (insight.category === 'retention') return 'crm-retention'
  return `${insight.category}-${insight.affectedEntities[0]?.label ?? 'general'}`
}

function ownerFor(insight: AIInsightItem): AIInsightAction['owner'] {
  if (insight.category === 'marketing') return 'Marketing'
  if (insight.category === 'retention') return 'CRM'
  if (insight.category === 'outlet') return 'Store Management'
  if (insight.sourceModules.includes('Pain Points')) return 'Customer Experience'
  if (insight.category === 'product') return 'Product'
  if (insight.category === 'anomaly') return 'Data Team'
  return 'Operations'
}

function buildActions(insights: AIInsightItem[]) {
  const map = new Map<string, AIInsightAction>()
  insights.filter((row) => row.recommendedAction).forEach((insight) => {
    const key = actionKey(insight)
    const current = map.get(key)
    const evidence = insight.evidence.slice(0, 2).map((item) => `${item.label}: ${item.value}`)
    if (!current) {
      map.set(key, {
        id: insightId(['action', key]),
        title: insight.recommendedAction ?? insight.title,
        reason: insight.summary,
        evidence,
        priority: insight.priority,
        sourceInsightIds: [insight.id],
        affectedEntity: insight.affectedEntities[0]?.label ?? 'Area aktif',
        expectedDirection: insight.sentiment === 'negative' ? 'Mengurangi risiko dan memperbaiki KPI terkait' : 'Meningkatkan peluang dan memperbesar dampak positif',
        owner: ownerFor(insight),
        route: insight.route,
      })
      return
    }
    current.evidence = [...new Set([...current.evidence, ...evidence])].slice(0, 5)
    current.sourceInsightIds = [...new Set([...current.sourceInsightIds, insight.id])]
    if (insight.priorityScore > (insights.find((row) => row.id === current.sourceInsightIds[0])?.priorityScore ?? 0)) {
      current.priority = insight.priority
      current.reason = insight.summary
      current.route = insight.route
    }
  })
  return [...map.values()].sort((a, b) => {
    const rank: Record<InsightPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 }
    return rank[b.priority] - rank[a.priority] || b.sourceInsightIds.length - a.sourceInsightIds.length
  }).slice(0, 8)
}

function executiveInsights(insights: AIInsightItem[]) {
  const picks = [
    insights.find((row) => row.category === 'opportunity'),
    insights.find((row) => row.category === 'risk'),
    insights.find((row) => row.category === 'trend' && row.sentiment === 'positive'),
    insights.find((row) => row.sourceModules.some((source) => ['Profil Pelanggan', 'Kebutuhan Pelanggan', 'Pain Points'].includes(source))),
    insights.find((row) => row.sourceModules.includes('Campaign Performance')),
  ].filter((row): row is AIInsightItem => Boolean(row))
  return [...new Map(picks.map((row) => [row.id, row])).values()].slice(0, 5)
}

function filterInsights(insights: AIInsightItem[], local: AIInsightLocalFilters) {
  const query = local.search.trim().toLowerCase()
  const filtered = insights
    .filter((row) => local.category === 'all' || row.category === local.category)
    .filter((row) => local.priority === 'all' || row.priority === local.priority)
    .filter((row) => local.confidence === 'all' || row.confidenceLabel === local.confidence)
    .filter((row) => local.sourceModule === 'all' || row.sourceModules.includes(local.sourceModule))
    .filter((row) => local.sentiment === 'all' || row.sentiment === local.sentiment)
    .filter((row) => local.affectedEntity === 'all' || row.affectedEntities.some((entity) => entity.label === local.affectedEntity))
    .filter((row) => !query || [row.id, row.title, row.summary, row.explanation, row.category, row.priority, ...row.sourceModules, ...row.affectedEntities.map((entity) => entity.label)].some((value) => value.toLowerCase().includes(query)))

  if (local.sort === 'confidence') return filtered.sort((a, b) => b.confidence - a.confidence || stableInsightSort(a, b))
  if (local.sort === 'impact') return filtered.sort((a, b) => b.severity - a.severity || stableInsightSort(a, b))
  if (local.sort === 'latest') return filtered.sort((a, b) => b.createdForPeriod.localeCompare(a.createdForPeriod) || stableInsightSort(a, b))
  return filtered.sort(stableInsightSort)
}

export function generateAIInsights(cube: InsightCube, filters: AppliedFilters, localFilters: AIInsightLocalFilters): AIInsightResult {
  const previousFilters = { ...filters, quarter: previousQuarter(filters.quarter) }
  const periodLabel = filters.quarter ? quarterLabel(filters.quarter) : 'Semua Periode'
  const current = buildModuleData(cube, filters)
  const previous = buildModuleData(cube, previousFilters)
  const ctx: EngineContext = { cube, filters, previousFilters, periodLabel, current, previous }
  const anomalies = detectAnomalies(cube, filters)
  const allInsights = [
    ...customerRules(ctx),
    ...experienceRules(ctx),
    ...marketingRules(ctx),
    ...revenueRules(ctx),
    ...anomalyInsights(anomalies, periodLabel),
  ].sort(stableInsightSort)

  const availableEntities = [...new Set(allInsights.flatMap((row) => row.affectedEntities.map((entity) => entity.label)))].sort((a, b) => a.localeCompare(b, 'id-ID'))
  const filteredInsights = filterInsights(allInsights, localFilters)
  const relationships = buildRelationships(current)
  const actions = buildActions(allInsights)
  const themes = buildThemes(allInsights)
  const changes = buildChanges(ctx)

  return {
    periodLabel,
    filterLabel: makeFilterLabel(cube, filters),
    engineLabel: 'Insight Engine: Data-Driven Rules',
    summary: {
      totalInsights: allInsights.length,
      criticalInsights: allInsights.filter((row) => row.priority === 'critical').length,
      opportunities: allInsights.filter((row) => row.category === 'opportunity').length,
      risks: allInsights.filter((row) => row.category === 'risk').length,
      anomalies: anomalies.length,
      avgConfidence: safeDivide(allInsights.reduce((sum, row) => sum + row.confidence, 0), allInsights.length),
    },
    executiveInsights: executiveInsights(allInsights),
    allInsights,
    filteredInsights,
    themes,
    relationships,
    anomalies,
    actions,
    changes,
    availableCategories: ['opportunity', 'risk', 'trend', 'anomaly', 'customer', 'product', 'outlet', 'marketing', 'retention', 'revenue'],
    availablePriorities: ['critical', 'high', 'medium', 'low'],
    availableSourceModules: ['Ringkasan', 'Profil Pelanggan', 'Kebutuhan Pelanggan', 'Pain Points', 'Perilaku Pembelian', 'Google Ads', 'Meta Ads', 'Campaign Performance'],
    availableEntities: ['all', ...availableEntities],
    methodology: {
      thresholds: INSIGHT_THRESHOLDS,
      priorityFormula: '35% normalizedMagnitude + 25% affectedShare + 25% businessImpact + 15% confidence',
      confidenceFormula: '30% sampleSizeScore + 25% magnitudeScore + 25% consistencyScore + 20% evidenceCountScore - missingDataPenalty',
      anomalyMethod: 'Z-score terhadap metrik bulanan dalam periode aktif dengan threshold dari config.',
    },
  }
}
