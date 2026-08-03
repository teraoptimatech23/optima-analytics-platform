import { ArrowUpRight, ListFilter } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { AIInsightItem, AIInsightResult } from '@/data/aiInsightSelectors'
import { formatPercent } from '@/data/formatters'

export default function InsightFeed({ data, onSelect }: { data: AIInsightResult; onSelect: (insight: AIInsightItem) => void }) {
  return (
    <GlassCard interactive={false} className="ai-panel ai-feed">
      <SectionTitle icon={ListFilter} title="Insight Feed" subtitle={`${data.filteredInsights.length} dari ${data.allInsights.length} insight sesuai filter lokal`} />
      {data.filteredInsights.length === 0 ? (
        <div className="ai-empty">Belum ada insight signifikan untuk kombinasi filter lokal ini. Coba longgarkan kategori, confidence, atau search.</div>
      ) : (
        <div className="ai-feed__list">
          {data.filteredInsights.map((insight) => (
            <article key={insight.id} className={`ai-feed__item ai-sentiment--${insight.sentiment}`}>
              <div className="ai-feed__meta">
                <span>{insight.id}</span>
                <span>{insight.category}</span>
                <span>{insight.priority}</span>
                <span>{formatPercent(insight.confidence)} · {insight.confidenceLabel}</span>
              </div>
              <h3>{insight.title}</h3>
              <p>{insight.explanation}</p>
              <div className="ai-feed__metric">
                <strong>{insight.primaryMetric.formattedValue}</strong>
                <span>{insight.primaryMetric.label}</span>
                {insight.comparison && <em>{insight.comparison.label}: {insight.comparison.formattedValue}</em>}
              </div>
              <div className="ai-feed__evidence">
                {insight.evidence.slice(0, 4).map((item) => <span key={`${insight.id}-${item.label}`}>{item.label}: {item.value}</span>)}
              </div>
              <footer>
                <span>{insight.sourceModules.join(' + ')}</span>
                <div>
                  <button type="button" onClick={() => onSelect(insight)}>Buka detail</button>
                  {insight.route && <Link to={insight.route}>Source <ArrowUpRight size={14} /></Link>}
                </div>
              </footer>
            </article>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
