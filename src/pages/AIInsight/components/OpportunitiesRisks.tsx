import { ShieldAlert, Sparkles } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { AIInsightItem } from '@/data/aiInsightSelectors'
import { formatPercent } from '@/data/formatters'

export default function OpportunitiesRisks({ insights, onSelect }: { insights: AIInsightItem[]; onSelect: (insight: AIInsightItem) => void }) {
  const opportunities = insights.filter((row) => row.sentiment === 'positive' || row.category === 'opportunity').slice(0, 5)
  const risks = insights.filter((row) => row.sentiment === 'negative' || row.category === 'risk').slice(0, 5)

  const renderRows = (rows: AIInsightItem[]) => rows.map((insight) => (
    <button key={insight.id} type="button" className="ai-mini-row" onClick={() => onSelect(insight)}>
      <strong>{insight.title}</strong>
      <span>{insight.primaryMetric.formattedValue} · {formatPercent(insight.confidence)} confidence</span>
      <small>{insight.affectedEntities[0]?.label ?? insight.sourceModules.join(' + ')}</small>
    </button>
  ))

  return (
    <div className="ai-oprisk">
      <GlassCard interactive={false} className="ai-panel">
        <SectionTitle icon={Sparkles} title="Top Opportunities" subtitle="Peluang dengan evidence terkuat" tone="cyan" />
        <div className="ai-mini-list">{renderRows(opportunities)}</div>
      </GlassCard>
      <GlassCard interactive={false} className="ai-panel">
        <SectionTitle icon={ShieldAlert} title="Top Risks" subtitle="Risiko prioritas untuk ditindaklanjuti" tone="red" />
        <div className="ai-mini-list">{renderRows(risks)}</div>
      </GlassCard>
    </div>
  )
}
