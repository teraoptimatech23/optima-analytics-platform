import type { InsightCube } from '@/data/types'

/**
 * Column maps for the packed fact arrays. The cube stores plain numbers to keep
 * the payload small, so every read goes through these instead of magic indices.
 */
export const F = {
  month: 0, outlet: 1, gender: 2, age: 3, tx: 4, net: 5, gross: 6,
  discount: 7, items: 8, waitSum: 9, satSum: 10, memberTx: 11, voucherTx: 12,
} as const

export const C = {
  outlet: 0, gender: 1, age: 2, segment: 3, visits: 4, netSpend: 5, nps: 6,
  sat: 7, member: 8, active: 9, clv: 10, freq: 11, recency: 12, acquisition: 13,
} as const

export const A = { month: 0, outlet: 1, gender: 2, age: 3, active: 4, repeat: 5 } as const
export const V = { outlet: 0, gender: 1, age: 2, n: 3, satSum: 4, npsSum: 5, promoters: 6, detractors: 7 } as const
export const N = {
  outlet: 0, attribute: 1, n: 2, perfSum: 3, impSum: 4,
  lowScorers: 5, highScorers: 6, visitsLow: 7, nLow: 8, visitsHigh: 9, nHigh: 10,
} as const
export const CH = { month: 0, outlet: 1, channel: 2, tx: 3, net: 4 } as const
export const CAT = { month: 0, outlet: 1, category: 2, qty: 3, amount: 4 } as const
export const H = { outlet: 0, dow: 1, hour: 2, tx: 3, waitSum: 4 } as const
export const M = { month: 0, campaign: 1, spend: 2, impressions: 3, clicks: 4, conversions: 5, value: 6, reach: 7, views: 8 } as const
export const MBB = {
  month: 0, outlet: 1, gender: 2, age: 3, segment: 4, channel: 5, member: 6,
  voucher: 7, dayPart: 8, weekend: 9, net: 10, gross: 11, discount: 12,
  uniqueProductCount: 13, quantitySum: 14, encodedItems: 15,
} as const
export const GA = {
  month: 0, campaign: 1, keyword: 2, matchType: 3, device: 4, location: 5, ageRange: 6,
  gender: 7, spend: 8, impressions: 9, clicks: 10, conversions: 11, value: 12,
} as const
export const META = {
  month: 0, campaign: 1, location: 2, ageRange: 3, gender: 4, spend: 5, reach: 6,
  impressions: 7, clicks: 8, engagement: 9, videoViews: 10, conversions: 11,
} as const
export const YT = {
  month: 0, campaign: 1, location: 2, ageRange: 3, gender: 4, spend: 5,
  impressions: 6, views: 7, watchTimeSeconds: 8, completedViews: 9,
  clicks: 10, conversions: 11,
} as const
export const CJ = {
  outlet: 0, gender: 1, age: 2, segment: 3, member: 4, acquisition: 5,
  signupDay: 6, cohortYm: 7, memberSinceDay: 8, visits: 9, netSpend: 10,
  clv: 11, recency: 12, avgSat: 13, nps: 14, firstPurchaseDay: 15,
  secondPurchaseDay: 16, lastPurchaseDay: 17, totalTx: 18, voucherTx: 19,
  memberTx: 20, activeMonths: 21,
} as const
export const CJM = {
  customer: 0, outlet: 1, gender: 2, age: 3, segment: 4, month: 5, channel: 6,
  tx: 7, net: 8, voucherTx: 9, memberTx: 10, campaignTx: 11, satSum: 12,
} as const

let cached: InsightCube | null = null

/**
 * The cube is ~1.1 MB, so it is a separate chunk fetched after first paint —
 * which is exactly what the dashboard's loading state is for.
 */
export async function loadCube(): Promise<InsightCube> {
  if (cached) return cached
  const module = await import('./insights.json')
  cached = (module.default ?? module) as unknown as InsightCube
  return cached
}

export const quarterOf = (month: string) => {
  const [year, index] = month.split('-').map(Number)
  return `${year}-Q${Math.ceil((index ?? 1) / 3)}`
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export const monthLabel = (month: string) => {
  const [year, index] = month.split('-').map(Number)
  return `${MONTH_LABELS[(index ?? 1) - 1]} ${year}`
}

export const quarterLabel = (quarter: string) => {
  const [year, q] = quarter.split('-Q')
  const spans: Record<string, string> = {
    '1': 'Jan - Mar',
    '2': 'Apr - Jun',
    '3': 'Jul - Sep',
    '4': 'Okt - Des',
  }
  return `Kuartal ${q} (${spans[q ?? '1']} ${year})`
}

/** Compact form for the filter pill, where horizontal room is scarce. */
export const quarterShortLabel = (quarter: string) => {
  const [year, q] = quarter.split('-Q')
  return `Q${q} ${year}`
}
