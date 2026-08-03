import { useMemo, useState } from 'react'
import { KeyRound, Search } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { GoogleAdsKeywordRow } from '@/data/googleAdsSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent, formatRoas } from '@/data/formatters'

type SortKey = keyof Pick<GoogleAdsKeywordRow, 'keyword' | 'matchType' | 'campaignName' | 'impressions' | 'clicks' | 'ctr' | 'cpc' | 'conversions' | 'cpa' | 'conversionValue' | 'roas' | 'intent'>
const PAGE_SIZE = 10

export default function KeywordPerformance({ rows }: { rows: GoogleAdsKeywordRow[] }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'conversionValue', direction: 'desc' })
  const filtered = useMemo(() => {
    const query = search.toLowerCase()
    return rows
      .filter((row) => !query || [row.keyword, row.matchType, row.campaignName, row.intent].some((value) => value.toLowerCase().includes(query)))
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
    <GlassCard interactive={false} className="google-panel google-table-card">
      <SectionTitle icon={KeyRound} title="Keyword Performance" subtitle="Keyword aggregate, match type, dan intent transparan" />
      <div className="google-keyword-splits">
        <div><strong>Top Converting</strong>{rows.slice(0, 3).map((row) => <span key={row.id}>{row.keyword} · {formatCompactNumber(row.conversions)} conv.</span>)}</div>
        <div><strong>Highest Spend</strong>{[...rows].sort((a, b) => b.spend - a.spend).slice(0, 3).map((row) => <span key={row.id}>{row.keyword} · {formatCompactCurrency(row.spend)}</span>)}</div>
        <div><strong>Underperforming</strong>{[...rows].sort((a, b) => b.cpa - a.cpa).slice(0, 3).map((row) => <span key={row.id}>{row.keyword} · CPA {formatCompactCurrency(row.cpa)}</span>)}</div>
      </div>
      <div className="google-table-tools">
        <label><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari keyword, campaign, intent..." /></label>
      </div>
      <div className="google-table-wrap">
        <table className="google-table">
          <thead>
            <tr>{[
              ['keyword', 'Keyword'], ['matchType', 'Match'], ['intent', 'Intent'], ['campaignName', 'Campaign'], ['impressions', 'Impr.'], ['clicks', 'Clicks'], ['ctr', 'CTR'], ['cpc', 'CPC'], ['conversions', 'Conv.'], ['cpa', 'CPA'], ['conversionValue', 'Value'], ['roas', 'ROAS'],
            ].map(([key, label]) => <th key={key}><button type="button" onClick={() => updateSort(key as SortKey)}>{label}</button></th>)}</tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id}>
                <td>{row.keyword}</td><td>{row.matchType}</td><td>{row.intent}</td><td>{row.campaignName}</td><td>{formatCompactNumber(row.impressions)}</td><td>{formatCompactNumber(row.clicks)}</td><td>{formatPercent(row.ctr, 2)}</td><td>{formatCompactCurrency(row.cpc)}</td><td>{formatCompactNumber(row.conversions)}</td><td>{formatCompactCurrency(row.cpa)}</td><td>{formatCompactCurrency(row.conversionValue)}</td><td>{formatRoas(row.roas)}</td>
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
