import { Network } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { AIInsightRelationship } from '@/data/aiInsightSelectors'
import { formatPercent } from '@/data/formatters'

export default function RelatedSignals({ relationships }: { relationships: AIInsightRelationship[] }) {
  return (
    <GlassCard interactive={false} className="ai-panel">
      <SectionTitle icon={Network} title="Related Signals" subtitle="Hubungan statistik tidak selalu menunjukkan sebab-akibat" tone="purple" />
      <div className="ai-relationship-list">
        {relationships.map((row) => (
          <article key={`${row.source}-${row.target}`}>
            <div className="ai-relationship-list__line">
              <span>{row.source}</span>
              <i style={{ width: `${Math.max(14, row.strength * 100)}%` }} />
              <span>{row.target}</span>
            </div>
            <strong>{row.label}</strong>
            <p>{row.interpretation}</p>
            <small>{formatPercent(row.strength)} strength · {row.sampleSize} outlet sample · {row.direction}</small>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}
