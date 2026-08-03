import { useMemo, useState } from 'react'
import { Download, Search, Table2 } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { GoogleAdsCampaignPerformance } from '@/data/googleAdsSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent, formatRoas } from '@/data/formatters'

type SortKey = keyof Pick<GoogleAdsCampaignPerformance, 'campaignName' | 'campaignType' | 'spend' | 'impressions' | 'clicks' | 'ctr' | 'cpc' | 'conversions' | 'conversionRate' | 'cpa' | 'conversionValue' | 'roas' | 'status'>
const PAGE_SIZE = 8

const statusLabel: Record<GoogleAdsCampaignPerformance['status'], string> = {
  excellent: 'Excellent',
  efficient: 'Efficient',
  monitor: 'Monitor',
  underperforming: 'Underperforming',
}

export default function CampaignPerformanceTable({ rows }: { rows: GoogleAdsCampaignPerformance[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'roas', direction: 'desc' })
  const filtered = useMemo(() => {
    const query = search.toLowerCase()
    return rows
      .filter((row) => status === 'all' || row.status === status)
      .filter((row) => !query || [row.campaignName, row.campaignType, statusLabel[row.status]].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => {
        const left = a[sort.key]
        const right = b[sort.key]
        const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'id-ID')
        return sort.direction === 'asc' ? result : -result
      })
  }, [rows, search, sort, status])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const updateSort = (key: SortKey) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }))
  const exportCsv = () => {
    const header = ['Campaign', 'Type', 'Spend', 'Impressions', 'Clicks', 'CTR', 'CPC', 'Conversions', 'CVR', 'CPA', 'Value', 'ROAS', 'Status']
    const lines = filtered.map((row) => [row.campaignName, row.campaignType, row.spend, row.impressions, row.clicks, row.ctr, row.cpc, row.conversions, row.conversionRate, row.cpa, row.conversionValue, row.roas, statusLabel[row.status]].join(','))
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'google-ads-campaign-performance.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <GlassCard interactive={false} className="google-panel google-table-card">
      <div className="google-panel__head">
        <SectionTitle icon={Table2} title="Campaign Performance" subtitle={`${filtered.length.toLocaleString('id-ID')} campaign`} />
        <button className="google-icon-button" type="button" aria-label="Export campaign CSV" onClick={exportCsv}><Download size={16} /></button>
      </div>
      <div className="google-table-tools">
        <label><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari campaign..." /></label>
        <select aria-label="Performance status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
          <option value="all">Semua Status</option>
          {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="google-table-wrap">
        <table className="google-table">
          <thead>
            <tr>{[
              ['campaignName', 'Campaign'], ['campaignType', 'Type'], ['spend', 'Spend'], ['impressions', 'Impr.'], ['clicks', 'Clicks'], ['ctr', 'CTR'], ['cpc', 'CPC'], ['conversions', 'Conv.'], ['conversionRate', 'CVR'], ['cpa', 'CPA'], ['conversionValue', 'Value'], ['roas', 'ROAS'], ['status', 'Status'],
            ].map(([key, label]) => <th key={key}><button type="button" onClick={() => updateSort(key as SortKey)}>{label}</button></th>)}</tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.campaignId}>
                <td>{row.campaignName}</td><td>{row.campaignType}</td><td>{formatCompactCurrency(row.spend)}</td><td>{formatCompactNumber(row.impressions)}</td><td>{formatCompactNumber(row.clicks)}</td><td>{formatPercent(row.ctr, 2)}</td><td>{formatCompactCurrency(row.cpc)}</td><td>{formatCompactNumber(row.conversions)}</td><td>{formatPercent(row.conversionRate, 2)}</td><td>{formatCompactCurrency(row.cpa)}</td><td>{formatCompactCurrency(row.conversionValue)}</td><td>{formatRoas(row.roas)}</td><td><span className={`google-status google-status--${row.status}`}>{statusLabel[row.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="google-pagination">
        <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Sebelumnya</button>
        <span>Halaman {safePage} dari {totalPages}</span>
        <button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Berikutnya</button>
      </footer>
    </GlassCard>
  )
}
