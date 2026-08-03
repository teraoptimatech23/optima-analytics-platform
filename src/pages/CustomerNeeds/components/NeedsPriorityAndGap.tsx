import { AlertTriangle, BarChart3 } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CustomerNeedItem } from '@/data/customerNeedsSelectors'
import { formatPriority, formatScore, formatSignedScore } from '@/data/formatters'

interface NeedsPriorityAndGapProps {
  needs: CustomerNeedItem[]
}

const STATUS_LABEL = {
  critical: 'Kritis',
  high: 'Prioritas Tinggi',
  monitor: 'Perlu Dipantau',
  good: 'Sudah Baik',
} as const

export default function NeedsPriorityAndGap({ needs }: NeedsPriorityAndGapProps) {
  const maxGap = Math.max(0.1, ...needs.map((need) => Math.max(0, need.gap)))

  return (
    <section className="customer-needs__grid customer-needs__grid--two" aria-label="Prioritas dan gap kebutuhan">
      <GlassCard interactive={false} className="needs-panel">
        <SectionTitle icon={AlertTriangle} title="Prioritas Perbaikan" subtitle="priority = importance/5 x gap positif x response weight" tone="orange" />
        <div className="priority-list">
          {needs.slice(0, 6).map((need, index) => (
            <article className={`priority-row priority-row--${need.status}`} key={need.id}>
              <span className="priority-row__rank">{index + 1}</span>
              <div className="priority-row__body">
                <header>
                  <strong>{need.label}</strong>
                  <b>{formatPriority(need.priorityScore)}</b>
                </header>
                <p>{need.recommendation}</p>
                <small>
                  Imp {formatScore(need.importance)} · Perf {formatScore(need.performance)} · Gap {formatSignedScore(need.gap)}
                </small>
              </div>
              <em>{STATUS_LABEL[need.status]}</em>
            </article>
          ))}
        </div>
      </GlassCard>

      <GlassCard interactive={false} className="needs-panel">
        <SectionTitle icon={BarChart3} title="Kesenjangan Kebutuhan" subtitle="Gap positif = ekspektasi belum terpenuhi" />
        <div className="gap-bars">
          {needs.slice().sort((a, b) => b.gap - a.gap).map((need) => (
            <div className="gap-bars__row" key={need.id}>
              <span>{need.label}</span>
              <strong>{formatSignedScore(need.gap)}</strong>
              <ProgressBar value={Math.max(0, need.gap)} max={maxGap} tone={need.status === 'critical' ? 'red' : need.status === 'high' ? 'orange' : 'blue'} size="sm" />
              <small>Importance {formatScore(need.importance)} · Performance {formatScore(need.performance)}</small>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}
