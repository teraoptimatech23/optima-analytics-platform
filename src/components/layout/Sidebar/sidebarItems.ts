import {
  BarChart3,
  BrainCircuit,
  CircleDollarSign,
  CircleUserRound,
  ClipboardList,
  GalleryVerticalEnd,
  Gauge,
  Home,
  Lightbulb,
  LineChart,
  Megaphone,
  Network,
  PackageSearch,
  Route,
  SearchCheck,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
  WandSparkles,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface SidebarLeafItem {
  id: string
  label: string
  icon: LucideIcon
  path: string
  description?: string
}

export interface SidebarSection {
  id: string
  label: string
  icon: LucideIcon
  children: SidebarLeafItem[]
}

export type SidebarMenuNode = SidebarLeafItem | SidebarSection

export const sidebarItems: SidebarMenuNode[] = [
  { id: 'summary', label: 'Ringkasan', icon: Home, path: '/' },
  {
    id: 'growth-loop',
    label: 'Growth Loop',
    icon: Sparkles,
    path: '/growth-loop',
    description: 'DDDVL Command Center yang menghubungkan data, insight, keputusan, value, dan learning loop.',
  },
  {
    id: 'customer-insights',
    label: 'Customer Insights',
    icon: CircleUserRound,
    children: [
      { id: 'customer-profile', label: 'Profil Pelanggan', icon: CircleUserRound, path: '/customer-insights/profil-pelanggan' },
      { id: 'customer-needs', label: 'Kebutuhan Pelanggan', icon: Target, path: '/customer-insights/kebutuhan-pelanggan' },
      { id: 'pain-points', label: 'Pain Points', icon: Lightbulb, path: '/customer-insights/pain-points' },
      {
        id: 'motivation-drivers',
        label: 'Motivasi Pelanggan',
        icon: Gauge,
        path: '/customer-insights/motivasi-pelanggan',
        description: 'Halaman ini akan merangkum faktor pendorong kunjungan, pembelian ulang, dan loyalitas pelanggan.',
      },
      {
        id: 'customer-perception',
        label: 'Persepsi Pelanggan',
        icon: UsersRound,
        path: '/customer-insights/persepsi-pelanggan',
        description: 'Halaman ini akan menampilkan persepsi pelanggan terhadap brand, layanan, harga, dan pengalaman outlet.',
      },
    ],
  },
  {
    id: 'purchase-analytics',
    label: 'Purchase Analytics',
    icon: ShoppingBag,
    children: [
      { id: 'purchase-behaviour', label: 'Perilaku Pembelian', icon: ShoppingBag, path: '/purchase-analytics/perilaku-pembelian' },
      {
        id: 'rfm-analysis',
        label: 'RFM Analysis',
        icon: SearchCheck,
        path: '/purchase-analytics/rfm-analysis',
        description: 'Halaman ini akan mengelompokkan pelanggan berdasarkan recency, frequency, dan monetary value untuk prioritas aktivasi.',
      },
      {
        id: 'cohort-analysis',
        label: 'Cohort Analysis',
        icon: GalleryVerticalEnd,
        path: '/purchase-analytics/cohort-analysis',
        description: 'Halaman ini akan membandingkan retensi dan nilai pelanggan berdasarkan periode akuisisi atau pembelian pertama.',
      },
      {
        id: 'market-basket-analysis',
        label: 'Market Basket Analysis',
        icon: PackageSearch,
        path: '/purchase-analytics/market-basket',
        description: 'Halaman ini akan menampilkan kombinasi produk atau kategori yang sering terbeli bersama untuk strategi bundling.',
      },
      {
        id: 'customer-journey',
        label: 'Customer Journey',
        icon: Route,
        path: '/purchase-analytics/customer-journey',
        description: 'Halaman ini akan memetakan perjalanan pelanggan dari akuisisi, pembelian pertama, repeat, loyal, sampai risiko churn.',
      },
    ],
  },
  {
    id: 'marketing-analytics',
    label: 'Marketing Analytics',
    icon: Megaphone,
    children: [
      {
        id: 'google-ads',
        label: 'Google Ads',
        icon: SearchCheck,
        path: '/marketing-analytics/google-ads',
        description: 'Halaman ini akan menampilkan performa Google Ads, termasuk spend, CTR, CPA, conversion value, dan ROAS.',
      },
      {
        id: 'meta-ads',
        label: 'Meta Ads',
        icon: Network,
        path: '/marketing-analytics/meta-ads',
        description: 'Halaman ini akan menampilkan performa Meta Ads untuk awareness, traffic, conversion, dan efisiensi biaya.',
      },
      {
        id: 'youtube-ads',
        label: 'YouTube Ads',
        icon: Youtube,
        path: '/marketing-analytics/youtube-ads',
        description: 'Halaman ini akan menampilkan performa YouTube Ads dari view, click, conversion, sampai efektivitas biaya.',
      },
      {
        id: 'campaign-performance',
        label: 'Campaign Performance',
        icon: BarChart3,
        path: '/marketing-analytics/campaign-performance',
        description: 'Halaman ini akan membandingkan performa campaign lintas channel dan objektif bisnis.',
      },
      {
        id: 'attribution',
        label: 'Attribution',
        icon: Sparkles,
        path: '/marketing-analytics/attribution',
        description: 'Halaman ini akan membantu membaca kontribusi channel marketing terhadap conversion dan revenue.',
      },
    ],
  },
  {
    id: 'predictive-analytics',
    label: 'Predictive Analytics',
    icon: BrainCircuit,
    children: [
      {
        id: 'churn-prediction',
        label: 'Churn Prediction',
        icon: TrendingUp,
        path: '/predictive-analytics/churn-prediction',
        description: 'Halaman ini akan menampilkan prediksi pelanggan yang berpotensi churn berdasarkan perilaku pembelian dan histori transaksi.',
      },
      {
        id: 'clv-prediction',
        label: 'Customer Lifetime Value Prediction',
        icon: CircleDollarSign,
        path: '/predictive-analytics/customer-lifetime-value-prediction',
        description: 'Halaman ini akan menampilkan proyeksi nilai pelanggan untuk membantu prioritas retensi dan akuisisi.',
      },
      {
        id: 'next-best-offer',
        label: 'Next Best Offer',
        icon: WandSparkles,
        path: '/predictive-analytics/next-best-offer',
        description: 'Halaman ini akan merekomendasikan penawaran berikutnya berdasarkan segmentasi dan riwayat interaksi pelanggan.',
      },
      {
        id: 'demand-forecast',
        label: 'Demand Forecast',
        icon: LineChart,
        path: '/predictive-analytics/demand-forecast',
        description: 'Halaman ini akan menampilkan estimasi permintaan kategori atau outlet untuk perencanaan stok dan operasional.',
      },
      {
        id: 'sales-forecast',
        label: 'Sales Forecast',
        icon: BarChart3,
        path: '/predictive-analytics/sales-forecast',
        description: 'Halaman ini akan menampilkan forecast penjualan untuk mendukung target revenue dan kapasitas operasional.',
      },
    ],
  },
  {
    id: 'ai-insight',
    label: 'AI Insight',
    icon: BrainCircuit,
    path: '/ai-insight',
    description: 'Halaman ini akan merangkum insight otomatis dari data pelanggan, pembelian, marketing, dan operasional.',
  },
  {
    id: 'recommendations',
    label: 'Recommendation',
    icon: ClipboardList,
    path: '/recommendation',
    description: 'Halaman ini akan mengubah insight menjadi rekomendasi prioritas untuk strategi customer, purchase, dan marketing.',
  },
]

export const legacyRedirects: Record<string, string> = {
  '/dashboard': '/',
  '/dddvl': '/growth-loop',
  '/growth-loop-command-center': '/growth-loop',
  '/profil-pelanggan': '/customer-insights/profil-pelanggan',
  '/kebutuhan-pelanggan': '/customer-insights/kebutuhan-pelanggan',
  '/pain-points': '/customer-insights/pain-points',
  '/pendorong-motivasi': '/customer-insights/motivasi-pelanggan',
  '/persepsi-pelanggan': '/customer-insights/persepsi-pelanggan',
  '/perilaku-pembelian': '/purchase-analytics/perilaku-pembelian',
  '/purchase-analytics/market-basket-analysis': '/purchase-analytics/market-basket',
  '/predictive-analytics/customer-lifetime-value': '/predictive-analytics/customer-lifetime-value-prediction',
  '/predictive-analytics/clv-prediction': '/predictive-analytics/customer-lifetime-value-prediction',
  '/insight-dashboard': '/ai-insight',
  '/rekomendasi': '/recommendation',
  '/laporan-kustom': '/recommendation',
}

export function isSidebarSection(node: SidebarMenuNode): node is SidebarSection {
  return 'children' in node
}

export function flattenSidebarItems(nodes: SidebarMenuNode[] = sidebarItems): SidebarLeafItem[] {
  return nodes.flatMap((node) => (isSidebarSection(node) ? node.children : [node]))
}

export function isMenuActive(pathname: string, itemPath: string) {
  if (itemPath === '/') return pathname === '/'
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

export function isSectionActive(pathname: string, section: SidebarSection) {
  return section.children.some((item) => isMenuActive(pathname, item.path))
}
