import type { LucideIcon } from 'lucide-react'

/** Raw shape of src/data/insights.json, produced by scripts/build-aggregates.mjs. */
export interface InsightCube {
  meta: {
    source: string
    seed: number
    period: { start: string; end: string }
    transactions: number
    customers: number
  }
  dims: {
    months: string[]
    outlets: { id: string; name: string; city: string; region: string; type: string }[]
    genders: string[]
    ageBands: string[]
    segments: string[]
    channels: string[]
    categories: string[]
    dayParts: string[]
    products: { id: string; name: string; category: string; basePrice: number }[]
    attributes: string[]
    acquisitions: string[]
    campaigns: { id: string; name: string; platform: string; objective: string }[]
    googleKeywords: { id: string; term: string }[]
    googleMatchTypes: string[]
    googleDevices: string[]
    googleLocations: string[]
    googleAgeRanges: string[]
    googleGenders: string[]
    metaLocations: string[]
    metaAgeRanges: string[]
    metaGenders: string[]
    youtubeLocations: string[]
    youtubeAgeRanges: string[]
    youtubeGenders: string[]
  }
  /** [month, outlet, gender, age, tx, net, gross, discount, items, waitSum, satSum, memberTx, voucherTx] */
  facts: number[][]
  /** [outlet, gender, age, segment, visits, netSpend, nps, satX100, member, active, clv, freqX100, recency, acquisition] */
  customers: number[][]
  /** [month, outlet, gender, age, activeCustomers, repeatCustomers] */
  activity: number[][]
  /** [outlet, gender, age, n, satSumX100, npsSum, promoters, detractors] */
  survey: number[][]
  /** [outlet, attribute, n, perfSumX100, impSumX100, low, high, visitsLow, nLow, visitsHigh, nHigh] */
  needs: number[][]
  /** [month, outlet, channel, tx, net] */
  channelMix: number[][]
  /** [month, outlet, category, qty, amount] */
  categoryMix: number[][]
  /** [outlet, dayOfWeek, hour, tx, waitSum] */
  hourly: number[][]
  /** [month, campaign, spend, impressions, clicks, conversions, value, reach, views] */
  media: number[][]
  /** [month, campaign, keyword, matchType, device, location, ageRange, gender, spend, impressions, clicks, conversions, value] */
  googleAds: number[][]
  /** [month, campaign, location, ageRange, gender, spend, reach, impressions, clicks, engagement, videoViews, conversions] */
  metaAds: number[][]
  /** [month, campaign, location, ageRange, gender, spend, impressions, views, watchTimeSeconds, completedViews, clicks, conversions] */
  youtubeAds: number[][]
  /** [month, tx, net] */
  monthly: number[][]
  /** [outlet, gender, age, segment, member, acquisition, signupDay, cohortYm, memberSinceDay, visits, netSpend, clv, recency, avgSatX100, nps, firstPurchaseDay, secondPurchaseDay, lastPurchaseDay, totalTx, voucherTx, memberTx, activeMonths] */
  customerJourney: number[][]
  /** [customer, outlet, gender, age, segment, month, channel, tx, net, voucherTx, memberTx, campaignTx, satSumX100] */
  customerJourneyMonthly: number[][]
  /** [month, outlet, gender, age, segment, channel, member, voucher, dayPart, weekend, net, gross, discount, uniqueProductCount, quantitySum, encodedItems] */
  marketBasketBaskets: Array<[number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, string]>
}

/** Everything the dashboard needs for one filter selection. */
export interface InsightSnapshot {
  filters: AppliedFilters
  scope: {
    transactions: number
    customers: number
    activeCustomers: number
    outlets: number
    months: string[]
    periodLabel: string
  }
  kpis: KpiItem[]
  profiles: ProfileRow[]
  needs: NeedRow[]
  painPoints: PainPointRow[]
  motivations: MotivationRow[]
  purchase: {
    frequency: DonutSlice[]
    averageLabel: string
    channels: ChannelRow[]
    heatmap: number[][]
    heatmapMaxLabel: string
  }
  perception: {
    traits: string[]
    associations: { label: string; value: string }[]
    positionX: number
    positionY: number
  }
  kpiSummary: KpiSummaryRow[]
  recommendations: RecommendationRow[]
  media: MediaRow[]
}

export interface AppliedFilters {
  quarter: string | null
  region: string | null
  city: string | null
  outlet: string | null
  gender: string | null
  ageBand: string | null
}

export type Tone = 'blue' | 'purple' | 'cyan' | 'orange'

export interface KpiItem {
  id: string
  title: string
  value: string
  change: string
  direction: 'up' | 'down'
  positive: boolean
  tone: Tone
  icon: LucideIcon
  trend: number[]
}

export interface ProfileRow {
  label: string
  detail: string
  value: number
}

export interface NeedRow {
  key: string
  label: string
  icon: LucideIcon
  importance: number
  performance: number
}

export interface PainPointRow {
  title: string
  impact: string
  loss: string
  severity: 'Kritis' | 'Tinggi' | 'Sedang'
}

export interface MotivationRow {
  label: string
  value: number
}

export interface DonutSlice {
  label: string
  value: number
  color: string
}

export interface ChannelRow {
  label: string
  value: number
  icon: LucideIcon
  tone: 'blue' | 'purple' | 'cyan' | 'orange' | 'green'
}

export interface KpiSummaryRow {
  label: string
  current: string
  change: string
  target: string
  status: string
  onTarget: boolean
  down?: boolean
  trend: number[]
  tone: 'green' | 'red'
}

export interface RecommendationRow {
  index: string
  title: string
  description: string
  priority: string
  impact: string
  effort: string
  owner: string
  due: string
  progress: number
  tone: Tone
}

export interface MediaRow {
  platform: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  cpa: number
  roas: number
}
