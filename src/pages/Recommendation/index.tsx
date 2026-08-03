import { useEffect, useMemo, useState } from 'react'
import {
  BadgeInfo,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  ExternalLink,
  Filter,
  Inbox,
  Network,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Target,
  TriangleAlert,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import {
  defaultRecommendationFilters,
  queryRecommendations,
} from '@/data/recommendationSelectors'
import type { RecommendationFilters, RecommendationItem, RecommendationJson, RecommendationResult } from '@/data/recommendationSelectors'
import { formatCompactNumber, formatNumber, formatPercent } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useFilterStore } from '@/store/useFilterStore'
import './index.less'

const priorityLabels = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }
const kpiIcons = [ClipboardList, ShieldAlert, Target, CheckCircle2, Network, CircleAlert]

function impactText(item: RecommendationItem) {
  if (!item.estimatedImpact) return 'Impact level only'
  const { rangeLow, rangeHigh, unit, direction } = item.estimatedImpact
  if (rangeLow !== undefined && rangeHigh !== undefined) {
    const low = unit === 'IDR' ? `Rp${Math.round(rangeLow).toLocaleString('id-ID')}` : `${formatCompactNumber(rangeLow)} ${unit ?? ''}`
    const high = unit === 'IDR' ? `Rp${Math.round(rangeHigh).toLocaleString('id-ID')}` : `${formatCompactNumber(rangeHigh)} ${unit ?? ''}`
    return `${direction} · ${low} - ${high}`
  }
  return `${direction} · ${item.estimatedImpact.metric}`
}

