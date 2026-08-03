import { ArrowUpRight, Crown } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { AIInsightItem } from '@/data/aiInsightSelectors'
import { formatPercent } from '@/data/formatters'

const labels = ['Biggest Opportunity', 'Highest Risk', 'Strongest Positive Trend', 'Most Important Customer Insight', 'Most Important Marketing Insight']

export default function ExecutiveInsightSummary({ insights, onSelect }: { insights: AIInsightItem[]; onSelect: (insight: AIInsightItem) => void }) {
  return (
    <GlassCard interactive={false} className="ai-panel">
      <SectionTitle icon={Crown} title="Executive Insight Summary" subtitle="Top signals lintas customer, purchase, experience, dan marketing" />
      <div className="ai-executive">
        {insights.map((insight, index) => (
          <article key={insight.id} className={`ai-executive__card ai-sentiment--${insight.sentiment}`} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') onSelect(insight) }}>
            <span className="ai-chip">{labels[index] ?? insight.category}</span>
            <h3>{insight.title}</h3>
            <p>{insight.summary}</p>
            <dl>
              <div><dt>{insight.primaryMetric.label}</dt><dd>{insight.primaryMetric.formattedValue}</dd></div>
              <div><dt>Confidence</dt><dd>{formatPercent(insight.confidence)} · {insight.confidenceLabel}</dd></div>
              <div><dt>Priority</dt><dd>{insight.priority}</dd></div>
            </dl>
            <ul>
              {insight.evidence.slice(0, 3).map((item) => <li key={`${insight.id}-${item.label}`}>{item.label}: {item.value}</li>)}
            </ul>
            <footer>
              <button type="button" onClick={() => onSelect(insight)}>Detail Evidence</button>
              {insight.route && <Link to={insight.route}>Lihat sumber <ArrowUpRight size={14} /></Link>}
            </footer>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}
