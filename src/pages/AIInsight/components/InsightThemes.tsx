import { Boxes } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { AIInsightTheme } from '@/data/aiInsightSelectors'
import { formatPercent } from '@/data/formatters'

export default function InsightThemes({ themes }: { themes: AIInsightTheme[] }) {
  return (
    <GlassCard interactive={false} className="ai-panel">
      <SectionTitle icon={Boxes} title="Insight Themes" subtitle="Cluster tema dari insight aktif" />
      <div className="ai-theme-list">
        {themes.map((theme) => (
          <article key={theme.id} className={`ai-sentiment--${theme.sentiment}`}>
            <div>
              <strong>{theme.label}</strong>
              <span>{theme.insightCount} insight · {theme.criticalCount} critical</span>
            </div>
            <i><b style={{ width: `${Math.min(100, theme.avgPriorityScore)}%` }} /></i>
            <small>{formatPercent(theme.avgConfidence)} confidence · top entity {theme.topAffectedEntity}</small>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}
