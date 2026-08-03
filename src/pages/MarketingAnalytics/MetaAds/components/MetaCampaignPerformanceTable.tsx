import { useMemo, useState } from 'react'
import { Download, Search, Table2 } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { MetaAdsCampaignPerformance } from '@/data/metaAdsSelectors'
import { formatCompactCurrency, formatCompactNumber, formatFrequency, formatPercent } from '@/data/formatters'

type SortKey = keyof Pick<MetaAdsCampaignPerformance, 'campaignName' | 'objective' | 'spend' | 'reach' | 'impressions' | 'frequency' | 'linkClicks' | 'linkCtr' | 'cpc' | 'cpm' | 'engagement' | 'engagementRate' | 'videoViews' | 'conversions' | 'conversionRate' | 'cpa' | 'status' | 'fatigueScore'>
const PAGE_SIZE = 8

const statusLabel: Record<MetaAdsCampaignPerformance['status'], string> = {
  scale: 'Scale',
  efficient: 'Efficient',
  monitor: 'Monitor',
  underperforming: 'Underperforming',
}

export default function MetaCampaignPerformanceTable({ rows }: { rows: MetaAdsCampaignPerformance[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'conversions', direction: 'desc' })
  const filtered = useMemo(() => {
    const query = search.toLowerCase()
    return rows
      .filter((row) => status === 'all' || row.status === status)
      .filter((row) => !query || [row.campaignName, row.objective, statusLabel[row.status], row.fatigueStatus].some((value) => value.toLowerCase().includes(query)))
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
    const header = ['Campaign', 'Objective', 'Spend', 'Reach', 'Impressions', 'Frequency', 'Link Clicks', 'Link CTR', 'CPC', 'CPM', 'Engagement', 'Engagement Rate', 'Video Views', 'Conversions', 'CPA', 'Status', 'Fatigue Score']
    const lines = filtered.map((row) => [row.campaignName, row.objective, row.spend, row.reach, row.impressions, row.frequency, row.linkClicks, row.linkCtr, row.cpc, row.cpm, row.engagement, row.engagementRate, row.videoViews, row.conversions, row.cpa, statusLabel[row.status], row.fatigueScore].join(','))
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'meta-ads-campaign-performance.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <GlassCard interactive={false} className="google-panel google-table-card">
      <div className="google-panel__head">
        <SectionTitle icon={Table2} title="Campaign Performance" subtitle={`${filtered.length.toLocaleString('id-ID')} campaign`} />
        <button className="google-icon-button" type="button" aria-label="Export Meta Ads campaign CSV" onClick={exportCsv}><Download size={16} /></button>
      </div>
      <div className="google-table-tools">
        <label><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari campaign, objective, fatigue..." /></label>
        <select aria-label="Performance status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
          <option value="all">Semua Status</option>
          {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="google-table-wrap">
        <table className="google-table">
          <thead>
            <tr>{[
              ['campaignName', 'Campaign'], ['objective', 'Objective'], ['spend', 'Spend'], ['reach', 'Reach'], ['impressions', 'Impr.'], ['frequency', 'Freq.'], ['linkClicks', 'Clicks'], ['linkCtr', 'CTR'], ['cpc', 'CPC'], ['cpm', 'CPM'], ['engagement', 'Eng.'], ['engagementRate', 'Eng. Rate'], ['videoViews', 'Views'], ['conversions', 'Conv.'], ['cpa', 'CPA'], ['fatigueScore', 'Fatigue'], ['status', 'Status'],
            ].map(([key, label]) => <th key={key}><button type="button" onClick={() => updateSort(key as SortKey)}>{label}</button></th>)}</tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.campaignId}>
                <td>{row.campaignName}</td><td>{row.objective}</td><td>{formatCompactCurrency(row.spend)}</td><td>{formatCompactNumber(row.reach)}</td><td>{formatCompactNumber(row.impressions)}</td><td>{formatFrequency(row.frequency)}</td><td>{formatCompactNumber(row.linkClicks)}</td><td>{formatPercent(row.linkCtr, 2)}</td><td>{formatCompactCurrency(row.cpc)}</td><td>{formatCompactCurrency(row.cpm)}</td><td>{formatCompactNumber(row.engagement)}</td><td>{formatPercent(row.engagementRate, 2)}</td><td>{formatCompactNumber(row.videoViews)}</td><td>{formatCompactNumber(row.conversions)}</td><td>{formatCompactCurrency(row.cpa)}</td><td>{row.fatigueScore.toFixed(2).replace('.', ',')}</td><td><span className={`google-status google-status--${row.status === 'scale' ? 'excellent' : row.status === 'efficient' ? 'efficient' : row.status === 'underperforming' ? 'underperforming' : 'monitor'}`}>{statusLabel[row.status]}</span></td>
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
