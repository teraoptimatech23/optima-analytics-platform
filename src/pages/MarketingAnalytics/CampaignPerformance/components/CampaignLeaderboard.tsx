import { useMemo, useState } from 'react'
import { Download, Search, Trophy } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CampaignPerformanceLocalFilters, UnifiedCampaignPerformance } from '@/data/campaignPerformanceSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent, formatRoas } from '@/data/formatters'

type SortKey = keyof Pick<UnifiedCampaignPerformance, 'campaignName' | 'channel' | 'objective' | 'spend' | 'impressions' | 'clicks' | 'ctr' | 'conversions' | 'cpa' | 'conversionValue' | 'roas' | 'newCustomers' | 'cac' | 'campaignScore' | 'status' | 'trendStatus'>
const PAGE_SIZE = 10

export default function CampaignLeaderboard({
  rows,
  localFilters,
  setLocalFilters,
}: {
  rows: UnifiedCampaignPerformance[]
  localFilters: CampaignPerformanceLocalFilters
  setLocalFilters: React.Dispatch<React.SetStateAction<CampaignPerformanceLocalFilters>>
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'campaignScore', direction: 'desc' })
  const filtered = useMemo(() => {
    const query = search.toLowerCase()
    return rows
      .filter((row) => !query || [row.campaignName, row.channel, row.objective, row.status, row.trendStatus].some((value) => value.toLowerCase().includes(query)))
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
  const exportCsv = () => {
    const header = ['Rank', 'Campaign', 'Channel', 'Objective', 'Spend', 'Impressions', 'Clicks', 'CTR', 'Conversions', 'CPA', 'Conversion Value', 'ROAS', 'New Customers', 'CAC', 'Score', 'Status', 'Trend']
    const lines = filtered.map((row, index) => [index + 1, row.campaignName, row.channel, row.objective, row.spend, row.impressions, row.clicks, row.ctr, row.conversions, row.cpa, row.conversionValue, row.roas, row.newCustomers, row.cac, row.campaignScore, row.status, row.trendStatus].join(','))
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'campaign-performance-leaderboard.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <GlassCard interactive={false} className="google-panel google-table-card">
      <div className="google-panel__head">
        <SectionTitle icon={Trophy} title="Campaign Leaderboard" subtitle="Rank dapat dipilih dari filter lokal" />
        <button className="google-icon-button" type="button" aria-label="Export campaign leaderboard CSV" onClick={exportCsv}><Download size={16} /></button>
      </div>
      <div className="google-table-tools">
        <label><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari campaign, channel, objective..." /></label>
        <select aria-label="Campaign status" value={localFilters.status} onChange={(event) => setLocalFilters((state) => ({ ...state, status: event.target.value }))}>
          <option value="all">Semua Status</option><option value="excellent">Excellent</option><option value="strong">Strong</option><option value="monitor">Monitor</option><option value="underperforming">Underperforming</option>
        </select>
        <select aria-label="Trend status" value={localFilters.trendStatus} onChange={(event) => setLocalFilters((state) => ({ ...state, trendStatus: event.target.value }))}>
          <option value="all">Semua Trend</option><option value="improving">Improving</option><option value="stable">Stable</option><option value="declining">Declining</option><option value="volatile">Volatile</option>
        </select>
      </div>
      <div className="google-table-wrap">
        <table className="google-table">
          <thead>
            <tr>{[
              ['campaignScore', 'Rank'], ['campaignName', 'Campaign'], ['channel', 'Channel'], ['objective', 'Objective'], ['spend', 'Spend'], ['impressions', 'Impr.'], ['clicks', 'Clicks'], ['ctr', 'CTR'], ['conversions', 'Conv.'], ['cpa', 'CPA'], ['conversionValue', 'Value'], ['roas', 'ROAS'], ['newCustomers', 'New Cust.'], ['cac', 'CAC'], ['status', 'Status'], ['trendStatus', 'Trend'],
            ].map(([key, label]) => <th key={key}><button type="button" onClick={() => updateSort(key as SortKey)}>{label}</button></th>)}</tr>
          </thead>
          <tbody>
            {pageRows.map((row, index) => (
              <tr key={row.campaignId}>
                <td>#{(safePage - 1) * PAGE_SIZE + index + 1} · {Math.round(row.campaignScore)}</td><td>{row.campaignName}</td><td>{row.channel}</td><td>{row.objective}</td><td>{formatCompactCurrency(row.spend)}</td><td>{formatCompactNumber(row.impressions)}</td><td>{formatCompactNumber(row.clicks)}</td><td>{formatPercent(row.ctr, 2)}</td><td>{formatCompactNumber(row.conversions)}</td><td>{formatCompactCurrency(row.cpa)}</td><td>{formatCompactCurrency(row.conversionValue)}</td><td>{formatRoas(row.roas)}</td><td>{formatCompactNumber(row.newCustomers)}</td><td>{formatCompactCurrency(row.cac)}</td><td><span className={`google-status google-status--${row.status === 'excellent' ? 'excellent' : row.status === 'strong' ? 'efficient' : row.status === 'underperforming' ? 'underperforming' : 'monitor'}`}>{row.status}</span></td><td>{row.trendStatus}</td>
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
