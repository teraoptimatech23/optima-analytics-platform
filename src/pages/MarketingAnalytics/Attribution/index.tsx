import { useEffect, useMemo, useState } from 'react'
import {
  BadgeInfo,
  GitBranch,
  Inbox,
  Network,
  RefreshCcw,
  Route,
  Scale,
  SlidersHorizontal,
  Sparkles,
  TableProperties,
  TriangleAlert,
} from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import { attributionModelLabels, attributionModels, attributionWindows } from '@/config/attributionConfig'
import {
  defaultAttributionLocalFilters,
  isAttributionWindow,
  queryAttribution,
} from '@/data/attributionSelectors'
import type { AttributionJson, AttributionKpi, AttributionLocalFilters, AttributionResult } from '@/data/attributionSelectors'
import { formatCompactCurrency, formatCompactNumber, formatCurrency, formatPercent, formatScore } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useFilterStore } from '@/store/useFilterStore'
import './index.less'

const kpiIcons = [Scale, Network, GitBranch, Route]

function formatHours(value: number) {
  if (value < 24) return `${formatScore(value, 1)} jam`
  return `${formatScore(value / 24, 1)} hari`
}

function formatKpi(card: AttributionKpi) {
  if (card.display === 'currency') return formatCompactCurrency(card.value)
  if (card.display === 'percent') return formatPercent(card.value)
  if (card.display === 'ratio') return `${formatScore(card.value, 2)}x`
  if (card.display === 'hours') return formatHours(card.value)
  return formatCompactNumber(card.value)
}

