import { BadgeCheck, RefreshCcw, UserCheck, UsersRound } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard/KpiCard'
import type { CustomerProfileInsights } from '@/data/customerProfileSelectors'
import { formatClv, formatNumber, formatPercent } from '@/data/formatters'

interface ProfileSummaryCardsProps {
  summary: CustomerProfileInsights['summary']
}

export default function ProfileSummaryCards({ summary }: ProfileSummaryCardsProps) {
  const cards = [
    {
      id: 'total',
      title: 'Total Pelanggan',
      value: formatNumber(summary.totalCustomers),
      change: formatPercent(summary.totalCustomers ? summary.activeCustomers / summary.totalCustomers : 0, 0),
      direction: 'up' as const,
      positive: true,
      tone: 'blue' as const,
      icon: UsersRound,
      trend: [summary.totalCustomers * 0.86, summary.totalCustomers * 0.92, summary.totalCustomers],
    },
    {
      id: 'active',
      title: 'Pelanggan Aktif',
      value: formatNumber(summary.activeCustomers),
      change: formatPercent(summary.totalCustomers ? summary.activeCustomers / summary.totalCustomers : 0),
      direction: 'up' as const,
      positive: true,
      tone: 'cyan' as const,
      icon: UserCheck,
      trend: [summary.activeCustomers * 0.82, summary.activeCustomers * 0.94, summary.activeCustomers],
    },
    {
      id: 'members',
      title: 'Member / Loyalty',
      value: formatNumber(summary.members),
      change: formatPercent(summary.memberRate),
      direction: 'up' as const,
      positive: true,
      tone: 'purple' as const,
      icon: BadgeCheck,
      trend: [summary.members * 0.88, summary.members * 0.96, summary.members],
    },
    {
      id: 'clv',
      title: 'Average CLV',
      value: formatClv(summary.avgClv),
      change: `${formatNumber(summary.repeatCustomers)} repeat`,
      direction: 'up' as const,
      positive: true,
      tone: 'orange' as const,
      icon: RefreshCcw,
      trend: [summary.avgClv * 0.9, summary.avgClv * 0.97, summary.avgClv],
    },
  ]

  return (
    <section className="customer-profile__kpis" aria-label="KPI profil pelanggan">
      {cards.map(({ id, ...card }) => (
        <KpiCard key={id} {...card} />
      ))}
    </section>
  )
}
