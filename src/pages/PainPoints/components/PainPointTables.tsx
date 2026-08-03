import { useMemo, useState } from 'react'
import { Lightbulb, Search, Table2 } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { AffectedCustomerCase, PainPointInsights, PainPointItem, PainPointStatus } from '@/data/painPointSelectors'
import { formatNumber, formatPercent, formatPriority, formatScore } from '@/data/formatters'

const STATUS_LABEL: Record<PainPointStatus, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }

function PainPointTable({ rows }: { rows: PainPointItem[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const categories = useMemo(() => ['all', ...new Set(rows.map((row) => row.category))], [rows])
  const statuses = useMemo(() => ['all', ...new Set(rows.map((row) => row.status))], [rows])
  const filtered = rows
    .filter((row) => category === 'all' || row.category === category)
    .filter((row) => status === 'all' || row.status === status)
    .filter((row) => !search || [row.label, row.category, row.topOutlet].some((value) => value.toLowerCase().includes(search.toLowerCase())))

  return (
    <GlassCard interactive={false} className="pain-panel pain-table-card">
      <SectionTitle icon={Table2} title="Pain Point Detail Table" subtitle={`${filtered.length.toLocaleString('id-ID')} pain point`} />
      <div className="pain-table-toolbar">
        <label className="pain-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari pain point, kategori, outlet..." /></label>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item === 'all' ? 'Semua Kategori' : item}</option>)}</select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item} value={item}>{item === 'all' ? 'Semua Status' : STATUS_LABEL[item as PainPointStatus]}</option>)}</select>
      </div>
      <div className="pain-table-wrap">
        <table className="pain-table">
          <thead><tr>{['Pain Point', 'Category', 'Affected Customers', 'Frequency Rate', 'Severity', 'Satisfaction Impact', 'NPS Impact', 'Repeat Impact', 'Top Segment', 'Top Outlet', 'Trend', 'Priority Score', 'Status'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td>{row.label}</td><td>{row.category}</td><td>{formatNumber(row.affectedCustomers)}</td><td>{formatPercent(row.frequencyRate)}</td>
                <td>{formatScore(row.severity)}/5</td><td>{formatScore(row.satisfactionImpact)}</td><td>{Math.round(row.npsImpact)} poin</td><td>{formatPercent(row.repeatImpact)}</td>
                <td>{row.topSegment}</td><td>{row.topOutlet}</td><td>{formatPercent(row.trend)}</td><td>{formatPriority(row.priorityScore)}</td><td><span className={`pain-status pain-status--${row.status}`}>{STATUS_LABEL[row.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function CustomerCaseTable({ rows }: { rows: AffectedCustomerCase[] }) {
  return (
    <GlassCard interactive={false} className="pain-panel pain-table-card">
      <SectionTitle icon={Table2} title="Pelanggan Terdampak" subtitle="Synthetic customer ID, tanpa data pribadi" tone="purple" />
      <div className="pain-table-wrap">
        <table className="pain-table pain-table--cases">
          <thead><tr>{['Customer ID', 'Segment', 'Pain Point', 'Severity', 'Outlet', 'Channel', 'Satisfaction', 'NPS', 'Recency', 'Repeat Status', 'Risk Status'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
          <tbody>
            {rows.slice(0, 24).map((row) => (
              <tr key={row.customerId}>
                <td>{row.customerId}</td><td>{row.segment}</td><td>{row.painPoint}</td><td>{formatScore(row.severity)}/5</td><td>{row.outlet}</td><td>{row.channel}</td><td>{formatScore(row.satisfaction)}/5</td><td>{row.nps}</td><td>{row.recency} hari</td><td>{row.repeatStatus}</td><td>{row.riskStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

export default function PainPointTables({ data }: { data: PainPointInsights }) {
  return (
    <>
      <section className="pain-points__grid pain-points__grid--two">
        <GlassCard interactive={false} className="pain-panel pain-insights">
          <SectionTitle icon={Lightbulb} title="Insight Pain Points" subtitle="Dihasilkan dari data aktif" />
          <ol>{data.insights.map((insight) => <li key={insight}>{insight}</li>)}</ol>
        </GlassCard>
        <GlassCard interactive={false} className="pain-panel pain-recommendations">
          <SectionTitle icon={Lightbulb} title="Rekomendasi Tindakan" subtitle="Berangkat dari ranking dan root cause" tone="orange" />
          <div className="pain-recommendation-list">
            {data.recommendations.map((item) => (
              <article key={item.painPointId}>
                <span>{item.priority}</span><strong>{item.issue}</strong><p>{item.evidence}</p><small>{item.rootCause} · {item.action} · Owner: {item.owner}</small>
              </article>
            ))}
          </div>
        </GlassCard>
      </section>
      <PainPointTable rows={data.painPoints} />
      <CustomerCaseTable rows={data.customers} />
    </>
  )
}