function AttributionControls({
  data,
  localFilters,
  setLocalFilters,
}: {
  data: AttributionResult
  localFilters: AttributionLocalFilters
  setLocalFilters: (filters: AttributionLocalFilters) => void
}) {
  const patch = (next: Partial<AttributionLocalFilters>) => setLocalFilters({ ...localFilters, ...next })
  return (
    <GlassCard interactive={false} className="attribution-panel attribution-controls-panel">
      <div className="attribution-panel__head">
        <div><span>Controls</span><h2>Attribution Model & Scope</h2></div>
        <button type="button" onClick={() => setLocalFilters(defaultAttributionLocalFilters)} aria-label="Reset attribution filters">
          <RefreshCcw size={16} /> Reset
        </button>
      </div>
      <div className="attribution-controls">
        <label>
          Model
          <select value={localFilters.model} onChange={(event) => patch({ model: event.target.value as AttributionLocalFilters['model'] })}>
            {attributionModels.map((model) => <option key={model} value={model}>{attributionModelLabels[model]}</option>)}
          </select>
        </label>
        <label>
          Window
          <select value={localFilters.window} onChange={(event) => {
            const next = Number(event.target.value)
            if (isAttributionWindow(next)) patch({ window: next })
          }}>
            {attributionWindows.map((window) => <option key={window} value={window}>{window} hari</option>)}
          </select>
        </label>
        <label>
          Channel
          <select value={localFilters.channel} onChange={(event) => patch({ channel: event.target.value, campaign: 'all' })}>
            <option value="all">Semua channel</option>
            {data.availableChannels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
          </select>
        </label>
        <label>
          Campaign
          <select value={localFilters.campaign} onChange={(event) => patch({ campaign: event.target.value })}>
            <option value="all">Semua campaign</option>
            {data.availableCampaigns
              .filter((campaign) => localFilters.channel === 'all' || campaign.channel === localFilters.channel)
              .map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
        </label>
        <label>
          First Touch
          <select value={localFilters.firstTouch} onChange={(event) => patch({ firstTouch: event.target.value })}>
            <option value="all">Semua first touch</option>
            {data.availableChannels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
          </select>
        </label>
        <label>
          Last Touch
          <select value={localFilters.lastTouch} onChange={(event) => patch({ lastTouch: event.target.value })}>
            <option value="all">Semua last touch</option>
            {data.availableChannels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
          </select>
        </label>
        <label>
          Path Length
          <select value={localFilters.pathLength} onChange={(event) => patch({ pathLength: event.target.value as AttributionLocalFilters['pathLength'] })}>
            <option value="all">Semua path</option>
            <option value="single">Single-touch</option>
            <option value="multi">Multi-touch</option>
            <option value="unattributed">Unattributed</option>
          </select>
        </label>
        <label>
          Customer
          <select value={localFilters.customerType} onChange={(event) => patch({ customerType: event.target.value as AttributionLocalFilters['customerType'] })}>
            <option value="all">New + repeat</option>
            <option value="new">New customer</option>
            <option value="repeat">Repeat customer</option>
          </select>
        </label>
        <label>
          Compare
          <select value={localFilters.comparisonMetric} onChange={(event) => patch({ comparisonMetric: event.target.value as AttributionLocalFilters['comparisonMetric'] })}>
            <option value="revenue">Revenue</option>
            <option value="conversions">Conversions</option>
            <option value="roas">ROAS</option>
            <option value="cpa">CPA</option>
          </select>
        </label>
        <label>
          Min Path Count
          <input type="number" min={1} value={localFilters.minPathCount} onChange={(event) => patch({ minPathCount: Math.max(1, Number(event.target.value) || 1) })} />
        </label>
      </div>
    </GlassCard>
  )
}

function SummaryCards({ data }: { data: AttributionResult }) {
  return (
    <section className="attribution-summary attribution-kpi" aria-label="Attribution KPI summary">
      {data.kpis.map((card, index) => {
        const Icon = kpiIcons[index % kpiIcons.length]!
        return (
          <GlassCard interactive={false} className={`attribution-card attribution-card--${card.tone}`} key={card.id}>
            <span className="attribution-card__icon"><Icon size={18} /></span>
            <span className="attribution-card__label">{card.label}</span>
            <strong>{formatKpi(card)}</strong>
            <small>{card.detail}</small>
          </GlassCard>
        )
      })}
    </section>
  )
}

function ChannelOverview({ data }: { data: AttributionResult }) {
  const max = Math.max(...data.channels.map((row) => row.attributedRevenue), 1)
  return (
    <GlassCard interactive={false} className="attribution-panel">
      <div className="attribution-panel__head">
        <div><span>Channel Overview</span><h2>Attributed Revenue by Channel</h2></div>
        <small>Credit berasal dari conversion yang punya CampaignID touchpoint eligible.</small>
      </div>
      <div className="attribution-channel-list">
        {data.channels.map((row) => (
          <article key={row.id}>
            <div>
              <strong>{row.label}</strong>
              <span>{formatCompactCurrency(row.attributedRevenue)} · {formatCompactNumber(row.attributedConversions)} credited conversions</span>
            </div>
            <i style={{ width: `${Math.max(4, row.attributedRevenue / max * 100)}%` }} />
            <dl>
              <div><dt>Revenue Share</dt><dd>{formatPercent(row.revenueShare)}</dd></div>
              <div><dt>ROAS</dt><dd>{formatScore(row.roas, 2)}x</dd></div>
              <div><dt>CPA</dt><dd>{formatCompactCurrency(row.cpa)}</dd></div>
              <div><dt>Avg Lag</dt><dd>{formatHours(row.averageLagHours)}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

function ModelComparison({ data }: { data: AttributionResult }) {
  return (
    <GlassCard interactive={false} className="attribution-panel attribution-models">
      <div className="attribution-panel__head">
        <div><span>Rule-Based Models</span><h2>Model Comparison</h2></div>
        <small>Total credit per conversion selalu 1.</small>
      </div>
      <div className="attribution-model-grid">
        {data.modelComparison.map((row) => (
          <article key={row.model} className={row.model === data.localFilters.model ? 'is-active' : ''}>
            <span>{row.label}</span>
            <strong>{formatCompactCurrency(row.attributedRevenue)}</strong>
            <dl>
              <div><dt>Credit</dt><dd>{formatCompactNumber(row.attributedConversions)}</dd></div>
              <div><dt>Top Channel</dt><dd>{row.topChannel}</dd></div>
              <div><dt>ROAS</dt><dd>{formatScore(row.roas, 2)}x</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

function PathAnalysis({ data }: { data: AttributionResult }) {
  return (
    <div className="attribution-grid attribution-grid--two">
      <GlassCard interactive={false} className="attribution-panel">
        <div className="attribution-panel__head">
          <div><span>Customer Paths</span><h2>Top Conversion Paths</h2></div>
          <small>Diurutkan dari conversion count dalam scope aktif.</small>
        </div>
        <div className="attribution-paths">
          {data.topPaths.map((row) => (
            <article key={row.path}>
              <div><strong>{row.path}</strong><span>{formatCompactNumber(row.count)} conversions · {formatPercent(row.share)}</span></div>
              <small>{formatCompactCurrency(row.revenue)} revenue · avg lag {formatHours(row.averageLagHours)}</small>
            </article>
          ))}
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="attribution-panel">
        <div className="attribution-panel__head">
          <div><span>Path Distribution</span><h2>Length & Time-to-Conversion</h2></div>
          <small>Snapshot berbasis conversion pada periode aktif.</small>
        </div>
        <div className="attribution-bars">
          {[...data.pathLength, ...data.timeBuckets].map((row) => (
            <article key={row.label}>
              <div><strong>{row.label}</strong><span>{formatCompactNumber(row.count)} · {formatPercent(row.share)}</span></div>
              <i style={{ width: `${Math.max(3, row.share * 100)}%` }} />
            </article>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

function PositionAndPairs({ data }: { data: AttributionResult }) {
  const maxPosition = Math.max(...data.positionRows.flatMap((row) => [row.first, row.middle, row.last]), 1)
  return (
    <div className="attribution-grid attribution-grid--two">
      <GlassCard interactive={false} className="attribution-panel">
        <div className="attribution-panel__head">
          <div><span>Touchpoint Position</span><h2>First, Assist, Last Roles</h2></div>
          <small>Middle akan kosong bila tidak ada multi-touch path.</small>
        </div>
        <div className="attribution-position">
          {data.positionRows.map((row) => (
            <article key={row.channel}>
              <strong>{row.channel}</strong>
              <span><i style={{ width: `${row.first / maxPosition * 100}%` }} /> First {formatCompactNumber(row.first)}</span>
              <span><i style={{ width: `${row.middle / maxPosition * 100}%` }} /> Assist {formatCompactNumber(row.middle)}</span>
              <span><i style={{ width: `${row.last / maxPosition * 100}%` }} /> Last {formatCompactNumber(row.last)}</span>
            </article>
          ))}
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="attribution-panel">
        <div className="attribution-panel__head">
          <div><span>Channel Pairs</span><h2>Observed Sequential Pairs</h2></div>
          <small>Hanya tampil jika ada eligible multi-touch conversion.</small>
        </div>
        {data.pairs.length ? (
          <div className="attribution-pairs">
            {data.pairs.map((row) => (
              <article key={`${row.source}-${row.target}`}>
                <strong>{row.source} → {row.target}</strong>
                <span>{formatCompactNumber(row.count)} transitions · {formatHours(row.averageLagHours)} avg lag</span>
              </article>
            ))}
          </div>
        ) : (
          <StateMessage icon={Inbox} title="Belum ada channel pair valid" description="Dataset saat ini belum menyediakan conversion dengan lebih dari satu campaign touchpoint dalam attribution window." />
        )}
      </GlassCard>
    </div>
  )
}

function CampaignTable({ data }: { data: AttributionResult }) {
  return (
    <GlassCard interactive={false} className="attribution-panel attribution-table-panel">
      <div className="attribution-panel__head">
        <div><span>Campaign Attribution</span><h2>Campaign Credit & Efficiency</h2></div>
        <TableProperties size={18} />
      </div>
      <div className="attribution-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Channel</th>
              <th>Credit</th>
              <th>Attributed Revenue</th>
              <th>Spend</th>
              <th>ROAS</th>
              <th>CPA</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {data.campaigns.slice(0, 14).map((row) => (
              <tr key={row.campaignId}>
                <td><strong>{row.campaignName}</strong><span>{row.objective}</span></td>
                <td>{row.channel}</td>
                <td>{formatCompactNumber(row.attributedConversions)}</td>
                <td>{formatCurrency(row.attributedRevenue)}</td>
                <td>{formatCompactCurrency(row.spend)}</td>
                <td>{formatScore(row.roas, 2)}x</td>
                <td>{formatCompactCurrency(row.cpa)}</td>
                <td>{formatCompactNumber(row.firstConversions)} first · {formatCompactNumber(row.lastConversions)} last</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function InsightPanels({ data }: { data: AttributionResult }) {
  return (
    <div className="attribution-grid attribution-grid--two">
      <GlassCard interactive={false} className="attribution-panel">
        <div className="attribution-panel__head">
          <div><span>Deterministic Insights</span><h2>Insights & Recommendations</h2></div>
          <Sparkles size={18} />
        </div>
        <div className="attribution-insights">
          {data.insights.map((item) => (
            <article key={item.title} className={`is-${item.priority}`}>
              <strong>{item.title}</strong>
              <span>{item.evidence}</span>
              <small>{item.action}</small>
            </article>
          ))}
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="attribution-panel">
        <div className="attribution-panel__head">
          <div><span>Methodology</span><h2>Validation & Scope</h2></div>
          <BadgeInfo size={18} />
        </div>
        <div className="attribution-method">
          <strong>{data.validationNote}</strong>
          {data.methodologyNotes.map((note) => <p key={note}>{note}</p>)}
        </div>
      </GlassCard>
    </div>
  )
}

export default function Attribution() {
  useInsights()
  const filters = useFilterStore((state) => state.filters)
  const [payload, setPayload] = useState<AttributionJson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localFilters, setLocalFilters] = useState<AttributionLocalFilters>(defaultAttributionLocalFilters)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/assets/attribution.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<AttributionJson>
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

  const data = useMemo(() => (payload ? queryAttribution(payload, filters, localFilters) : null), [payload, filters, localFilters])
  const empty = !loading && !error && data !== null && data.summary.conversions === 0

  let body
  if (loading || (!data && !error)) {
    body = <DashboardSkeleton />
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data attribution gagal dimuat" description={error} />
  } else if (empty || !data) {
    body = <StateMessage icon={Inbox} title="Tidak ada conversion pada scope ini" description="Ubah filter global atau attribution window untuk melihat scope lain." />
  } else {
    body = (
      <>
        <AttributionControls data={data} localFilters={localFilters} setLocalFilters={setLocalFilters} />
        <SummaryCards data={data} />
        <ChannelOverview data={data} />
        <ModelComparison data={data} />
        <PathAnalysis data={data} />
        <PositionAndPairs data={data} />
        <CampaignTable data={data} />
        <InsightPanels data={data} />
      </>
    )
  }

  return (
    <div className="google-ads attribution-page">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat Marketing Attribution' : 'Marketing Attribution siap'}
      </p>
      <section className="google-ads__hero attribution-hero">
        <div className="hero-copy">
          <span>Marketing Analytics</span>
          <h1>
            Marketing Attribution
            <SlidersHorizontal size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.periodLabel} · ${data.filterLabel} · ${formatCompactCurrency(data.summary.attributedRevenue)} attributed revenue pada model ${attributionModelLabels[data.localFilters.model]}.`
              : 'Rule-based attribution lintas channel dengan window transparan, revenue conservation, dan batasan data yang eksplisit.'}
          </p>
        </div>
        <div className="google-ads__source-badge">
          <BadgeInfo size={16} />
          <span>Rule-based · Not causal incrementality</span>
        </div>
      </section>
      {body}
      <footer className="google-ads__source">
        Sumber Data: `transactions.csv`, `campaigns.csv`, paid media performance, dan customer dimensions. Touchpoint anonymous/session-level belum tersedia.
      </footer>
    </div>
  )
}
