import { useEffect, useMemo, useState } from 'react'
import {
  BadgeInfo,
  BarChart3,
  BrainCircuit,
  ExternalLink,
  Inbox,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import {
  defaultCustomerPerceptionLocalFilters,
  metricValue,
  queryCustomerPerception,
} from '@/data/customerPerceptionSelectors'
import type {
  CustomerPerceptionJson,
  CustomerPerceptionLocalFilters,
  CustomerPerceptionResult,
  PerceptionAttributeMetric,
  PerceptionDimensionMetric,
} from '@/data/customerPerceptionSelectors'
import { customerPerceptionDimensionLabels, customerPerceptionDimensions } from '@/config/customerPerceptionWeights'
import { formatCompactCurrency, formatNumber, formatPercent, formatScore } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useFilterStore } from '@/store/useFilterStore'
import './index.less'

const kpiIcons = [ShieldCheck, Target, Sparkles, BarChart3, Users, BrainCircuit]

function formatPerception(value: number) {
  return `${formatScore(value, 2)}/5`
}

function reliabilityLabel(score: number, status: string) {
  return `${Math.round(score)}/100 · ${status === 'high' ? 'High' : status === 'moderate' ? 'Moderate' : 'Low'} Reliability`
}

function Controls({ data, localFilters, setLocalFilters }: { data: CustomerPerceptionResult; localFilters: CustomerPerceptionLocalFilters; setLocalFilters: (filters: CustomerPerceptionLocalFilters) => void }) {
  const patch = (next: Partial<CustomerPerceptionLocalFilters>) => setLocalFilters({ ...localFilters, ...next })
  return (
    <GlassCard interactive={false} className="perception-panel perception-controls-panel">
      <div className="perception-panel__head">
        <div><span>Controls</span><h2>Perception Evidence Scope</h2></div>
        <button type="button" onClick={() => setLocalFilters(defaultCustomerPerceptionLocalFilters)}><RefreshCcw size={16} /> Reset Perception Filters</button>
      </div>
      <div className="perception-controls">
        <label>Dimension
          <select value={localFilters.dimension} onChange={(event) => patch({ dimension: event.target.value as CustomerPerceptionLocalFilters['dimension'], attribute: 'all' })}>
            <option value="all">Semua dimensi</option>
            {customerPerceptionDimensions.map((id) => <option key={id} value={id}>{customerPerceptionDimensionLabels[id]}</option>)}
          </select>
        </label>
        <label>Attribute
          <select value={localFilters.attribute} onChange={(event) => patch({ attribute: event.target.value })}>
            <option value="all">Semua atribut</option>
            {data.availableAttributes.filter((row) => localFilters.dimension === 'all' || row.dimensionId === localFilters.dimension).map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}
          </select>
        </label>
        <label>Source Type
          <select value={localFilters.sourceType} onChange={(event) => patch({ sourceType: event.target.value as CustomerPerceptionLocalFilters['sourceType'] })}>
            <option value="all">Semua source</option>
            <option value="direct-survey">Direct Survey</option>
            <option value="mixed">Mixed Evidence</option>
            <option value="behavioural-proxy">Behavioural Proxy</option>
          </select>
        </label>
        <label>Reliability
          <select value={localFilters.reliability} onChange={(event) => patch({ reliability: event.target.value as CustomerPerceptionLocalFilters['reliability'] })}>
            <option value="all">Semua reliability</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label>Persona
          <select value={localFilters.persona} onChange={(event) => patch({ persona: event.target.value })}>
            <option value="all">Semua persona</option>
            {data.availablePersonas.map((persona) => <option key={persona} value={persona}>{persona}</option>)}
          </select>
        </label>
        <label>Compare By
          <select value={localFilters.comparisonDimension} onChange={(event) => patch({ comparisonDimension: event.target.value as CustomerPerceptionLocalFilters['comparisonDimension'] })}>
            <option value="segment">Customer Segment</option>
            <option value="ageBand">Age Group</option>
            <option value="gender">Gender</option>
            <option value="channel">Purchase Channel</option>
            <option value="outlet">Outlet</option>
            <option value="region">Region</option>
            <option value="product">Product Preference</option>
            <option value="acquisition">Acquisition Source</option>
            <option value="persona">Persona</option>
          </select>
        </label>
        <label>Metric
          <select value={localFilters.metric} onChange={(event) => patch({ metric: event.target.value as CustomerPerceptionLocalFilters['metric'] })}>
            <option value="score">Score</option>
            <option value="positiveRate">Positive Rate</option>
            <option value="gap">Gap Flag</option>
            <option value="nps">NPS</option>
          </select>
        </label>
        <label>Group
          <select value={localFilters.group} onChange={(event) => patch({ group: event.target.value as CustomerPerceptionLocalFilters['group'] })}>
            <option value="all">Semua group</option>
            <option value="positive">Positive overall</option>
            <option value="neutral">Neutral overall</option>
            <option value="negative">Negative overall</option>
          </select>
        </label>
        <label>Member
          <select value={localFilters.member} onChange={(event) => patch({ member: event.target.value as CustomerPerceptionLocalFilters['member'] })}>
            <option value="all">Member + non-member</option>
            <option value="member">Member</option>
            <option value="non-member">Non-member</option>
          </select>
        </label>
        <label>Min Sample
          <input type="number" min={1} value={localFilters.minSampleSize} onChange={(event) => patch({ minSampleSize: Math.max(1, Number(event.target.value) || 1) })} />
        </label>
      </div>
    </GlassCard>
  )
}

