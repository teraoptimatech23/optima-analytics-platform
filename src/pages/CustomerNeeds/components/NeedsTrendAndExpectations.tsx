import { useMemo, useState } from 'react'
import { LineChart, Star } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CustomerNeedsInsights } from '@/data/customerNeedsSelectors'
import { formatPercent, formatScore, formatSignedScore } from '@/data/formatters'

interface NeedsTrendAndExpectationsProps {
  data: CustomerNeedsInsights
}

export default function NeedsTrendAndExpectations({ data }: NeedsTrendAndExpectationsProps) {
  const [selectedNeed, setSelectedNeed] = useState(data.needs[0]?.id ?? '')
  const trend = data.trends.filter((point) => point.needId === selectedNeed)
  const selected = data.needs.find((need) => need.id === selectedNeed) ?? data.needs[0]
  const topExpectations = useMemo(() => [...data.needs].sort((a, b) => b.importance - a.importance).slice(0, 5), [data.needs])
  const maxGap = Math.max(0.1, ...trend.map((point) => Math.abs(point.gap)))

  return (
    <section className="customer-needs__grid customer-needs__grid--two" aria-label="Tren dan ekspektasi kebutuhan">
      <GlassCard interactive={false} className="needs-panel">
        <SectionTitle
          icon={LineChart}
          title="Tren Kebutuhan Pelanggan"
          subtitle="Fallback periodik dari satisfaction transaksi aktif"
          meta={(
            <select value={selectedNeed} onChange={(event) => setSelectedNeed(event.target.value)} aria-label="Pilih kebutuhan">
              {data.needs.map((need) => <option key={need.id} value={need.id}>{need.label}</option>)}
            </select>
          )}
        />
        <div className="trend-card">
          <strong>{selected?.label}</strong>
          {trend.map((point) => (
            <div className="trend-row" key={point.period}>
              <span>{point.period}</span>
              <ProgressBar value={Math.abs(point.gap)} max={maxGap} tone={point.gap > 0 ? 'orange' : 'green'} size="sm" />
              <em>{formatSignedScore(point.gap)}</em>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard interactive={false} className="needs-panel">
        <SectionTitle icon={Star} title="Ekspektasi Utama Pelanggan" subtitle="Top 5 importance tertinggi" tone="orange" />
        <div className="expectation-list">
          {topExpectations.map((need, index) => (
            <article key={need.id}>
              <span>{index + 1}</span>
              <div>
                <strong>{need.label}</strong>
                <small>
                  Importance {formatScore(need.importance)} · positive {formatPercent(need.positiveRate)} · gap {formatSignedScore(need.gap)}
                </small>
              </div>
              <b>{formatScore(need.performance)}</b>
            </article>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}
