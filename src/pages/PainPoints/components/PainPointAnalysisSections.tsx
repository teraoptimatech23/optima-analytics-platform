import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Activity, Clock, MapPin, UsersRound } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { PainPointCompareDimension, PainPointInsights } from '@/data/painPointSelectors'
import { formatNumber, formatPercent, formatScore } from '@/data/formatters'

interface PainPointAnalysisSectionsProps {
  data: PainPointInsights
  compareDimension: PainPointCompareDimension
  metric: 'frequencyRate' | 'severity' | 'businessImpact'
  onCompareDimensionChange: (value: PainPointCompareDimension) => void
  onMetricChange: (value: 'frequencyRate' | 'severity' | 'businessImpact') => void
}

export function CustomerImpactComparison({ data }: { data: PainPointInsights }) {
  const top = data.painPoints[0]
  const impacted = [
    ['Satisfaction', formatScore(top?.satisfactionImpact ?? 0), Math.min(100, Math.abs(top?.satisfactionImpact ?? 0) * 100)],
    ['NPS', `${Math.round(top?.npsImpact ?? 0)} poin`, Math.min(100, Math.abs(top?.npsImpact ?? 0) * 3)],
    ['Repeat', formatPercent(top?.repeatImpact ?? 0), Math.min(100, Math.abs(top?.repeatImpact ?? 0) * 100)],
    ['Business Impact', formatScore(top?.businessImpact ?? 0), Math.min(100, (top?.businessImpact ?? 0) * 50)],
  ] as const

  return (
    <GlassCard interactive={false} className="pain-panel">
      <SectionTitle icon={Activity} title="Dampak terhadap Pelanggan" subtitle="Perbedaan terkait pain point prioritas, bukan klaim kausal" />
      <div className="impact-bars">
        {impacted.map(([label, value, width]) => (
          <div className="impact-bars__row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <ProgressBar value={width} tone="orange" size="sm" />
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

export default function PainPointAnalysisSections({
  data,
  compareDimension,
  metric,
  onCompareDimensionChange,
  onMetricChange,
}: PainPointAnalysisSectionsProps) {
  const segments = useMemo(() => [...new Set(data.segmentComparison.map((row) => row.segment))], [data.segmentComparison])
  const points = data.painPoints.slice(0, 6)
  const maxValue = metric === 'frequencyRate' ? 1 : metric === 'severity' ? 5 : Math.max(1, ...data.segmentComparison.map((row) => row.businessImpact))
  const [trendPoint, setTrendPoint] = useState(data.painPoints[0]?.id ?? '')
  const trendRows = data.trends.filter((row) => row.painPointId === trendPoint)

  return (
    <>
      <section className="pain-points__grid pain-points__grid--two">
        <CustomerImpactComparison data={data} />

        <GlassCard interactive={false} className="pain-panel">
          <SectionTitle icon={MapPin} title="Sebaran Pain Point" subtitle="Outlet dengan pain point rate tertinggi" tone="purple" />
          <div className="location-list">
            {data.locations.slice(0, 6).map((location, index) => (
              <article key={location.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{location.label}</strong>
                  <small>{location.topPainPoint} · NPS {Math.round(location.nps)}</small>
                  <ProgressBar value={location.painPointRate * 100} tone="purple" size="sm" />
                </div>
                <b>{formatPercent(location.painPointRate)}</b>
              </article>
            ))}
          </div>
        </GlassCard>
      </section>

      <section className="pain-points__grid pain-points__grid--two">
        <GlassCard interactive={false} className="pain-panel">
          <SectionTitle
            icon={UsersRound}
            title="Pain Point Berdasarkan Segmen"
            subtitle="Bandingkan region atau outlet"
            meta={(
              <div className="pain-controls">
                <select value={compareDimension} onChange={(event) => onCompareDimensionChange(event.target.value as PainPointCompareDimension)}>
                  <option value="region">Region</option>
                  <option value="outlet">Outlet</option>
                </select>
                <select value={metric} onChange={(event) => onMetricChange(event.target.value as 'frequencyRate' | 'severity' | 'businessImpact')}>
                  <option value="frequencyRate">Frequency</option>
                  <option value="severity">Severity</option>
                  <option value="businessImpact">Customer Impact</option>
                </select>
              </div>
            )}
          />
          <div className="pain-heatmap">
            <div className="pain-heatmap__head">
              <span>Pain Point</span>
              {segments.map((segment) => <span key={segment}>{segment}</span>)}
            </div>
            {points.map((point) => (
              <div className="pain-heatmap__row" key={point.id}>
                <strong>{point.label}</strong>
                {segments.map((segment) => {
                  const cell = data.segmentComparison.find((row) => row.segment === segment && row.painPointId === point.id)
                  const value = cell?.[metric] ?? 0
                  const heat = metric === 'frequencyRate' ? value : value / maxValue
                  return (
                    <span key={segment} style={{ '--heat': Math.max(0, Math.min(1, heat)) } as CSSProperties}>
                      {metric === 'frequencyRate' ? formatPercent(value, 0) : formatScore(value, 1)}
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard interactive={false} className="pain-panel">
          <SectionTitle
            icon={Clock}
            title="Tren dan Konteks Waktu"
            subtitle="Volume dan severity pada periode aktif"
            meta={(
              <select value={trendPoint} onChange={(event) => setTrendPoint(event.target.value)}>
                {data.painPoints.map((point) => <option key={point.id} value={point.id}>{point.label}</option>)}
              </select>
            )}
            tone="orange"
          />
          <div className="trend-context-grid">
            <div className="pain-trend-list">
              {trendRows.map((row) => (
                <article key={row.period}>
                  <span>{row.period}</span>
                  <ProgressBar value={row.severity} max={5} tone="orange" size="sm" />
                  <b>{formatNumber(row.reportCount)}</b>
                </article>
              ))}
            </div>
            <div className="context-list">
              {data.contexts.slice(0, 6).map((row) => (
                <article key={`${row.value}-${row.painPointId}`}>
                  <span>{row.value}</span>
                  <strong>{formatScore(row.severity, 1)}/5</strong>
                  <small>{formatNumber(row.reportCount)} laporan</small>
                </article>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>
    </>
  )
}