function SummaryCards({ data }: { data: CustomerPerceptionResult }) {
  const cards = [
    { label: 'Overall Perception', value: formatPerception(data.summary.overallPerceptionScore), detail: `${formatNumber(data.summary.respondents)} responden` },
    { label: 'Brand Trust Signal', value: formatPerception(data.summary.brandTrustScore), detail: 'Mixed: NPS + recommend + satisfaction' },
    { label: 'Product Quality', value: formatPerception(data.summary.productQualityScore), detail: data.summary.strongestAttribute },
    { label: 'Price Fairness', value: formatPerception(data.summary.priceFairnessScore), detail: `Gap terbesar: ${data.summary.biggestGapAttribute}` },
    { label: 'Positive Rate', value: formatPercent(data.summary.positivePerceptionRate), detail: 'Bucket skor 4-5, bukan NLP' },
    { label: 'Negative Rate', value: formatPercent(data.summary.negativePerceptionRate), detail: reliabilityLabel(data.summary.averageReliabilityScore, 'high') },
  ]
  return (
    <section className="perception-summary">
      {cards.map((card, index) => {
        const Icon = kpiIcons[index % kpiIcons.length]!
        return (
          <GlassCard interactive={false} className="perception-kpi" key={card.label}>
            <span className="perception-kpi__icon"><Icon size={18} /></span>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.detail}</small>
          </GlassCard>
        )
      })}
    </section>
  )
}

function DimensionOverview({ rows, onSelect }: { rows: PerceptionDimensionMetric[]; onSelect: (row: PerceptionDimensionMetric) => void }) {
  const max = Math.max(...rows.map((row) => row.score), 1)
  return (
    <GlassCard interactive={false} className="perception-panel">
      <div className="perception-panel__head">
        <div><span>Perception Overview</span><h2>Dimension Score & Distribution</h2></div>
        <small>Positive = skor 4-5, Neutral = 3, Negative = 1-2.</small>
      </div>
      <div className="perception-dimensions">
        {rows.map((row) => (
          <button type="button" key={row.id} onClick={() => onSelect(row)}>
            <div>
              <strong>#{row.rank} {row.label}</strong>
              <span>{row.sourceType} · {row.responseCount.toLocaleString('id-ID')} samples · {reliabilityLabel(row.reliabilityScore, row.reliabilityStatus)}</span>
            </div>
            <b>{formatPerception(row.score)}</b>
            <i style={{ width: `${Math.max(4, row.score / max * 100)}%` }} />
            <dl>
              <div><dt>Positive</dt><dd>{formatPercent(row.positiveRate)}</dd></div>
              <div><dt>Neutral</dt><dd>{formatPercent(row.neutralRate)}</dd></div>
              <div><dt>Negative</dt><dd>{formatPercent(row.negativeRate)}</dd></div>
              <div><dt>Change</dt><dd>{row.previousScore ? `${row.scoreChange >= 0 ? '+' : ''}${formatScore(row.scoreChange, 2)}` : '-'}</dd></div>
            </dl>
          </button>
        ))}
      </div>
    </GlassCard>
  )
}

