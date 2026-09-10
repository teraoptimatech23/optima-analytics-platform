import {
  Activity,
  BadgeDollarSign,
  MousePointerClick,
  Repeat2,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ValueLoopStageId =
  | 'customer-behavior'
  | 'traffic-acquisition'
  | 'engagement'
  | 'retention'
  | 'value-optimization'

export interface ValueLoopAnalyticsModule {
  id: string
  label: string
  description: string
}

export interface ValueLoopStageDefinition {
  id: ValueLoopStageId
  label: string
  score: number
  status: 'Healthy' | 'Good' | 'Excellent' | 'Needs Attention'
  tone: 'blue' | 'orange' | 'cyan' | 'green' | 'pink'
  icon: LucideIcon
  route: string
  summary: string
  question: string
  sources: string[]
  analytics: ValueLoopAnalyticsModule[]
}

export const valueLoopCoverage = [
  'Stage Health',
  'KPI Overview',
  'Trend',
  'Breakdown',
  'Detailed Analytics',
  'Drivers',
  'Risks',
  'Opportunities',
  'Insights',
  'Recommendations',
]

export const valueLoopStages: ValueLoopStageDefinition[] = [
  {
    id: 'customer-behavior',
    label: 'Customer Behavior',
    score: 89,
    status: 'Healthy',
    tone: 'blue',
    icon: UsersRound,
    route: '/value-loop/customer-behavior',
    summary: 'Memahami siapa customer, kebutuhan, motivasi, dan pola pembeliannya.',
    question: 'Siapa customer, apa yang mereka lakukan, dan apa yang mendorong keputusan mereka?',
    sources: ['CRM', 'Customer Service', 'Shopee', 'Tokopedia', 'POS'],
    analytics: [
      { id: 'customer-profile', label: 'Customer Profile', description: 'Segmentasi, demographic, preference, dan channel pelanggan.' },
      { id: 'customer-needs', label: 'Customer Needs', description: 'Kebutuhan pelanggan berdasarkan survey dan perilaku transaksi.' },
      { id: 'pain-points', label: 'Pain Points', description: 'Hambatan pengalaman yang memengaruhi keputusan pembelian.' },
      { id: 'customer-motivation', label: 'Motivation', description: 'Driver kunjungan, repeat purchase, dan loyalty.' },
      { id: 'customer-perception', label: 'Perception', description: 'Persepsi terhadap brand, layanan, harga, dan outlet.' },
      { id: 'purchase-behaviour', label: 'Purchase Behaviour', description: 'Frequency, basket behavior, product, channel, dan purchase pattern.' },
      { id: 'customer-journey', label: 'Early Journey', description: 'Perjalanan awal dari acquisition hingga pembelian pertama.' },
      { id: 'market-basket', label: 'Market Basket', description: 'Kombinasi produk dan peluang bundling yang relevan.' },
    ],
  },
  {
    id: 'traffic-acquisition',
    label: 'Traffic Acquisition',
    score: 86,
    status: 'Good',
    tone: 'orange',
    icon: MousePointerClick,
    route: '/value-loop/traffic-acquisition',
    summary: 'Mengukur sumber akuisisi, traffic, campaign, dan efisiensi channel.',
    question: 'Channel mana yang membawa customer baru dengan biaya dan kualitas terbaik?',
    sources: ['Meta', 'Google', 'TikTok', 'Shopee', 'Tokopedia'],
    analytics: [
      { id: 'campaign-performance', label: 'Campaign Performance', description: 'Perbandingan campaign lintas channel dan objective.' },
      { id: 'google-ads', label: 'Google Ads', description: 'Spend, impressions, CTR, CPC, CAC, conversion, dan ROAS.' },
      { id: 'meta-ads', label: 'Meta Ads', description: 'Awareness, traffic, conversion, dan campaign efficiency.' },
      { id: 'youtube-ads', label: 'YouTube Ads', description: 'View, click, conversion, dan efektivitas video campaign.' },
      { id: 'attribution', label: 'Attribution', description: 'Kontribusi traffic dan channel terhadap conversion serta revenue.' },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    score: 90,
    status: 'Healthy',
    tone: 'cyan',
    icon: Activity,
    route: '/value-loop/engagement',
    summary: 'Membaca aktivitas dan interaksi customer setelah acquisition.',
    question: 'Seberapa aktif customer berinteraksi dengan product, channel, campaign, dan brand?',
    sources: ['CRM', 'Customer Service', 'Meta', 'TikTok', 'Shopee', 'Tokopedia'],
    analytics: [
      { id: 'purchase-engagement', label: 'Purchase Engagement', description: 'Active customer, repeat visit, voucher, membership, dan product engagement.' },
      { id: 'customer-journey', label: 'Journey Interaction', description: 'Interaksi customer sepanjang journey dan touchpoint.' },
      { id: 'customer-motivation', label: 'Engagement Drivers', description: 'Motivasi yang mendorong kunjungan dan engagement berulang.' },
      { id: 'customer-perception', label: 'Channel Perception', description: 'Persepsi customer terhadap komunikasi, layanan, dan pengalaman channel.' },
    ],
  },
  {
    id: 'retention',
    label: 'Retention',
    score: 91,
    status: 'Excellent',
    tone: 'green',
    icon: Repeat2,
    route: '/value-loop/retention',
    summary: 'Memantau repeat purchase, loyalty, lifecycle, dan risiko churn.',
    question: 'Apakah customer kembali, bertahan, dan bergerak menuju loyalty?',
    sources: ['CRM', 'Customer Service', 'Shopee', 'Tokopedia', 'POS'],
    analytics: [
      { id: 'rfm-analysis', label: 'RFM Analysis', description: 'Recency, frequency, monetary value, loyalty, dan reactivation priority.' },
      { id: 'cohort-analysis', label: 'Cohort Analysis', description: 'Retention rate, repeat purchase, dan second-purchase behavior per cohort.' },
      { id: 'customer-journey', label: 'Retention Journey', description: 'Lifecycle dari repeat, loyal, hingga at-risk.' },
      { id: 'churn-prediction', label: 'Churn Risk', description: 'Existing churn model untuk risiko dan retention probability.' },
    ],
  },
  {
    id: 'value-optimization',
    label: 'Value Optimization',
    score: 69,
    status: 'Needs Attention',
    tone: 'pink',
    icon: BadgeDollarSign,
    route: '/value-loop/value-optimization',
    summary: 'Mengoptimalkan CLV, revenue, basket, profit, dan peluang tindakan.',
    question: 'Bagaimana meningkatkan nilai ekonomi setiap customer dan keseluruhan bisnis?',
    sources: ['CRM', 'Google', 'Meta', 'Shopee', 'Tokopedia', 'POS'],
    analytics: [
      { id: 'clv-prediction', label: 'Customer Lifetime Value', description: 'Historical dan predicted CLV dengan horizon existing.' },
      { id: 'sales-forecast', label: 'Revenue & Sales Forecast', description: 'Revenue, sales, dan opportunity dari forecast pipeline.' },
      { id: 'demand-forecast', label: 'Demand Forecast', description: 'Demand outlook untuk inventory dan profit opportunity.' },
      { id: 'market-basket', label: 'Cross-sell Opportunity', description: 'Average basket, affinity, bundling, dan cross-sell opportunity.' },
      { id: 'recommendations', label: 'Recommendations', description: 'Prioritas tindakan berdasarkan impact, effort, dan evidence existing.' },
    ],
  },
]

export const valueLoopStageById = Object.fromEntries(
  valueLoopStages.map((stage) => [stage.id, stage]),
) as Record<ValueLoopStageId, ValueLoopStageDefinition>