function Controls({ data, local, setLocal }: { data: RecommendationResult; local: RecommendationFilters; setLocal: (filters: RecommendationFilters) => void }) {
  const patch = (next: Partial<RecommendationFilters>) => setLocal({ ...local, ...next })
  return (
    <GlassCard interactive={false} className="recommendation-panel recommendation-controls-panel">
      <div className="recommendation-panel__head">
        <div><span>Controls</span><h2>Recommendation Backlog Scope</h2></div>
        <button type="button" onClick={() => setLocal(defaultRecommendationFilters)}><RefreshCcw size={16} /> Reset Recommendation Filters</button>
      </div>
      <div className="recommendation-controls">
        <label>Category
          <select value={local.category} onChange={(event) => patch({ category: event.target.value as RecommendationFilters['category'] })}>
            <option value="all">Semua category</option>
            {data.availableCategories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label>Priority
          <select value={local.priority} onChange={(event) => patch({ priority: event.target.value as RecommendationFilters['priority'] })}>
            <option value="all">Semua priority</option>
            {Object.keys(priorityLabels).map((priority) => <option key={priority} value={priority}>{priorityLabels[priority as keyof typeof priorityLabels]}</option>)}
          </select>
        </label>
        <label>Owner
          <select value={local.owner} onChange={(event) => patch({ owner: event.target.value })}>
            <option value="all">Semua owner</option>
            {data.availableOwners.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
          </select>
        </label>
        <label>Status
          <select value={local.status} onChange={(event) => patch({ status: event.target.value as RecommendationFilters['status'] })}>
            <option value="all">Semua status</option>
            <option value="new">New</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>
        <label>Impact
          <select value={local.impact} onChange={(event) => patch({ impact: event.target.value as RecommendationFilters['impact'] })}>
            <option value="all">Semua impact</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label>Effort
          <select value={local.effort} onChange={(event) => patch({ effort: event.target.value as RecommendationFilters['effort'] })}>
            <option value="all">Semua effort</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>Confidence
          <select value={local.confidence} onChange={(event) => patch({ confidence: event.target.value as RecommendationFilters['confidence'] })}>
            <option value="all">Semua confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label>Source
          <select value={local.sourceModule} onChange={(event) => patch({ sourceModule: event.target.value })}>
            <option value="all">Semua source</option>
            {data.availableSourceModules.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
        </label>
        <label>Entity
          <select value={local.entityType} onChange={(event) => patch({ entityType: event.target.value })}>
            <option value="all">Semua target</option>
            {data.availableEntityTypes.map((entity) => <option key={entity} value={entity}>{entity}</option>)}
          </select>
        </label>
        <label>Blocked
          <select value={local.blocked} onChange={(event) => patch({ blocked: event.target.value as RecommendationFilters['blocked'] })}>
            <option value="all">All</option>
            <option value="blocked">Blocked only</option>
            <option value="not-blocked">Not blocked</option>
          </select>
        </label>
        <label>Conflict
          <select value={local.conflicted} onChange={(event) => patch({ conflicted: event.target.value as RecommendationFilters['conflicted'] })}>
            <option value="all">All</option>
            <option value="conflicted">Conflicted</option>
            <option value="not-conflicted">No conflict</option>
          </select>
        </label>
        <label>Sort
          <select value={local.sortBy} onChange={(event) => patch({ sortBy: event.target.value as RecommendationFilters['sortBy'] })}>
            <option value="score">Score</option>
            <option value="priority">Priority</option>
            <option value="impact">Impact</option>
            <option value="confidence">Confidence</option>
            <option value="effort">Effort</option>
            <option value="latest">Latest</option>
          </select>
        </label>
      </div>
    </GlassCard>
  )
}

function SummaryCards({ data }: { data: RecommendationResult }) {
  const cards = [
    ['Active Recommendations', data.summary.totalRecommendations, `${data.summary.criticalCount} critical · ${data.summary.highCount} high`],
    ['Action Coverage', data.summary.actionCoverage, `${data.coverage.risksWithRecommendation}/${data.coverage.eligibleRisks} eligible risks`, 'percent'],
    ['Blocked', data.summary.blockedCount, 'Dependency/data belum tersedia'],
    ['Avg Confidence', data.summary.averageConfidence, 'Internal evidence score', 'percent'],
    ['High Impact', data.summary.estimatedHighImpactCount, 'Impact level from evidence'],
    ['Unaddressed Risks', data.summary.unaddressedRiskCount, 'Tidak dipaksa jadi action'],
  ] as const
  return (
    <section className="recommendation-summary">
      {cards.map(([label, value, detail, display], index) => {
        const Icon = kpiIcons[index % kpiIcons.length]!
        return (
          <GlassCard interactive={false} className="recommendation-kpi" key={label}>
            <span className="recommendation-kpi__icon"><Icon size={18} /></span>
            <span>{label}</span>
            <strong>{display === 'percent' ? formatPercent(value) : formatNumber(value)}</strong>
            <small>{detail}</small>
          </GlassCard>
        )
      })}
    </section>
  )
}

function Executive({ data, onSelect }: { data: RecommendationResult; onSelect: (item: RecommendationItem) => void }) {
  return (
    <section className="recommendation-executive">
      {data.executiveRecommendations.map((item) => (
        <GlassCard interactive={false} className={`recommendation-exec recommendation-exec--${item.priority}`} key={item.id}>
          <div>
            <span>{priorityLabels[item.priority]} · {item.category}</span>
            <strong>{item.title}</strong>
            <p>{item.summary}</p>
          </div>
          <dl>
            <div><dt>Target</dt><dd>{item.target.entityLabel}</dd></div>
            <div><dt>Owner</dt><dd>{item.owner}</dd></div>
            <div><dt>Confidence</dt><dd>{formatPercent(item.confidenceScore)} · {item.confidenceLabel}</dd></div>
            <div><dt>Impact</dt><dd>{impactText(item)}</dd></div>
          </dl>
          <button type="button" onClick={() => onSelect(item)}>Review Evidence</button>
        </GlassCard>
      ))}
    </section>
  )
}

function Matrix({ data, onSelect }: { data: RecommendationResult; onSelect: (item: RecommendationItem) => void }) {
  const byId = new Map(data.recommendations.map((item) => [item.id, item]))
  return (
    <GlassCard interactive={false} className="recommendation-panel">
      <div className="recommendation-panel__head">
        <div><span>Decision Matrix</span><h2>Impact vs Effort</h2></div>
        <small>Bubble size follows recommendation score; no random impact/effort.</small>
      </div>
      <div className="recommendation-matrix" aria-label="Impact effort matrix">
        {data.impactEffortMatrix.map((point) => {
          const item = byId.get(point.recommendationId)
          return (
            <button
              type="button"
              key={point.recommendationId}
              className={`priority-${point.priority}`}
              style={{ left: `${(point.effortScore - 0.7) * 35}%`, bottom: `${(point.impactScore - 0.7) * 35}%`, width: `${28 + point.score / 4}px`, height: `${28 + point.score / 4}px` }}
              onClick={() => item && onSelect(item)}
              title={point.title}
            >
              {point.score}
            </button>
          )
        })}
        <span className="matrix-label matrix-label--quick">Quick Wins</span>
        <span className="matrix-label matrix-label--strategic">Strategic</span>
        <span className="matrix-label matrix-label--fill">Fill-Ins</span>
        <span className="matrix-label matrix-label--deprioritize">Deprioritize</span>
      </div>
    </GlassCard>
  )
}

function Breakdowns({ data }: { data: RecommendationResult }) {
  return (
    <div className="recommendation-grid recommendation-grid--two">
      <GlassCard interactive={false} className="recommendation-panel">
        <div className="recommendation-panel__head"><div><span>Category</span><h2>Category Breakdown</h2></div></div>
        <div className="recommendation-list">
          {data.categories.map((row) => (
            <article key={row.category}>
              <strong>{row.label}</strong>
              <span>{row.recommendationCount} recommendations · {row.criticalCount} critical · {formatPercent(row.averageConfidence)} confidence</span>
            </article>
          ))}
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="recommendation-panel">
        <div className="recommendation-panel__head"><div><span>Owners</span><h2>Owner Workload</h2></div></div>
        <div className="recommendation-list">
          {data.owners.map((row) => (
            <article key={row.owner}>
              <strong>{row.owner}</strong>
              <span>{row.recommendationCount} recommendations · {row.criticalCount} critical · {row.blockedCount} blocked</span>
            </article>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

function Backlog({ data, onSelect }: { data: RecommendationResult; onSelect: (item: RecommendationItem) => void }) {
  return (
    <GlassCard interactive={false} className="recommendation-panel recommendation-table-panel">
      <div className="recommendation-panel__head">
        <div><span>Backlog</span><h2>Recommendation Backlog</h2></div>
        <Filter size={18} />
      </div>
      <div className="recommendation-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Recommendation</th>
              <th>Priority</th>
              <th>Target</th>
              <th>Owner</th>
              <th>Evidence</th>
              <th>Impact/Effort</th>
              <th>Confidence</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.recommendations.slice(0, 40).map((item) => (
              <tr key={item.id} onClick={() => onSelect(item)}>
                <td><strong>{item.title}</strong><span>{item.category}</span></td>
                <td>{priorityLabels[item.priority]}</td>
                <td>{item.target.entityLabel}</td>
                <td>{item.owner}</td>
                <td>{item.evidence[0]?.label}: {item.evidence[0]?.formattedValue}</td>
                <td>{item.impact} / {item.effort}</td>
                <td>{formatPercent(item.confidenceScore)} · {item.confidenceLabel}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function SupportingPanels({ data }: { data: RecommendationResult }) {
  return (
    <div className="recommendation-grid recommendation-grid--two">
      <GlassCard interactive={false} className="recommendation-panel">
        <div className="recommendation-panel__head"><div><span>Insights</span><h2>Recommendation Insights</h2></div><Sparkles size={18} /></div>
        <div className="recommendation-list">
          {data.insights.map((insight) => <article key={insight}><strong>{insight}</strong></article>)}
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="recommendation-panel">
        <div className="recommendation-panel__head"><div><span>Unaddressed</span><h2>Unaddressed Risks</h2></div><ShieldAlert size={18} /></div>
        <div className="recommendation-list">
          {data.unaddressedRisks.slice(0, 8).map((risk) => (
            <article key={risk.id}>
              <strong>{risk.target} · {risk.module}</strong>
              <span>{risk.reason}</span>
              <small>{risk.reasonRecommendationMissing}</small>
            </article>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

function Methodology({ data }: { data: RecommendationResult }) {
  return (
    <GlassCard interactive={false} className="recommendation-panel">
      <div className="recommendation-panel__head"><div><span>Methodology</span><h2>Decision Support Guardrails</h2></div><BadgeInfo size={18} /></div>
      <div className="recommendation-list">
        {data.methodology.map((note) => <article key={note}><span>{note}</span></article>)}
      </div>
    </GlassCard>
  )
}

function Drawer({ item, onClose }: { item: RecommendationItem | null; onClose: () => void }) {
  if (!item) return null
  return (
    <div className="recommendation-drawer" role="dialog" aria-modal="true" aria-label="Recommendation detail drawer">
      <div className="recommendation-drawer__backdrop" onClick={onClose} />
      <aside>
        <button type="button" onClick={onClose} aria-label="Close drawer"><X size={18} /></button>
        <span>{priorityLabels[item.priority]} · {item.category}</span>
        <h2>{item.title}</h2>
        <p>{item.problemOrOpportunity}</p>
        <dl>
          <div><dt>Target</dt><dd>{item.target.entityLabel} · {item.target.entityType}</dd></div>
          <div><dt>Owner</dt><dd>{item.owner}</dd></div>
          <div><dt>Score</dt><dd>{item.recommendationScore}/100 · urgency {item.urgencyScore}/100</dd></div>
          <div><dt>Confidence</dt><dd>{formatPercent(item.confidenceScore)} · {item.confidenceLabel}</dd></div>
          <div><dt>Impact Basis</dt><dd>{item.impactBasis}</dd></div>
          <div><dt>Limitation</dt><dd>{item.limitationNote}</dd></div>
          {item.blocker ? <div><dt>Blocker</dt><dd>{item.blocker}</dd></div> : null}
        </dl>
        <section>
          <h3>Evidence</h3>
          {item.evidence.map((evidence) => <p key={evidence.id}><strong>{evidence.label}</strong>: {evidence.formattedValue} · {evidence.sourceModule}</p>)}
        </section>
        <section>
          <h3>Action Steps</h3>
          {item.actionSteps.map((step) => <p key={step.id}>{step.order}. {step.label}</p>)}
        </section>
        <section>
          <h3>Formula</h3>
          <p>{item.scoreFormula}</p>
          <p>{item.confidenceFormula}</p>
        </section>
        <nav>
          {item.route ? <Link to={item.route}>Open Source Page <ExternalLink size={14} /></Link> : null}
        </nav>
      </aside>
    </div>
  )
}

export default function Recommendation() {
  useInsights()
  const filters = useFilterStore((state) => state.filters)
  const [payload, setPayload] = useState<RecommendationJson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [local, setLocal] = useState<RecommendationFilters>(defaultRecommendationFilters)
  const [selected, setSelected] = useState<RecommendationItem | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/assets/recommendations.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<RecommendationJson>
      })
      .then((json) => {
        if (!cancelled) {
          setPayload(json)
          setError(null)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const data = useMemo(() => (payload ? queryRecommendations(payload, filters, local) : null), [payload, filters, local])
  const empty = !loading && !error && data !== null && data.summary.totalRecommendations === 0

  let body
  if (loading || (!data && !error)) body = <DashboardSkeleton />
  else if (error) body = <StateMessage icon={TriangleAlert} tone="danger" title="Recommendation gagal dimuat" description={error} />
  else if (empty || !data) body = <StateMessage icon={Inbox} title="Tidak ada rekomendasi untuk kombinasi filter ini." description="Reset filter lokal atau perluas filter global." />
  else {
    body = (
      <>
        <Controls data={data} local={local} setLocal={setLocal} />
        <SummaryCards data={data} />
        {data.summary.blockedCount ? <StateMessage icon={CircleAlert} title="Sebagian rekomendasi blocked" description="Dependency atau data source belum cukup; recommendation tersebut tidak dipresentasikan sebagai executable action." /> : null}
        <Executive data={data} onSelect={setSelected} />
        <div className="recommendation-grid recommendation-grid--two">
          <Matrix data={data} onSelect={setSelected} />
          <Breakdowns data={data} />
        </div>
        <Backlog data={data} onSelect={setSelected} />
        <SupportingPanels data={data} />
        <Methodology data={data} />
        <Drawer item={selected} onClose={() => setSelected(null)} />
      </>
    )
  }

  return (
    <div className="recommendation-page">
      <p className="sr-only" role="status" aria-live="polite">{loading ? 'Memuat Recommendation' : 'Recommendation siap'}</p>
      <section className="recommendation-hero">
        <div className="hero-copy">
          <span>Decision Support</span>
          <h1>Recommendation <ClipboardList size={22} /></h1>
          <p>
            {data
              ? `${data.periodLabel} · ${data.summary.totalRecommendations} Rekomendasi Aktif · ${data.summary.criticalCount} Prioritas Kritis. Prioritaskan tindakan berdasarkan peluang, risiko, kebutuhan pelanggan, performa marketing, dan prediksi bisnis dari seluruh dashboard.`
              : 'Prioritaskan tindakan berdasarkan peluang, risiko, kebutuhan pelanggan, performa marketing, dan prediksi bisnis dari seluruh dashboard.'}
          </p>
        </div>
        <div className="recommendation-source-badge">
          <BadgeInfo size={16} />
          <span>Recommendation Engine: Synthetic Decision Support</span>
        </div>
      </section>
      {body}
      <footer className="recommendation-footer">Rekomendasi merupakan decision support berbasis data dan bukan keputusan otomatis. Tidak ada action yang dikirim atau dieksekusi.</footer>
    </div>
  )
}