function AttributePanel({ title, rows, onSelect }: { title: string; rows: PerceptionAttributeMetric[]; onSelect: (row: PerceptionAttributeMetric) => void }) {
  return (
    <GlassCard interactive={false} className="perception-panel">
      <div className="perception-panel__head">
        <div><span>Attribute Analysis</span><h2>{title}</h2></div>
      </div>
      <div className="perception-attributes">
        {rows.map((row) => (
          <button type="button" key={row.id} onClick={() => onSelect(row)}>
            <strong>{row.label}</strong>
            <span>{formatPerception(row.score)} · {formatPercent(row.positiveRate)} positive · {row.sourceType}</span>
            <small>Gap {row.importance ? `${row.gap >= 0 ? '+' : ''}${formatScore(row.gap, 2)}` : 'n/a'} · {reliabilityLabel(row.reliabilityScore, row.reliabilityStatus)}</small>
          </button>
        ))}
      </div>
    </GlassCard>
  )
}

function ComparisonTable({ data }: { data: CustomerPerceptionResult }) {
  const max = Math.max(...data.activeComparison.map((row) => metricValue(row, data.localFilters.metric)), 1)
  return (
    <GlassCard interactive={false} className="perception-panel perception-table-panel">
      <div className="perception-panel__head">
        <div><span>Comparison</span><h2>Perception by {data.localFilters.comparisonDimension}</h2></div>
        <small>Filter lokal tidak mengubah filter global.</small>
      </div>
      <div className="perception-comparison">
        {data.activeComparison.slice(0, 12).map((row) => {
          const value = metricValue(row, data.localFilters.metric)
          return (
            <article key={row.id}>
              <div><strong>{row.label}</strong><span>{formatNumber(row.customerCount)} responden · NPS {formatScore(row.nps, 1)}</span></div>
              <i style={{ width: `${Math.max(3, value / max * 100)}%` }} />
              <dl>
                <div><dt>Overall</dt><dd>{formatPerception(row.overallPerception)}</dd></div>
                <div><dt>Product</dt><dd>{formatPerception(row.productScore)}</dd></div>
                <div><dt>Service</dt><dd>{formatPerception(row.serviceScore)}</dd></div>
                <div><dt>Repeat</dt><dd>{formatPercent(row.repeatRate)}</dd></div>
                <div><dt>CLV</dt><dd>{formatCompactCurrency(row.averageClv)}</dd></div>
                <div><dt>Biggest Gap</dt><dd>{row.biggestGap}</dd></div>
              </dl>
            </article>
          )
        })}
      </div>
    </GlassCard>
  )
}

