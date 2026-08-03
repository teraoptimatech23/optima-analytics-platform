import { Crosshair } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CustomerNeedsInsights } from '@/data/customerNeedsSelectors'
import { formatNumber, formatPriority, formatScore, formatSignedScore } from '@/data/formatters'

interface ImportancePerformanceMatrixProps {
  data: CustomerNeedsInsights
}

const QUADRANT_LABEL = {
  focus: 'Prioritas Utama',
  maintain: 'Pertahankan Kinerja',
  'low-priority': 'Prioritas Rendah',
  'possible-overkill': 'Berlebihan',
} as const

export default function ImportancePerformanceMatrix({ data }: ImportancePerformanceMatrixProps) {
  const xLine = (data.summary.avgPerformance / 5) * 100
  const yLine = 100 - (data.summary.avgImportance / 5) * 100
  const focusPoints = data.matrix.filter((point) => point.quadrant === 'focus')
  const topFocus = focusPoints[0] ?? data.matrix[0]
  const maintained = data.matrix.filter((point) => point.quadrant === 'maintain').slice(0, 3)

  return (
    <GlassCard interactive={false} className="needs-matrix-card">
      <SectionTitle icon={Crosshair} title="Peta Prioritas Kebutuhan" subtitle="Importance tinggi + performance rendah = harus diperbaiki dulu" />

      <div className="matrix-brief">
        <article className="matrix-brief__primary">
          <span>Fokus utama sekarang</span>
          <strong>{topFocus?.label ?? '-'}</strong>
          <small>
            Gap {formatSignedScore(topFocus?.gap ?? 0)} · {formatNumber(topFocus?.responseCount ?? 0)} responden · prioritas #{topFocus?.priorityRank ?? '-'}
          </small>
        </article>
        <article>
          <span>Cara baca</span>
          <strong>Atas = penting, kiri = belum memuaskan</strong>
          <small>Garis biru adalah rata-rata filter aktif, bukan target statis.</small>
        </article>
        <article>
          <span>Yang sudah kuat</span>
          <strong>{maintained.map((point) => point.label).join(', ') || '-'}</strong>
          <small>Pertahankan kualitas karena importance dan performance sama-sama tinggi.</small>
        </article>
      </div>

      <div className="matrix-layout">
        <div className="matrix-stage">
          <span className="matrix-axis-title matrix-axis-title--y">Importance pelanggan makin tinggi</span>
          <div className="needs-matrix" role="img" aria-label="Matrix importance performance kebutuhan pelanggan">
            <span className="needs-matrix__axis needs-matrix__axis--x" style={{ left: `${xLine}%` }} />
            <span className="needs-matrix__axis needs-matrix__axis--y" style={{ top: `${yLine}%` }} />
            <span className="needs-matrix__label needs-matrix__label--focus">Kerjakan dulu</span>
            <span className="needs-matrix__label needs-matrix__label--maintain">Jaga kualitas</span>
            <span className="needs-matrix__label needs-matrix__label--low">Pantau ringan</span>
            <span className="needs-matrix__label needs-matrix__label--over">Efisiensikan</span>
            {data.matrix.map((point) => (
              <button
                className={`matrix-point matrix-point--${point.quadrant} ${point.priorityRank <= 5 ? 'matrix-point--named' : ''}`}
                key={point.id}
                style={{
                  left: `${Math.max(6, Math.min(94, (point.performance / 5) * 100))}%`,
                  top: `${Math.max(7, Math.min(93, 100 - (point.importance / 5) * 100))}%`,
                }}
                title={`${point.label}: importance ${formatScore(point.importance)}, performance ${formatScore(point.performance)}, gap ${formatSignedScore(point.gap)}, ${point.responseCount.toLocaleString('id-ID')} responden, ranking #${point.priorityRank}`}
                type="button"
              >
                <span>{point.priorityRank}</span>
                {point.priorityRank <= 5 && <b>{point.label}</b>}
              </button>
            ))}
          </div>
          <span className="matrix-axis-title matrix-axis-title--x">Performance makin baik</span>
        </div>

        <aside className="matrix-reading">
          <strong>Prioritas baca chart</strong>
          <p>Mulai dari titik merah di kiri atas: kebutuhannya penting, tetapi pengalaman pelanggan belum mengejar ekspektasi.</p>
          <div className="matrix-reading__list">
            {data.matrix.slice(0, 6).map((point) => (
              <article className={`matrix-reading__item matrix-reading__item--${point.quadrant}`} key={point.id}>
                <span>#{point.priorityRank}</span>
                <div>
                  <b>{point.label}</b>
                  <small>{QUADRANT_LABEL[point.quadrant]} · {formatPriority(data.needs.find((need) => need.id === point.id)?.priorityScore ?? 0)}</small>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </GlassCard>
  )
}
