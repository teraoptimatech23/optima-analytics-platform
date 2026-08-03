import { useMemo, useState } from 'react'
import { Search, Table2 } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CustomerNeedItem, NeedStatus } from '@/data/customerNeedsSelectors'
import { formatPercent, formatPriority, formatScore, formatSignedScore } from '@/data/formatters'

interface NeedsDetailTableProps {
  rows: CustomerNeedItem[]
}

type SortKey = keyof Pick<CustomerNeedItem, 'label' | 'category' | 'importance' | 'performance' | 'gap' | 'priorityScore' | 'responseCount' | 'positiveRate' | 'negativeRate' | 'trend' | 'status'>

const PAGE_SIZE = 8
const STATUS_LABEL: Record<NeedStatus, string> = {
  critical: 'Kritis',
  high: 'Prioritas Tinggi',
  monitor: 'Perlu Dipantau',
  good: 'Sudah Baik',
}

export default function NeedsDetailTable({ rows }: NeedsDetailTableProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'priorityScore', direction: 'desc' })
  const categories = useMemo(() => ['all', ...new Set(rows.map((row) => row.category))], [rows])
  const statuses = useMemo(() => ['all', ...new Set(rows.map((row) => row.status))], [rows])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows
      .filter((row) => category === 'all' || row.category === category)
      .filter((row) => status === 'all' || row.status === status)
      .filter((row) => !query || [row.label, row.category, STATUS_LABEL[row.status]].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => {
        const left = a[sort.key]
        const right = b[sort.key]
        const result = typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right), 'id-ID')
        return sort.direction === 'asc' ? result : -result
      })
  }, [category, rows, search, sort, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const updateSort = (key: SortKey) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }))

  return (
    <GlassCard interactive={false} className="needs-panel needs-table-card">
      <SectionTitle icon={Table2} title="Tabel Detail Kebutuhan" subtitle={`${filtered.length.toLocaleString('id-ID')} atribut`} />
      <div className="needs-table-toolbar">
        <label className="needs-search">
          <Search size={16} />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari need, kategori, status..." />
        </label>
        <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }} aria-label="Filter kategori">
          {categories.map((item) => <option key={item} value={item}>{item === 'all' ? 'Semua Kategori' : item}</option>)}
        </select>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} aria-label="Filter status">
          {statuses.map((item) => <option key={item} value={item}>{item === 'all' ? 'Semua Status' : STATUS_LABEL[item as NeedStatus]}</option>)}
        </select>
      </div>

      <div className="needs-table-wrap">
        <table className="needs-table">
          <thead>
            <tr>
              {[
                ['label', 'Need'], ['category', 'Category'], ['importance', 'Importance'], ['performance', 'Performance'],
                ['gap', 'Gap'], ['priorityScore', 'Priority Score'], ['responseCount', 'Response Count'],
                ['positiveRate', 'Positive Rate'], ['negativeRate', 'Negative Rate'], ['trend', 'Trend'], ['status', 'Status'],
              ].map(([key, label]) => (
                <th key={key}><button type="button" onClick={() => updateSort(key as SortKey)}>{label}</button></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id}>
                <td>{row.label}</td>
                <td>{row.category}</td>
                <td>{formatScore(row.importance)}</td>
                <td>{formatScore(row.performance)}</td>
                <td>{formatSignedScore(row.gap)}</td>
                <td>{formatPriority(row.priorityScore)}</td>
                <td>{row.responseCount.toLocaleString('id-ID')}</td>
                <td>{formatPercent(row.positiveRate)}</td>
                <td>{formatPercent(row.negativeRate)}</td>
                <td>{formatSignedScore(row.trend)}</td>
                <td><span className={`need-status need-status--${row.status}`}>{STATUS_LABEL[row.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="needs-pagination">
        <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Sebelumnya</button>
        <span>Halaman {safePage} dari {totalPages}</span>
        <button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Berikutnya</button>
      </footer>
    </GlassCard>
  )
}
