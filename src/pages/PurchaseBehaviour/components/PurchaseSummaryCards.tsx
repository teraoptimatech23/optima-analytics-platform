import { BadgeDollarSign, Boxes, ReceiptText, RefreshCcw, Repeat2, ShoppingBag } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard/KpiCard'
import type { PurchaseKpiSummary } from '@/data/purchaseBehaviourSelectors'
import { formatClv, formatCurrency, formatFrequency, formatNumber, formatPercent, formatScore } from '@/data/formatters'

export default function PurchaseSummaryCards({ summary }: { summary: PurchaseKpiSummary }) {
  const cards = [
    { id: 'tx', title: 'Total Transactions', value: formatNumber(summary.totalTransactions), change: 'transaksi aktif', icon: ReceiptText, tone: 'blue' as const, trend: [summary.totalTransactions * .82, summary.totalTransactions * .93, summary.totalTransactions] },
    { id: 'basket', title: 'Average Basket Size', value: formatCurrency(summary.avgBasket), change: 'per order', icon: ShoppingBag, tone: 'purple' as const, trend: [summary.avgBasket * .9, summary.avgBasket * .97, summary.avgBasket] },
    { id: 'freq', title: 'Purchase Frequency', value: formatFrequency(summary.purchaseFrequency), change: 'per pelanggan/bln', icon: Repeat2, tone: 'cyan' as const, trend: [summary.purchaseFrequency * .8, summary.purchaseFrequency * .92, summary.purchaseFrequency] },
    { id: 'repeat', title: 'Repeat Purchase Rate', value: formatPercent(summary.repeatRate), change: 'activity repeat', icon: RefreshCcw, tone: 'orange' as const, trend: [summary.repeatRate * .7, summary.repeatRate * .9, summary.repeatRate] },
    { id: 'items', title: 'Avg Items / Transaction', value: formatScore(summary.avgItemsPerTransaction), change: 'item basket', icon: Boxes, tone: 'blue' as const, trend: [summary.avgItemsPerTransaction * .9, summary.avgItemsPerTransaction] },
    { id: 'clv', title: 'Average CLV', value: formatClv(summary.avgClv), change: 'customer value', icon: BadgeDollarSign, tone: 'purple' as const, trend: [summary.avgClv * .88, summary.avgClv * .96, summary.avgClv] },
  ]

  return <section className="purchase-behaviour__kpis">{cards.map(({ id, ...card }) => <KpiCard key={id} direction="up" positive {...card} />)}</section>
}
