import { AlertTriangle, ShieldAlert, Siren, TrendingDown, UserX, UsersRound } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard/KpiCard'
import type { PainPointInsights } from '@/data/painPointSelectors'
import { formatNumber, formatPercent, formatPriority, formatScore } from '@/data/formatters'

export default function PainPointSummaryCards({ summary }: { summary: PainPointInsights['summary'] }) {
  const cards = [
    { id: 'reports', title: 'Total Pain Point Reports', value: formatNumber(summary.totalReports), change: 'laporan negatif', tone: 'blue' as const, icon: AlertTriangle, trend: [summary.totalReports * .84, summary.totalReports * .94, summary.totalReports] },
    { id: 'affected', title: 'Customers Affected', value: formatNumber(summary.affectedCustomers), change: formatPercent(summary.affectedRate), tone: 'purple' as const, icon: UsersRound, trend: [summary.affectedCustomers * .8, summary.affectedCustomers * .92, summary.affectedCustomers] },
    { id: 'critical', title: 'Most Critical Pain Point', value: summary.mostCriticalPainPoint, change: 'priority #1', tone: 'orange' as const, icon: Siren, trend: [] },
    { id: 'severity', title: 'Average Severity Score', value: `${formatScore(summary.avgSeverity)}/5`, change: 'weighted', tone: 'cyan' as const, icon: ShieldAlert, trend: [summary.avgSeverity * .9, summary.avgSeverity * .97, summary.avgSeverity] },
    { id: 'gap', title: 'Resolution Gap', value: formatPercent(summary.resolutionGap), change: formatPriority(summary.resolutionGap * 100), tone: 'orange' as const, icon: TrendingDown, trend: [summary.resolutionGap * .7, summary.resolutionGap * .9, summary.resolutionGap] },
    { id: 'risk', title: 'At-Risk Customers', value: formatNumber(summary.atRiskCustomers), change: 'watchlist', tone: 'purple' as const, icon: UserX, trend: [summary.atRiskCustomers * .78, summary.atRiskCustomers * .9, summary.atRiskCustomers] },
  ]

  return (
    <section className="pain-points__kpis" aria-label="KPI pain points">
      {cards.map(({ id, ...card }) => <KpiCard key={id} direction="up" positive {...card} />)}
    </section>
  )
}
