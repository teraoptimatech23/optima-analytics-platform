import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { Grid2x2, Rows3 } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CompareDimension, CustomerNeedsInsights } from '@/data/customerNeedsSelectors'
import { formatNumber, formatScore, formatSignedScore } from '@/data/formatters'

interface NeedsCategoryAndComparisonProps {
  data: CustomerNeedsInsights
  compareDimension: CompareDimension
  metric: 'importance' | 'performance' | 'gap'
  onCompareDimensionChange: (value: CompareDimension) => void
  onMetricChange: (value: 'importance' | 'performance' | 'gap') => void
}

export default function NeedsCategoryAndComparison({
  data,
  compareDimension,
  metric,
  onCompareDimensionChange,
  onMetricChange,
}: NeedsCategoryAndComparisonProps) {
  const segments = useMemo(() => [...new Set(data.segmentComparison.map((row) => row.segment))], [data.segmentComparison])
  const needs = data.needs.slice(0, 6)
  const maxValue = metric === 'gap' ? Math.max(0.1, ...data.segmentComparison.map((row) => Math.max(0, row.gap))) : 5

  return (
    <section className="customer-needs__grid customer-needs__grid--two" aria-label="Kategori dan perbandingan kebutuhan">
      <GlassCard interactive={false} className="needs-panel">
        <SectionTitle icon={Grid2x2} title="Detail Kebutuhan per Kategori" subtitle="Hanya kategori dengan atribut tersedia" />
        <div className="category-cards">
          {data.categories.map((category) => (
            <article className="category-card" key={category.id}>
              <header>
                <strong>{category.label}</strong>
                <span>{formatNumber(category.responseCount)} responden</span>
              </header>
              <dl>
                <div><dt>Importance</dt><dd>{formatScore(category.importance)}</dd></div>
                <div><dt>Performance</dt><dd>{formatScore(category.performance)}</dd></div>
                <div><dt>Gap</dt><dd>{formatSignedScore(category.gap)}</dd></div>
              </dl>
              <p>Top issue: {category.topIssue}</p>
            </article>
          ))}
        </div>
      </GlassCard>

      <GlassCard interactive={false} className="needs-panel">
        <SectionTitle
          icon={Rows3}
          title="Kebutuhan Berdasarkan Segmen"
          subtitle="Dataset needs mendukung perbandingan region/outlet"
          meta={(
            <div className="needs-controls">
              <select value={compareDimension} onChange={(event) => onCompareDimensionChange(event.target.value as CompareDimension)} aria-label="Bandingkan berdasarkan">
                <option value="region">Region</option>
                <option value="outlet">Outlet</option>
              </select>
              <select value={metric} onChange={(event) => onMetricChange(event.target.value as 'importance' | 'performance' | 'gap')} aria-label="Metric comparison">
                <option value="importance">Importance</option>
                <option value="performance">Performance</option>
                <option value="gap">Gap</option>
              </select>
            </div>
          )}
          tone="purple"
        />
        <div className="needs-heatmap">
          <div className="needs-heatmap__head">
            <span>Kebutuhan</span>
            {segments.map((segment) => <span key={segment}>{segment}</span>)}
          </div>
          {needs.map((need) => (
            <div className="needs-heatmap__row" key={need.id}>
              <strong>{need.label}</strong>
              {segments.map((segment) => {
                const cell = data.segmentComparison.find((row) => row.segment === segment && row.needId === need.id)
                const value = cell?.[metric] ?? 0
                const percent = metric === 'gap' ? Math.max(0, value) / maxValue : value / maxValue
                return (
                  <span key={segment} style={{ '--heat': percent } as CSSProperties}>
                    {metric === 'gap' ? formatSignedScore(value) : formatScore(value)}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}
