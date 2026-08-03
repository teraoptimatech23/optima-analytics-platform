import { Crosshair } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { PainPointInsights } from '@/data/painPointSelectors'
import { formatNumber, formatPercent, formatPriority, formatScore } from '@/data/formatters'

const QUADRANT_LABEL = {
  critical: 'Critical',
  'high-impact': 'High Impact, Low Frequency',
  'frequent-manageable': 'Frequent but Manageable',
  'low-priority': 'Low Priority',
} as const

export default function PainPointPriorityMatrix({ data }: { data: PainPointInsights }) {
  const avgFrequency = data.matrix.reduce((sum, point) => sum + point.frequencyRate, 0) / (data.matrix.length || 1)
  const avgSeverity = data.matrix.reduce((sum, point) => sum + point.severity, 0) / (data.matrix.length || 1)
  const top = data.matrix[0]

  return (
    <GlassCard interactive={false} className="pain-matrix-card">
      <SectionTitle icon={Crosshair} title="Pain Point Priority Matrix" subtitle="Frequency tinggi + severity tinggi = tindakan paling mendesak" tone="red" />
      <div className="pain-matrix-brief">
        <article>
          <span>Masalah paling mendesak</span>
          <strong>{top?.label ?? '-'}</strong>
          <small>{formatNumber(top?.affectedCustomers ?? 0)} pelanggan · severity {formatScore(top?.severity ?? 0)}/5</small>
        </article>
        <article>
          <span>Cara baca</span>
          <strong>Kanan = banyak terdampak, atas = dampak tinggi</strong>
          <small>Garis pembagi mengikuti rata-rata frequency dan severity aktif.</small>
        </article>
      </div>

      <div className="pain-matrix-layout">
        <div className="pain-matrix-stage">
          <span className="pain-axis pain-axis--y">Severity / business impact naik</span>
          <div className="pain-matrix">
            <span className="pain-matrix__axis pain-matrix__axis--x" style={{ left: `${avgFrequency * 100}%` }} />
            <span className="pain-matrix__axis pain-matrix__axis--y" style={{ top: `${100 - (avgSeverity / 5) * 100}%` }} />
            <span className="pain-matrix__label pain-matrix__label--critical">Critical</span>
            <span className="pain-matrix__label pain-matrix__label--impact">High Impact</span>
            <span className="pain-matrix__label pain-matrix__label--freq">Frequent</span>
            <span className="pain-matrix__label pain-matrix__label--low">Low Priority</span>
            {data.matrix.map((point) => (
              <button
                className={`pain-point-dot pain-point-dot--${point.quadrant} ${point.priorityRank <= 5 ? 'pain-point-dot--named' : ''}`}
                key={point.id}
                style={{
                  left: `${Math.max(6, Math.min(94, point.frequencyRate * 100))}%`,
                  top: `${Math.max(7, Math.min(93, 100 - (point.severity / 5) * 100))}%`,
                }}
                title={`${point.label}: ${formatPercent(point.frequencyRate)} affected, severity ${formatScore(point.severity)}, satisfaction impact ${formatScore(point.satisfactionImpact)}, NPS ${Math.round(point.npsImpact)} poin, rank #${point.priorityRank}`}
                type="button"
              >
                <span>{point.priorityRank}</span>
                {point.priorityRank <= 5 && <b>{point.label}</b>}
              </button>
            ))}
          </div>
          <span className="pain-axis pain-axis--x">Frequency / affected customers naik</span>
        </div>

        <aside className="pain-matrix-reading">
          <strong>Urutan baca</strong>
          <p>Prioritaskan titik merah, lalu cek titik oranye yang dampaknya besar walau belum sering terjadi.</p>
          {data.matrix.slice(0, 6).map((point) => (
            <article className={`pain-matrix-reading__item pain-matrix-reading__item--${point.quadrant}`} key={point.id}>
              <span>#{point.priorityRank}</span>
              <div>
                <b>{point.label}</b>
                <small>{QUADRANT_LABEL[point.quadrant]} · {formatPriority(data.painPoints.find((item) => item.id === point.id)?.priorityScore ?? 0)}</small>
              </div>
            </article>
          ))}
        </aside>
      </div>
    </GlassCard>
  )
}
