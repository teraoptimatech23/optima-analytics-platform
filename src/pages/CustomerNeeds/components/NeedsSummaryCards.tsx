import { AlertTriangle, ClipboardList, Gauge, MessageSquareText, Target, TrendingUp } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard/KpiCard'
import type { CustomerNeedsInsights } from '@/data/customerNeedsSelectors'
import { formatNumber, formatPercent, formatScore, formatSignedScore } from '@/data/formatters'

interface NeedsSummaryCardsProps {
  summary: CustomerNeedsInsights['summary']
}

export default function NeedsSummaryCards({ summary }: NeedsSummaryCardsProps) {
  const cards = [
    { id: 'fulfillment', title: 'Overall Need Fulfillment', value: formatPercent(summary.fulfillmentRate), change: 'skala 1-5', tone: 'blue' as const, icon: Gauge, trend: [summary.fulfillmentRate * 80, summary.fulfillmentRate * 92, summary.fulfillmentRate * 100] },
    { id: 'importance', title: 'Avg Importance Score', value: formatScore(summary.avgImportance), change: 'weighted', tone: 'purple' as const, icon: Target, trend: [summary.avgImportance * .92, summary.avgImportance * .97, summary.avgImportance] },
    { id: 'performance', title: 'Avg Performance Score', value: formatScore(summary.avgPerformance), change: 'weighted', tone: 'cyan' as const, icon: TrendingUp, trend: [summary.avgPerformance * .9, summary.avgPerformance * .96, summary.avgPerformance] },
    { id: 'gap', title: 'Largest Experience Gap', value: formatSignedScore(summary.largestGap), change: 'importance - perf', tone: 'orange' as const, icon: AlertTriangle, trend: [summary.largestGap * .75, summary.largestGap * .9, summary.largestGap] },
    { id: 'priority', title: 'Top Priority Need', value: summary.topPriorityNeed, change: 'rank #1', tone: 'blue' as const, icon: ClipboardList, trend: [] },
    { id: 'responses', title: 'Survey Responses', value: formatNumber(summary.totalResponses), change: 'responden aktif', tone: 'purple' as const, icon: MessageSquareText, trend: [summary.totalResponses * .84, summary.totalResponses * .93, summary.totalResponses] },
  ]

  return (
    <section className="customer-needs__kpis" aria-label="KPI kebutuhan pelanggan">
      {cards.map(({ id, ...card }) => (
        <KpiCard key={id} direction="up" positive {...card} />
      ))}
    </section>
  )
}
