import { useMemo, useState } from 'react'
import { Download, Search, Table2 } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { AssociationRule } from '@/data/marketBasketSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent } from '@/data/formatters'

const PAGE_SIZE = 12
type SortKey = keyof Pick<AssociationRule, 'antecedentLabel' | 'consequentLabel' | 'pairCount' | 'support' | 'confidence' | 'lift' | 'basketRevenue' | 'averageBasket' | 'opportunityScore' | 'strength'>

export default function AssociationRuleTable({ rules }: { rules: AssociationRule[] }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'opportunityScore', direction: 'desc' })
  const filtered = useMemo(() => {
    const query = search.toLowerCase()
    return rules
      .filter((rule) => !query || [rule.antecedentLabel, rule.consequentLabel, rule.strength, rule.recommendedUse].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => {
        const left = a[sort.key]
        const right = b[sort.key]
        const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'id-ID')
        return sort.direction === 'asc' ? result : -result
      })
  }, [rules, search, sort])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const updateSort = (key: SortKey) => setSort((state) => ({ key, direction: state.key === key && state.direction === 'desc' ? 'asc' : 'desc' }))
  const exportCsv = () => {
    const header = ['Antecedent', 'Consequent', 'Antecedent Transactions', 'Consequent Transactions', 'Pair Transactions', 'Support', 'Confidence', 'Lift', 'Basket Revenue', 'Average Basket', 'Strength', 'Recommended Use']
    const lines = filtered.map((rule) => [rule.antecedentLabel, rule.consequentLabel, rule.antecedentCount, rule.consequentCount, rule.pairCount, rule.support, rule.confidence, rule.lift, rule.basketRevenue, rule.averageBasket, rule.strength, rule.recommendedUse].join(','))
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'market-basket-rules.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <GlassCard interactive={false} className="market-panel market-table-card">
      <div className="market-panel__head">
        <SectionTitle icon={Table2} title="Association Rules" subtitle="Directional rules A → B dan B → A dapat memiliki confidence berbeda" />
        <button className="market-icon-button" type="button" aria-label="Export association rules CSV" onClick={exportCsv}><Download size={16} /></button>
      </div>
      <div className="market-table-tools">
        <label><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari produk atau recommended use..." /></label>
      </div>
      <div className="market-table-wrap">
        <table className="market-table">
          <thead><tr>{[
            ['antecedentLabel', 'Antecedent'], ['consequentLabel', 'Consequent'], ['antecedentCount', 'Antecedent Tx'], ['consequentCount', 'Consequent Tx'], ['pairCount', 'Pair Tx'], ['support', 'Support'], ['confidence', 'Confidence'], ['lift', 'Lift'], ['basketRevenue', 'Basket Revenue'], ['averageBasket', 'Avg Basket'], ['opportunityScore', 'Score'], ['strength', 'Strength'], ['recommendedUse', 'Use'],
          ].map(([key, label]) => <th key={key}><button type="button" onClick={() => updateSort(key as SortKey)}>{label}</button></th>)}</tr></thead>
          <tbody>{rows.map((rule) => (
            <tr key={rule.id}>
              <td>{rule.antecedentLabel}</td><td>{rule.consequentLabel}</td><td>{formatCompactNumber(rule.antecedentCount)}</td><td>{formatCompactNumber(rule.consequentCount)}</td><td>{formatCompactNumber(rule.pairCount)}</td><td>{formatPercent(rule.support)}</td><td>{formatPercent(rule.confidence)}</td><td>{rule.lift.toFixed(2).replace('.', ',')}x</td><td>{formatCompactCurrency(rule.basketRevenue)}</td><td>{formatCompactCurrency(rule.averageBasket)}</td><td>{Math.round(rule.opportunityScore)}/100</td><td><span className={`market-strength market-strength--${rule.strength}`}>{rule.strength}</span></td><td>{rule.recommendedUse}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <footer className="market-pagination">
        <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Sebelumnya</button>
        <span>Halaman {safePage} dari {pages}</span>
        <button type="button" disabled={safePage === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>Berikutnya</button>
      </footer>
    </GlassCard>
  )
}
