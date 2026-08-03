import { AlertTriangle, Network } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { PainPointInsights } from '@/data/painPointSelectors'
import { formatNumber, formatPercent, formatPriority, formatScore } from '@/data/formatters'

const STATUS_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' } as const

export default function PainPointRankingRootCause({ data }: { data: PainPointInsights }) {
  return (
    <section className="pain-points__grid pain-points__grid--two">
      <GlassCard interactive={false} className="pain-panel">
        <SectionTitle icon={AlertTriangle} title="Prioritas Pain Point" subtitle="frequency x severity x business impact" tone="red" />
        <div className="pain-ranking">
          {data.painPoints.slice(0, 6).map((point, index) => (
            <article className={`pain-rank-row pain-rank-row--${point.status}`} key={point.id}>
              <span>#{index + 1}</span>
              <div>
                <header><strong>{point.label}</strong><b>{formatPriority(point.priorityScore)}</b></header>
                <small>{point.category} · {formatNumber(point.affectedCustomers)} pelanggan · severity {formatScore(point.severity)}/5</small>
                <p>{point.action}</p>
              </div>
              <em>{STATUS_LABEL[point.status]}</em>
            </article>
          ))}
        </div>
      </GlassCard>

      <GlassCard interactive={false} className="pain-panel">
        <SectionTitle icon={Network} title="Root Cause Analysis" subtitle="Kontribusi laporan per kategori" />
        <div className="root-cause-list">
          {data.categories.map((category) => (
            <article key={category.id}>
              <header><strong>{category.label}</strong><b>{formatPercent(category.share)}</b></header>
              <ProgressBar value={category.share * 100} tone={category.avgSeverity >= 4 ? 'orange' : 'blue'} size="sm" />
              <dl>
                <div><dt>Reports</dt><dd>{formatNumber(category.reportCount)}</dd></div>
                <div><dt>Affected</dt><dd>{formatNumber(category.affectedCustomers)}</dd></div>
                <div><dt>Severity</dt><dd>{formatScore(category.avgSeverity)}/5</dd></div>
              </dl>
              <small>Highest issue: {category.topPainPoint}</small>
            </article>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}
