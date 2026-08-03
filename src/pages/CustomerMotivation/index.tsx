import { useMemo, useState } from 'react'
import { BadgeInfo, BrainCircuit, Gauge, Info, RefreshCcw, SlidersHorizontal, TriangleAlert, UsersRound } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import {
  defaultCustomerMotivationLocalFilters,
  queryCustomerMotivation,
} from '@/data/customerMotivationSelectors'
import type { CustomerMotivationInsights, CustomerMotivationLocalFilters, MotivationDistributionRow } from '@/data/customerMotivationSelectors'
import { formatClv, formatCompactNumber, formatFrequency, formatNumber, formatPercent, formatScore } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import './index.less'

function MotivationKpis({ data }: { data: CustomerMotivationInsights }) {
  const icons = [Gauge, BrainCircuit, UsersRound, BadgeInfo]
  return (
    <section className="motivation-summary">
      {data.kpis.map((card, index) => {
        const Icon = icons[index % icons.length]!
        return (
          <GlassCard interactive={false} className={`motivation-kpi motivation-kpi--${card.tone}`} key={card.id}>
            <span className="motivation-kpi__icon"><Icon size={18} /></span>
            <span className="motivation-kpi__label">{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.detail}</small>
          </GlassCard>
        )
      })}
    </section>
  )
}