function AnalyticsGrid({ data }: { data: CustomerPerceptionResult }) {
  return (
    <div className="perception-grid perception-grid--two">
      <GlassCard interactive={false} className="perception-panel">
        <div className="perception-panel__head">
          <div><span>Expectation vs Perception</span><h2>Biggest Gaps</h2></div>
          <Link to="/customer-insights/kebutuhan-pelanggan"><ExternalLink size={16} /> Needs</Link>
        </div>
        <div className="perception-list">
          {data.expectationGaps.slice(0, 7).map((row) => (
            <article key={row.id}>
              <strong>{row.label}</strong>
              <span>Importance {formatPerception(row.importance)} · Perception {formatPerception(row.score)} · Gap +{formatScore(row.gap, 2)}</span>
            </article>
          ))}
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="perception-panel">
        <div className="perception-panel__head">
          <div><span>Correlation, Not Causation</span><h2>Drivers of Overall Perception</h2></div>
        </div>
        <div className="perception-list">
          {data.drivers.map((row) => (
            <article key={row.attributeId}>
              <strong>{row.label}</strong>
              <span>r={formatScore(row.relationshipStrength, 2)} · {row.direction} · n={formatNumber(row.sampleCount)}</span>
              <small>{row.interpretation}</small>
            </article>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

function NpsAndPersonas({ data }: { data: CustomerPerceptionResult }) {
  return (
    <div className="perception-grid perception-grid--two">
      <GlassCard interactive={false} className="perception-panel">
        <div className="perception-panel__head">
          <div><span>Perception & Recommendation</span><h2>NPS Group Comparison</h2></div>
        </div>
        <div className="perception-nps">
          {data.npsComparison.map((row) => (
            <article key={row.npsGroup}>
              <strong>{row.npsGroup}</strong>
              <span>{formatNumber(row.customerCount)} pelanggan · {formatPerception(row.overallPerception)}</span>
              <small>Strongest: {row.strongestDimension} · Weakest: {row.weakestDimension}</small>
            </article>
          ))}
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="perception-panel">
        <div className="perception-panel__head">
          <div><span>Deterministic Persona</span><h2>Perception Personas</h2></div>
        </div>
        <div className="perception-personas">
          {data.personas.slice(0, 6).map((row) => (
            <article key={row.id}>
              <strong>{row.label}</strong>
              <span>{formatPercent(row.customerShare)} · {formatPerception(row.overallPerception)} · NPS {formatScore(row.nps, 1)}</span>
              <small>{row.dominantDimension} strongest · {row.weakestDimension} weakest</small>
            </article>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

function InsightsAndActions({ data }: { data: CustomerPerceptionResult }) {
  return (
    <div className="perception-grid perception-grid--two">
      <GlassCard interactive={false} className="perception-panel">
        <div className="perception-panel__head">
          <div><span>Automatic Insights</span><h2>Customer Perception Insights</h2></div>
          <Sparkles size={18} />
        </div>
        <div className="perception-list">
          {data.insights.map((insight) => <article key={insight}><strong>{insight}</strong></article>)}
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="perception-panel">
        <div className="perception-panel__head">
          <div><span>Recommended Actions</span><h2>Perception Actions</h2></div>
        </div>
        <div className="perception-list">
          {data.recommendations.map((row) => (
            <article key={`${row.dimensionId}-${row.evidence}`}>
              <strong>{row.priority.toUpperCase()} · {row.owner}</strong>
              <span>{row.evidence}</span>
              <small>{row.action} · {row.reliabilityNote}</small>
              <Link to={row.route}>Deep-link <ExternalLink size={14} /></Link>
            </article>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

function Explorer({ data, onOpen }: { data: CustomerPerceptionResult; onOpen: () => void }) {
  const explorer = data.selectedExplorer
  return (
    <GlassCard interactive={false} className="perception-panel perception-explorer">
      <div className="perception-panel__head">
        <div><span>Perception Explorer</span><h2>{explorer.title}</h2></div>
        <button type="button" onClick={onOpen}>Detail Drawer</button>
      </div>
      <div className="perception-explorer__body">
        <article><strong>{formatPerception(explorer.score)}</strong><span>Score</span></article>
        <article><strong>{formatPercent(explorer.positiveRate)}</strong><span>Positive</span></article>
        <article><strong>{formatPercent(explorer.negativeRate)}</strong><span>Negative</span></article>
        <article><strong>{formatNumber(explorer.responseCount)}</strong><span>Samples</span></article>
      </div>
      <p>{explorer.definition}</p>
      <p>Top comparison: {explorer.topComparison}. Bottom comparison: {explorer.bottomComparison}. Reliability: {reliabilityLabel(explorer.reliabilityScore, explorer.reliabilityStatus)}.</p>
    </GlassCard>
  )
}

function DetailDrawer({ data, open, onClose }: { data: CustomerPerceptionResult; open: boolean; onClose: () => void }) {
  if (!open) return null
  const explorer = data.selectedExplorer
  return (
    <div className="perception-drawer" role="dialog" aria-modal="true" aria-label="Perception detail drawer">
      <div className="perception-drawer__backdrop" onClick={onClose} />
      <aside>
        <button type="button" onClick={onClose} aria-label="Close drawer"><X size={18} /></button>
        <span>Definition & Evidence</span>
        <h2>{explorer.title}</h2>
        <p>{explorer.definition}</p>
        <dl>
          <div><dt>Formula</dt><dd>Average structured score in active scope; overall uses configured weighted dimension average.</dd></div>
          <div><dt>Distribution</dt><dd>{formatPercent(explorer.positiveRate)} positive · {formatPercent(explorer.neutralRate)} neutral · {formatPercent(explorer.negativeRate)} negative.</dd></div>
          <div><dt>Sample</dt><dd>{formatNumber(explorer.responseCount)} respondents · {data.periodLabel}</dd></div>
          <div><dt>Source</dt><dd>{explorer.sourceType}</dd></div>
          <div><dt>Reliability</dt><dd>{reliabilityLabel(explorer.reliabilityScore, explorer.reliabilityStatus)}</dd></div>
          <div><dt>Related Gap</dt><dd>{explorer.relatedGap ? `${explorer.relatedGap >= 0 ? '+' : ''}${formatScore(explorer.relatedGap, 2)}` : 'n/a'}</dd></div>
        </dl>
        <p>{explorer.action}</p>
        <nav>
          <Link to="/customer-insights/kebutuhan-pelanggan">Kebutuhan Pelanggan</Link>
          <Link to="/customer-insights/pain-points">Pain Points</Link>
          <Link to="/customer-insights/motivasi-pelanggan">Motivasi Pelanggan</Link>
          <Link to="/purchase-analytics/perilaku-pembelian">Perilaku Pembelian</Link>
          <Link to="/purchase-analytics/customer-journey">Customer Journey</Link>
        </nav>
      </aside>
    </div>
  )
}

export default function CustomerPerception() {
  useInsights()
  const filters = useFilterStore((state) => state.filters)
  const [payload, setPayload] = useState<CustomerPerceptionJson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<CustomerPerceptionLocalFilters>(defaultCustomerPerceptionLocalFilters)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/assets/customerPerception.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<CustomerPerceptionJson>
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
    return () => {
      cancelled = true
    }
  }, [])

  const data = useMemo(() => (payload ? queryCustomerPerception(payload, filters, localFilters) : null), [payload, filters, localFilters])
  const empty = !loading && !error && data !== null && data.summary.respondents === 0
  const insufficient = data && data.summary.respondents > 0 && data.summary.respondents < localFilters.minSampleSize

  let body
  if (loading || (!data && !error)) {
    body = <DashboardSkeleton />
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data persepsi gagal dimuat" description={error} />
  } else if (empty || !data) {
    body = <StateMessage icon={Inbox} title="Tidak ada data persepsi pelanggan untuk kombinasi filter ini." description="Perluas periode, pilih semua outlet, atau reset filter persepsi." />
  } else if (insufficient) {
    body = <StateMessage icon={Inbox} title="Jumlah responden belum cukup untuk menampilkan persepsi secara andal." description="Kurangi minimum sample size atau perluas scope filter." />
  } else {
    body = (
      <>
        <Controls data={data} localFilters={localFilters} setLocalFilters={setLocalFilters} />
        <SummaryCards data={data} />
        <DimensionOverview rows={data.dimensions} onSelect={(row) => setLocalFilters({ ...localFilters, dimension: row.id })} />
        <div className="perception-grid perception-grid--two">
          <AttributePanel title="Brand, Product, Price, Service, Digital & Proxy Attributes" rows={data.overviewAttributes} onSelect={(row) => setLocalFilters({ ...localFilters, attribute: row.id, dimension: row.dimensionId })} />
          <Explorer data={data} onOpen={() => setDrawerOpen(true)} />
        </div>
        <ComparisonTable data={data} />
        <AnalyticsGrid data={data} />
        <NpsAndPersonas data={data} />
        <InsightsAndActions data={data} />
        <GlassCard interactive={false} className="perception-panel">
          <div className="perception-panel__head">
            <div><span>Source Notes</span><h2>Direct Survey vs Behavioural Proxy</h2></div>
            <BadgeInfo size={18} />
          </div>
          <div className="perception-list">
            {data.sourceNotes.map((note) => <article key={note}><span>{note}</span></article>)}
          </div>
        </GlassCard>
        <DetailDrawer data={data} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </>
    )
  }

  return (
    <div className="customer-perception">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat Persepsi Pelanggan' : 'Persepsi Pelanggan siap'}
      </p>
      <section className="perception-hero">
        <div className="hero-copy">
          <span>Customer Insights</span>
          <h1>Persepsi Pelanggan <SlidersHorizontal size={22} /></h1>
          <p>
            {data
              ? `${data.periodLabel} · ${data.summary.respondents.toLocaleString('id-ID')} Responden · ${data.filterLabel}. Analisis bagaimana pelanggan menilai brand, produk, harga, layanan, outlet, dan pengalaman digital secara keseluruhan.`
              : 'Analisis bagaimana pelanggan menilai brand, produk, harga, layanan, outlet, dan pengalaman digital secara keseluruhan.'}
          </p>
        </div>
        <div className="perception-source-badge">
          <BadgeInfo size={16} />
          <span>Data Source: Synthetic Customer Survey Dataset</span>
        </div>
      </section>
      {body}
      <footer className="perception-footer">
        Sebagian persepsi berasal dari survey langsung, sementara delivery dan loyalty ditandai sebagai behavioural proxy. Tidak ada klaim NLP sentiment analysis.
      </footer>
    </div>
  )
}
