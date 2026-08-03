import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import type { AIInsightItem, AIInsightResult } from '@/data/aiInsightSelectors'
import { formatPercent } from '@/data/formatters'

export default function InsightDetailDrawer({
  insight,
  methodology,
  onClose,
}: {
  insight: AIInsightItem | null
  methodology: AIInsightResult['methodology']
  onClose: () => void
}) {
  const panelRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!insight) return undefined
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panelRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusables = [...panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previous?.focus()
    }
  }, [insight, onClose])

  if (!insight) return null

  return (
    <div className="ai-drawer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="ai-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="ai-insight-detail-title" tabIndex={-1} ref={panelRef}>
        <header>
          <div>
            <span className="ai-chip">{insight.category} · {insight.priority}</span>
            <h2 id="ai-insight-detail-title">{insight.title}</h2>
            <p>{insight.summary}</p>
          </div>
          <button type="button" aria-label="Tutup detail insight" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="ai-drawer__metric">
          <strong>{insight.primaryMetric.formattedValue}</strong>
          <span>{insight.primaryMetric.label}</span>
          <em>{formatPercent(insight.confidence)} · {insight.confidenceLabel} evidence</em>
        </div>
        <section>
          <h3>Explanation</h3>
          <p>{insight.explanation}</p>
        </section>
        <section>
          <h3>Evidence</h3>
          <ul>
            {insight.evidence.map((item) => <li key={`${insight.id}-${item.label}`}>{item.label}: <strong>{item.value}</strong> <span>{item.sourceModule}</span></li>)}
          </ul>
        </section>
        <section>
          <h3>Calculation</h3>
          <p>{insight.metricFormula ?? 'Metric dihitung oleh selector sumber dan diringkas oleh deterministic insight engine.'}</p>
          <p>{methodology.confidenceFormula}</p>
        </section>
        <section>
          <h3>Affected Entities</h3>
          <div className="ai-drawer__chips">
            {insight.affectedEntities.map((entity) => <span key={`${entity.type}-${entity.label}`}>{entity.type}: {entity.label}</span>)}
          </div>
        </section>
        {insight.limitations?.length ? (
          <section>
            <h3>Limitations</h3>
            <ul>{insight.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        ) : null}
        {insight.recommendedAction && (
          <section>
            <h3>Recommended Action</h3>
            <p>{insight.recommendedAction}</p>
          </section>
        )}
        <footer>
          <button type="button" onClick={onClose}>Tutup</button>
          {insight.route && <Link to={insight.route}>Buka halaman sumber</Link>}
        </footer>
      </section>
    </div>
  )
}