function MotivationOverview({ data }: { data: CustomerMotivationInsights }) {
  const max = Math.max(...data.overview.map((row) => row.score), 1)
  return (
    <GlassCard interactive={false} className="motivation-panel">
      <div className="motivation-panel__head">
        <div><span>Motivation Overview</span><h2>Ranked Evidence Scores</h2></div>
        <small>Score adalah indeks evidence, bukan jawaban psikologis pasti.</small>
      </div>
      <div className="motivation-overview__rows">
        {data.overview.map((row) => (
          <article key={row.id}>
            <div>
              <b>#{row.rank}</b>
              <strong>{row.label}</strong>
              <span>{row.sourceType} · {row.reliability}</span>
            </div>
            <em>{formatPercent(row.score)}</em>
            <i style={{ width: `${Math.max(3, (row.score / max) * 100)}%` }} />
            <small>{formatCompactNumber(row.customers)} dominant customers · {formatPercent(row.share)} share · change {formatPercent(row.change)}</small>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

function DistributionTable({ title, eyebrow, rows }: { title: string; eyebrow: string; rows: MotivationDistributionRow[] }) {
  return (
    <GlassCard interactive={false} className="motivation-panel motivation-table-card">
      <div className="motivation-panel__head"><div><span>{eyebrow}</span><h2>{title}</h2></div></div>
      <div className="motivation-table-wrap">
        <table className="motivation-table">
          <thead>
            <tr>
              <th>Motivation / Group</th>
              <th>Customers</th>
              <th>Share</th>
              <th>Frequency</th>
              <th>Basket</th>
              <th>Repeat</th>
              <th>Member</th>
              <th>Voucher</th>
              <th>CLV</th>
              <th>NPS</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row) => (
              <tr key={row.id}>
                <td><strong>{row.label}</strong><span>{row.secondary}</span></td>
                <td>{formatCompactNumber(row.customers)}</td>
                <td>{formatPercent(row.share)}</td>
                <td>{formatFrequency(row.frequency)}</td>
                <td>Rp{formatNumber(row.averageBasket)}</td>
                <td>{formatPercent(row.repeatRate)}</td>
                <td>{formatPercent(row.memberRate)}</td>
                <td>{formatPercent(row.voucherRate)}</td>
                <td>{formatClv(row.clv)}</td>
                <td>{formatScore(row.nps, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function MotivationComparison({ data }: { data: CustomerMotivationInsights }) {
  const columns = [...new Set(data.comparison.map((row) => row.dimension))].slice(0, 8)
  const motivations = [...new Set(data.comparison.map((row) => row.motivation))]
  return (
    <GlassCard interactive={false} className="motivation-panel">
      <div className="motivation-panel__head">
        <div><span>Segment Comparison</span><h2>Motivation by Customer Segment</h2></div>
        <small>Cell intensity = motivation score pada dimensi pembanding aktif.</small>
      </div>
      <div className="motivation-heatmap">
        <div className="motivation-heatmap__head" />
        {columns.map((column) => <b key={column}>{column}</b>)}
        {motivations.map((motivation) => (
          <div className="motivation-heatmap__row" key={motivation}>
            <strong>{motivation}</strong>
            {columns.map((column) => {
              const cell = data.comparison.find((row) => row.motivation === motivation && row.dimension === column)
              return <span key={`${motivation}-${column}`} style={{ opacity: 0.28 + (cell?.score ?? 0) * 0.72 }}>{cell ? formatPercent(cell.score) : '-'}</span>
            })}
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

function MotivationInsights({ data }: { data: CustomerMotivationInsights }) {
  return (
    <div className="motivation-grid motivation-grid--two">
      <GlassCard interactive={false} className="motivation-panel motivation-notes">
        <div className="motivation-panel__head"><div><span>Data-Driven Notes</span><h2>Insights</h2></div></div>
        <ol>{data.insights.map((row) => <li key={row.title}><strong>{row.title}</strong><span>{row.evidence}</span><small>{row.action}</small></li>)}</ol>
      </GlassCard>
      <GlassCard interactive={false} className="motivation-panel motivation-notes">
        <div className="motivation-panel__head"><div><span>Methodology</span><h2>Proxy Guardrails</h2></div></div>
        <ol>{data.methodology.map((row) => <li key={row}>{row}</li>)}</ol>
      </GlassCard>
    </div>
  )
}

export default function CustomerMotivation() {
  useInsights()
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [localFilters, setLocalFilters] = useState<CustomerMotivationLocalFilters>(defaultCustomerMotivationLocalFilters)
  const data = useMemo(() => queryCustomerMotivation(filters, localFilters), [filters, localFilters])
  const setLocal = <K extends keyof CustomerMotivationLocalFilters>(key: K, value: CustomerMotivationLocalFilters[K]) => setLocalFilters((state) => ({ ...state, [key]: value }))

  let body
  if (loading) body = <DashboardSkeleton />
  else if (error) body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error} />
  else {
    body = (
      <>
        <MotivationKpis data={data} />
        <div className="motivation-grid motivation-grid--two">
          <MotivationOverview data={data} />
          <DistributionTable title="Dominant Customer Motivations" eyebrow="Distribution Snapshot" rows={data.distribution} />
        </div>
        <div className="motivation-grid motivation-grid--two">
          <DistributionTable title="Primary & Secondary Motivation" eyebrow="Motivation Pairing" rows={data.pairs} />
          <MotivationComparison data={data} />
        </div>
        <div className="motivation-grid motivation-grid--two">
          <DistributionTable title="Motivation by Purchase Channel" eyebrow="Channel" rows={data.channels} />
          <DistributionTable title="Motivation by Location" eyebrow="Outlet & Region" rows={data.locations} />
        </div>
        <div className="motivation-grid motivation-grid--two">
          <DistributionTable title="Motivation by Product Preference" eyebrow="Product Preference" rows={data.products} />
          <DistributionTable title="Motivation by Acquisition Source" eyebrow="Campaign / Source" rows={data.acquisitions} />
        </div>
        <DistributionTable title="Motivation & Purchase Behaviour / Customer Value" eyebrow="Behaviour and Value" rows={data.behaviour} />
        <MotivationInsights data={data} />
      </>
    )
  }

  return (
    <div className="customer-motivation">
      <p className="sr-only" role="status" aria-live="polite">{loading ? 'Memuat Motivasi Pelanggan' : `${data.scope.customers} customer dianalisis`}</p>
      <section className="customer-motivation__hero">
        <div className="hero-copy">
          <span>Customer Insights</span>
          <h1>
            Motivasi Pelanggan
            <Gauge size={22} strokeWidth={2} />
          </h1>
          <p>{data.filterLabel} · Pahami faktor utama yang mendorong pelanggan membeli, kembali bertransaksi, menggunakan promo, dan membangun loyalitas.</p>
        </div>
        <div className="customer-motivation__badge" title="Motivasi dapat berasal dari jawaban survey langsung maupun proxy perilaku yang terdokumentasi.">
          <BadgeInfo size={16} />
          <span>Data Source: Synthetic Customer & Survey Dataset</span>
          <Info size={14} />
        </div>
      </section>

      <section className="customer-motivation__filters" aria-label="Customer motivation filters">
        <div className="customer-motivation__filters-title"><SlidersHorizontal size={16} /><span>Analysis Filters</span></div>
        <select aria-label="Segment filter" value={localFilters.segment} onChange={(event) => setLocal('segment', event.target.value)}>
          <option value="all">Semua Segmen</option>
          {data.availableSegments.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
        </select>
        <select aria-label="Channel filter" value={localFilters.channel} onChange={(event) => setLocal('channel', event.target.value)}>
          <option value="all">Semua Channel</option>
          {data.availableChannels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
        </select>
        <select aria-label="Motivation filter" value={localFilters.motivation} onChange={(event) => setLocal('motivation', event.target.value)}>
          <option value="all">Semua Motivasi</option>
          {data.availableMotivations.map((motivation) => <option key={motivation.id} value={motivation.id}>{motivation.label}</option>)}
        </select>
        <select aria-label="Comparison dimension" value={localFilters.comparison} onChange={(event) => setLocal('comparison', event.target.value as CustomerMotivationLocalFilters['comparison'])}>
          <option value="segment">Segment</option>
          <option value="age">Age Group</option>
          <option value="gender">Gender</option>
          <option value="member">Member Status</option>
          <option value="acquisition">Acquisition Source</option>
          <option value="channel">Channel</option>
          <option value="region">Region</option>
        </select>
        <button type="button" onClick={() => setLocalFilters(defaultCustomerMotivationLocalFilters)}><RefreshCcw size={15} /> Reset</button>
      </section>

      {body}

      <footer className="customer-motivation__source">
        Sumber Data: compact motivation fact dari `customers.csv`, `survey_responses.csv`, `transactions.csv`, dan `transaction_items.csv`. Field motivasi eksplisit tidak tersedia, sehingga halaman ini menampilkan evidence index dan behavioural proxy yang terdokumentasi.
      </footer>
    </div>
  )
}
