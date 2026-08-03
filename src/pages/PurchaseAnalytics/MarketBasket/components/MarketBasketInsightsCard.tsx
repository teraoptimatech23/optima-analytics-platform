import { Lightbulb, ListChecks } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { MarketBasketInsights } from '@/data/marketBasketSelectors'

export default function MarketBasketInsightsCard({
  insights,
  recommendations,
  methodology,
}: {
  insights: string[]
  recommendations: MarketBasketInsights['recommendations']
  methodology: MarketBasketInsights['methodology']
}) {
  return (
    <GlassCard interactive={false} className="market-panel">
      <SectionTitle icon={Lightbulb} title="Market Basket Insights" subtitle="Generated dari rule yang lolos threshold" />
      <ol className="market-insights-list">
        {insights.map((insight) => <li key={insight}>{insight}</li>)}
      </ol>
      <SectionTitle icon={ListChecks} title="Recommended Actions" subtitle="Tidak mengklaim uplift atau revenue pasti" />
      <div className="market-actions">
        {recommendations.map((row) => (
          <article key={row.ruleId}>
            <span className={`market-priority market-priority--${row.priority}`}>{row.priority}</span>
            <strong>{row.title}</strong>
            <p>{row.evidence}</p>
            <small>{row.action}</small>
          </article>
        ))}
      </div>
      <p className="market-methodology">{methodology.supportFormula} · {methodology.confidenceFormula} · {methodology.liftFormula}</p>
    </GlassCard>
  )
}
