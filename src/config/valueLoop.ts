import { Activity, BadgeDollarSign, BrainCircuit, MousePointerClick, Repeat2, ShoppingCart, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ValueLoopStageId = 'customer-behavior' | 'traffic-acquisition' | 'conversion' | 'engagement' | 'retention' | 'analytics' | 'profit-optimization'

export interface ValueLoopAnalyticsModule { id: string; label: string; description: string }

export interface ValueLoopStageDefinition {
  id: ValueLoopStageId
  label: string
  score: number
  status: 'Healthy' | 'Good' | 'Excellent' | 'Needs Attention'
  tone: 'blue' | 'orange' | 'cyan' | 'green' | 'pink' | 'violet'
  icon: LucideIcon
  route: string
  summary: string
  question: string
  primaryKpi: string
  insight: string
  recommendation: string
  trend: number[]
  sources: string[]
  analytics: ValueLoopAnalyticsModule[]
}

export const valueLoopCoverage = ['Data & Metrics', 'Main Analysis', 'Findings & Drivers', 'Output & Recommendations']

export const valueLoopStages: ValueLoopStageDefinition[] = [
  {
    id: 'customer-behavior', label: 'Customer Behavior', score: 89, status: 'Healthy', tone: 'blue', icon: UsersRound,
    route: '/value-loop/customer-behavior',
    summary: 'Memahami siapa customer, kebutuhannya, dan bagaimana mereka membeli.',
    question: 'Siapa customer, apa yang mereka inginkan, dan bagaimana mereka melakukan pembelian?',
    primaryKpi: 'CSAT 91%', insight: 'Preferensi dan loyalty signal kuat.', recommendation: 'Pertajam STP dan journey map.', trend: [72, 76, 75, 81, 84, 89],
    sources: ['CRM', 'Store', 'Shopee', 'Tokopedia', 'Social'],
    analytics: [
      { id: 'customer-profile', label: 'Customer Profile', description: 'Segmentation, demographic, product preference, dan channel preference.' },
      { id: 'customer-needs', label: 'Customer Needs', description: 'Kebutuhan pelanggan berdasarkan survey dan perilaku transaksi.' },
      { id: 'pain-points', label: 'Pain Points', description: 'Hambatan pengalaman yang memengaruhi keputusan pembelian.' },
      { id: 'customer-motivation', label: 'Motivation', description: 'Driver kunjungan, repeat purchase, dan loyalty.' },
      { id: 'customer-perception', label: 'Perception', description: 'Persepsi terhadap brand, layanan, harga, dan outlet.' },
      { id: 'purchase-behaviour', label: 'Purchase Behaviour', description: 'Frequency, product, channel, dan pola pembelian.' },
      { id: 'customer-journey', label: 'Journey Map', description: 'Awareness, consideration, purchase, dan loyalty journey.' },
      { id: 'market-basket', label: 'Product Preference', description: 'Kombinasi produk dan preference signal dari basket.' },
    ],
  },
  {
    id: 'traffic-acquisition', label: 'Traffic Acquisition', score: 86, status: 'Good', tone: 'orange', icon: MousePointerClick,
    route: '/value-loop/traffic-acquisition',
    summary: 'Mendatangkan traffic yang tepat untuk menjadi pelanggan potensial.',
    question: 'Channel mana yang membawa calon customer dengan biaya dan kualitas terbaik?',
    primaryKpi: 'ROAS 4,6x', insight: 'Google memimpin efisiensi channel.', recommendation: 'Scale channel ber-ROAS tinggi.', trend: [63, 68, 72, 78, 82, 86],
    sources: ['Google', 'Meta', 'TikTok', 'Shopee', 'Tokopedia'],
    analytics: [
      { id: 'campaign-performance', label: 'Overview', description: 'Traffic mix, impressions, clicks, CTR, CPC, CAC, conversion, dan ROAS.' },
      { id: 'google-ads', label: 'Google', description: 'Spend, impressions, CTR, CPC, conversion, dan ROAS Google.' },
      { id: 'meta-ads', label: 'Meta', description: 'Reach, traffic, engagement, conversion, dan campaign efficiency Meta.' },
      { id: 'youtube-ads', label: 'Video / TikTok', description: 'Reusable video analytics; TikTok remains adapter-ready until source data exists.' },
      { id: 'attribution', label: 'Attribution', description: 'Kontribusi source dan channel terhadap conversion serta revenue.' },
    ],
  },
  {
    id: 'conversion', label: 'Conversion', score: 69, status: 'Needs Attention', tone: 'pink', icon: ShoppingCart,
    route: '/value-loop/conversion',
    summary: 'Mengubah pengunjung menjadi pembeli melalui funnel yang efisien.',
    question: 'Di tahap mana visitor gagal menjadi pembeli dan apa friction utamanya?',
    primaryKpi: 'CVR 4,9%', insight: 'Drop-off terbesar terjadi di checkout.', recommendation: 'Optimalkan checkout dan payment.', trend: [78, 76, 74, 72, 70, 69],
    sources: ['Google', 'Meta', 'TikTok', 'Shopee', 'Tokopedia', 'Store'],
    analytics: [
      { id: 'conversion-funnel', label: 'Conversion Funnel', description: 'Visitor, add-to-cart, checkout, purchase, conversion rate, AOV, dan revenue.' },
      { id: 'checkout-journey', label: 'Checkout Journey', description: 'Customer journey conversion stage dan friction menuju purchase.' },
      { id: 'channel-conversion', label: 'Channel Conversion', description: 'Campaign-to-purchase dan conversion performance lintas channel.' },
      { id: 'conversion-attribution', label: 'Purchase Attribution', description: 'Kontribusi touchpoint dan campaign terhadap purchase.' },
    ],
  },
  {
    id: 'engagement', label: 'Engagement', score: 90, status: 'Healthy', tone: 'cyan', icon: Activity,
    route: '/value-loop/engagement',
    summary: 'Membangun interaksi dan hubungan agar customer tetap engaged.',
    question: 'Seberapa aktif customer berinteraksi dengan product, channel, campaign, dan brand?',
    primaryKpi: 'Active 5.420', insight: 'Engagement dan repeat visit tinggi.', recommendation: 'Perluas lifecycle engagement.', trend: [70, 74, 77, 83, 87, 90],
    sources: ['Meta', 'TikTok', 'CRM', 'Shopee', 'Tokopedia', 'Store'],
    analytics: [
      { id: 'purchase-engagement', label: 'Engagement Overview', description: 'Active customer, repeat visit, voucher, membership, dan product engagement.' },
      { id: 'customer-journey', label: 'Journey Interaction', description: 'Interaksi customer sepanjang journey dan touchpoint.' },
      { id: 'customer-motivation', label: 'Engagement Drivers', description: 'Motivasi yang mendorong kunjungan dan engagement berulang.' },
      { id: 'customer-perception', label: 'Channel Perception', description: 'Persepsi customer terhadap komunikasi, layanan, dan pengalaman channel.' },
    ],
  },
  {
    id: 'retention', label: 'Retention', score: 91, status: 'Excellent', tone: 'green', icon: Repeat2,
    route: '/value-loop/retention',
    summary: 'Meningkatkan loyalty, repeat order, dan ketahanan customer lifecycle.',
    question: 'Apakah customer kembali, bertahan, dan bergerak menuju loyalty?',
    primaryKpi: 'Retention 82%', insight: 'Repeat purchase dan loyalty menguat.', recommendation: 'Aktifkan cohort reactivation.', trend: [77, 80, 82, 85, 88, 91],
    sources: ['CRM', 'Store', 'Shopee', 'Tokopedia'],
    analytics: [
      { id: 'rfm-analysis', label: 'RFM Analysis', description: 'Recency, frequency, monetary value, loyalty, dan reactivation priority.' },
      { id: 'cohort-analysis', label: 'Cohort Analysis', description: 'Retention rate, repeat purchase, dan second-purchase behavior per cohort.' },
      { id: 'customer-journey', label: 'Retention Journey', description: 'Lifecycle dari repeat, loyal, hingga at-risk.' },
      { id: 'churn-prediction', label: 'Churn Risk', description: 'Existing churn model sebagai supporting retention insight.' },
    ],
  },
  {
    id: 'analytics', label: 'Analytics', score: 84, status: 'Healthy', tone: 'violet', icon: BrainCircuit,
    route: '/value-loop/analytics',
    summary: 'Decision engine yang mengubah sinyal lintas loop menjadi tindakan.',
    question: 'Insight, prediction, dan keputusan apa yang paling penting di seluruh loop?',
    primaryKpi: 'Health 84/100', insight: 'Conversion adalah bottleneck utama.', recommendation: 'Prioritaskan high-impact action.', trend: [74, 77, 79, 80, 82, 84],
    sources: ['All normalized loop data'],
    analytics: [
      { id: 'overview', label: 'Overview', description: 'Cross-loop performance score, bottleneck, anomaly, dan decision framework.' },
      { id: 'customer-prediction', label: 'Customer Prediction', description: 'Customer behavior intelligence dari existing journey model.' },
      { id: 'traffic-prediction', label: 'Traffic Prediction', description: 'Traffic and attribution intelligence dari existing channel model.' },
      { id: 'conversion-prediction', label: 'Conversion Prediction', description: 'Conversion signal dari existing campaign-to-purchase analysis.' },
      { id: 'engagement-prediction', label: 'Engagement Prediction', description: 'Engagement drivers dari existing behavior and motivation model.' },
      { id: 'retention-prediction', label: 'Retention Prediction', description: 'Churn probability dari existing validated churn model.' },
      { id: 'value-revenue-prediction', label: 'Value / Revenue Prediction', description: 'CLV, demand, dan sales outlook from existing validated models.' },
      { id: 'ai-insight', label: 'AI Insight', description: 'Cross-loop insight, signal, opportunity, dan anomaly analysis.' },
      { id: 'recommendations', label: 'Recommendations', description: 'Prioritized decision actions backed by existing evidence.' },
    ],
  },
  {
    id: 'profit-optimization', label: 'Profit Optimization', score: 69, status: 'Needs Attention', tone: 'pink', icon: BadgeDollarSign,
    route: '/value-loop/profit-optimization',
    summary: 'Mengubah seluruh customer journey menjadi profit growth yang scalable.',
    question: 'Bagaimana traffic, conversion, retention, value, dan cost berkontribusi ke profit?',
    primaryKpi: 'Margin 18,5%', insight: 'Conversion menahan profit growth.', recommendation: 'Optimalkan mix, CLV, dan margin.', trend: [62, 65, 68, 70, 71, 69],
    sources: ['Commerce', 'Store', 'CRM', 'Traffic spend', 'Cost data'],
    analytics: [
      { id: 'profit-overview', label: 'Profit Overview', description: 'Revenue and sales view with explicit available metric scope.' },
      { id: 'clv-prediction', label: 'Customer Value', description: 'Historical dan predicted CLV dengan horizon existing.' },
      { id: 'sales-forecast', label: 'Revenue Forecast', description: 'Revenue dan sales opportunity dari forecast pipeline.' },
      { id: 'demand-forecast', label: 'Demand Forecast', description: 'Demand outlook untuk inventory dan profit opportunity.' },
      { id: 'market-basket', label: 'Cross-sell / Upsell', description: 'Basket affinity, bundling, dan cross-sell opportunity.' },
      { id: 'channel-profitability', label: 'Channel Profitability', description: 'Campaign contribution based on existing spend and revenue data.' },
      { id: 'recommendations', label: 'Recommendations', description: 'Prioritas tindakan berdasarkan impact, effort, dan evidence existing.' },
    ],
  },
]

export const valueLoopStageById = Object.fromEntries(valueLoopStages.map((stage) => [stage.id, stage])) as Record<ValueLoopStageId, ValueLoopStageDefinition>
