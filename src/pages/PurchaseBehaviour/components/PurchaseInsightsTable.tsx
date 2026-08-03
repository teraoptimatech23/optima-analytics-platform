import { useMemo, useState } from 'react'
import { Lightbulb, Search, Table2 } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CustomerBehaviourRow, PurchaseBehaviourInsights } from '@/data/purchaseBehaviourSelectors'
import { formatClv, formatCurrency, formatFrequency, formatNumber } from '@/data/formatters'

type SortKey = keyof Pick<CustomerBehaviourRow, 'customerId' | 'frequency' | 'basket' | 'revenue' | 'clv' | 'recency' | 'segment' | 'favoriteProduct' | 'favoriteChannel' | 'status'>
const PAGE_SIZE = 12

function CustomerTable({ rows }: { rows: CustomerBehaviourRow[] }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'revenue', direction: 'desc' })
  const filtered = useMemo(() => {
    const query = search.toLowerCase()
    return rows
      .filter((row) => !query || [row.customerId, row.segment, row.favoriteProduct, row.favoriteChannel, row.status].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => {
        const left = a[sort.key]
        const right = b[sort.key]
        const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'id-ID')
        return sort.direction === 'asc' ? result : -result
      })
  }, [rows, search, sort])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const updateSort = (key: SortKey) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }))

  return (
    <GlassCard interactive={false} className="purchase-panel purchase-table-card">
      <SectionTitle icon={Table2} title="Tabel Transaksi Agregat" subtitle={`${formatNumber(filtered.length)} pelanggan`} />
      <label className="purchase-search"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari customer, segment, channel, status..." /></label>
      <div className="purchase-table-wrap">
        <table className="purchase-table">
          <thead>
            <tr>{[
              ['customerId', 'Customer ID'], ['frequency', 'Frequency'], ['basket', 'Basket'], ['revenue', 'Revenue'], ['clv', 'CLV'], ['recency', 'Recency'], ['segment', 'Segment'], ['favoriteProduct', 'Favorite Product'], ['favoriteChannel', 'Favorite Channel'], ['member', 'Member'], ['status', 'Status'],
            ].map(([key, label]) => <th key={key}>{key === 'member' ? label : <button type="button" onClick={() => updateSort(key as SortKey)}>{label}</button>}</th>)}</tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.customerId}>
                <td>{row.customerId}</td><td>{formatFrequency(row.frequency)}</td><td>{formatCurrency(row.basket)}</td><td>{formatCurrency(row.revenue)}</td><td>{formatClv(row.clv)}</td><td>{row.recency} hari</td><td>{row.segment}</td><td>{row.favoriteProduct}</td><td>{row.favoriteChannel}</td><td>{row.member ? 'Member' : 'Non-member'}</td><td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="purchase-pagination">
        <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Sebelumnya</button>
        <span>Halaman {safePage} dari {totalPages}</span>
        <button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Berikutnya</button>
      </footer>
    </GlassCard>
  )
}

export default function PurchaseInsightsTable({ data }: { data: PurchaseBehaviourInsights }) {
  return (
    <>
      <section className="purchase-behaviour__grid purchase-behaviour__grid--two">
        <GlassCard interactive={false} className="purchase-panel purchase-insights">
          <SectionTitle icon={Lightbulb} title="Automatic Insight" subtitle="Berubah sesuai filter aktif" />
          <ol>{data.insights.map((insight) => <li key={insight}>{insight}</li>)}</ol>
        </GlassCard>
        <GlassCard interactive={false} className="purchase-panel purchase-insights">
          <SectionTitle icon={Lightbulb} title="Recommendation" subtitle="Rekomendasi otomatis berbasis perilaku" tone="orange" />
          <ol>{data.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ol>
        </GlassCard>
      </section>
      <CustomerTable rows={data.customers} />
    </>
  )
}
