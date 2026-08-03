import { ArrowUpRight, ClipboardCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { AIInsightAction } from '@/data/aiInsightSelectors'

export default function PriorityActions({ actions }: { actions: AIInsightAction[] }) {
  return (
    <GlassCard interactive={false} className="ai-panel">
      <SectionTitle icon={ClipboardCheck} title="Priority Actions" subtitle="Rekomendasi deduplicated dari insight terkait" />
      <div className="ai-action-list">
        {actions.map((action) => (
          <article key={action.id}>
            <span className={`ai-priority ai-priority--${action.priority}`}>{action.priority}</span>
            <h3>{action.title}</h3>
            <p>{action.reason}</p>
            <dl>
              <div><dt>Owner</dt><dd>{action.owner}</dd></div>
              <div><dt>Entity</dt><dd>{action.affectedEntity}</dd></div>
              <div><dt>Expected impact</dt><dd>{action.expectedDirection}</dd></div>
            </dl>
            <ul>{action.evidence.slice(0, 3).map((item) => <li key={`${action.id}-${item}`}>{item}</li>)}</ul>
            {action.route && <Link to={action.route}>Open source <ArrowUpRight size={14} /></Link>}
          </article>
        ))}
      </div>
    </GlassCard>
  )
}
