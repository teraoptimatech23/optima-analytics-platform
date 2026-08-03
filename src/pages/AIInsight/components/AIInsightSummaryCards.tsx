import { AlertTriangle, Gauge, Lightbulb, ShieldAlert, Sparkles } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import type { AIInsightResult } from '@/data/aiInsightSelectors'
import { formatPercent } from '@/data/formatters'

export default function AIInsightSummaryCards({ data }: { data: AIInsightResult }) {
  const cards = [
    { label: 'Total Insights', value: data.summary.totalInsights.toLocaleString('id-ID'), note: `${data.summary.criticalInsights} critical`, icon: Sparkles, tone: 'blue' },
    { label: 'Opportunities', value: data.summary.opportunities.toLocaleString('id-ID'), note: 'peluang prioritas', icon: Lightbulb, tone: 'green' },
    { label: 'Risks', value: data.summary.risks.toLocaleString('id-ID'), note: 'risiko terdeteksi', icon: ShieldAlert, tone: 'red' },
    { label: 'Anomalies', value: data.summary.anomalies.toLocaleString('id-ID'), note: 'anomali time series', icon: AlertTriangle, tone: 'orange' },
    { label: 'Avg Confidence', value: formatPercent(data.summary.avgConfidence), note: 'internal evidence score', icon: Gauge, tone: 'cyan' },
  ]

  return (
    <section className="ai-insight__summary" aria-label="AI Insight summary">
      {cards.map(({ label, value, note, icon: Icon, tone }) => (
        <GlassCard key={label} compact className={`ai-kpi ai-kpi--${tone}`}>
          <span className="ai-kpi__icon"><Icon size={18} /></span>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{note}</small>
        </GlassCard>
      ))}
    </section>
  )
}
