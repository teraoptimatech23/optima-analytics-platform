import { useMemo, useState } from 'react'
import { ArrowDownUp, Search } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CustomerDetailRow } from '@/data/customerProfileSelectors'
import { formatClv, formatCurrency, formatFrequency } from '@/data/formatters'

interface CustomerTableProps {
  rows: CustomerDetailRow[]
}

type SortKey = keyof Pick<CustomerDetailRow, 'customerId' | 'segment' | 'ageGroup' | 'city' | 'frequency' | 'avgBasket' | 'clv' | 'recency' | 'status'>

const PAGE_SIZE = 15

export default function CustomerTable({ rows }: CustomerTableProps) {
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'clv', direction: 'desc' })

  const segments = useMemo(() => ['all', ...new Set(rows.map((row) => row.segment))], [rows])
  const statuses = useMemo(() => ['all', ...new Set(rows.map((row) => row.status))], [rows])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows
      .filter((row) => segment === 'all' || row.segment === segment)
      .filter((row) => status === 'all' || row.status === status)
      .filter((row) => !query || [
        row.customerId, row.segment, row.ageGroup, row.gender, row.city, row.favoriteProduct, row.status,
      ].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => {
        const left = a[sort.key]
        const right = b[sort.key]
        const result = typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right), 'id-ID')
        return sort.direction === 'asc' ? result : -result
      })
  }, [rows, search, segment, status, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const updateSort = (key: SortKey) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  return (
    <GlassCard interactive={false} className="profile-panel customer-table-card">
      <SectionTitle icon={ArrowDownUp} title="Tabel Detail Pelanggan" subtitle={`${filtered.length.toLocaleString('id-ID')} pelanggan`} />
      <div className="customer-table-toolbar">
        <label className="customer-search">
          <Search size={16} />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari Customer ID, kota, segment..." />
        </label>
        <select value={segment} onChange={(event) => { setSegment(event.target.value); setPage(1) }} aria-label="Filter segment">
          {segments.map((item) => <option key={item} value={item}>{item === 'all' ? 'Semua Segment' : item}</option>)}
        </select>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} aria-label="Filter status">
          {statuses.map((item) => <option key={item} value={item}>{item === 'all' ? 'Semua Status' : item}</option>)}
        </select>
      </div>

      <div className="customer-table-wrap">
        <table className="customer-table">
          <thead>
            <tr>
              {[
                ['customerId', 'Customer ID'], ['segment', 'Segment'], ['ageGroup', 'Age Group'], ['gender', 'Gender'],
                ['city', 'City'], ['favoriteProduct', 'Favorite Product'], ['frequency', 'Frequency'], ['avgBasket', 'Average Basket'],
                ['clv', 'CLV'], ['recency', 'Recency'], ['membership', 'Membership'], ['status', 'Status'],
              ].map(([key, label]) => (
                <th key={key}>
                  {key === 'gender' || key === 'favoriteProduct' || key === 'membership' ? label : (
                    <button type="button" onClick={() => updateSort(key as SortKey)}>{label}</button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.customerId}>
                <td>{row.customerId}</td>
                <td>{row.segment}</td>
                <td>{row.ageGroup}</td>
                <td>{row.gender}</td>
                <td>{row.city}</td>
                <td>{row.favoriteProduct}</td>
                <td>{formatFrequency(row.frequency)}</td>
                <td>{formatCurrency(row.avgBasket)}</td>
                <td>{formatClv(row.clv)}</td>
                <td>{row.recency} hari</td>
                <td>{row.membership ? 'Member' : 'Non-member'}</td>
                <td><span className="status-pill">{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="customer-pagination">
        <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Sebelumnya</button>
        <span>Halaman {safePage} dari {totalPages}</span>
        <button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Berikutnya</button>
      </footer>
    </GlassCard>
  )
}
