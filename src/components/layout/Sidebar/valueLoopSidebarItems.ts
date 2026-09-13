import { LayoutDashboard, RefreshCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { valueLoopStages } from '@/config/valueLoop'

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
  {
    id: 'summary',
    label: 'Summary',
    icon: LayoutDashboard,
    path: '/summary',
    description: 'Executive view untuk business health, Value Loop priority, insight, dan tindakan utama.',
  },
  {
    id: 'digital-value-loop',
    label: 'Data-Driven Digital Value Loop',
    icon: RefreshCcw,
    children: valueLoopStages.map((stage) => ({
      id: stage.id,
      label: stage.label,
      icon: stage.icon,
      path: stage.route,
      description: stage.summary,
    })),
  },
]

export const legacyRedirects: Record<string, string> = {
  '/dashboard': '/summary',
  '/growth-loop': '/summary',
  '/dddvl': '/summary',
  '/growth-loop-command-center': '/summary',
  '/customer-insights/profil-pelanggan': '/value-loop/customer-behavior?view=customer-profile',
  '/customer-insights/kebutuhan-pelanggan': '/value-loop/customer-behavior?view=customer-needs',
  '/customer-insights/pain-points': '/value-loop/customer-behavior?view=pain-points',
  '/customer-insights/motivasi-pelanggan': '/value-loop/customer-behavior?view=customer-motivation',
  '/customer-insights/persepsi-pelanggan': '/value-loop/customer-behavior?view=customer-perception',
  '/purchase-analytics/perilaku-pembelian': '/value-loop/conversion?view=conversion-funnel',
  '/purchase-analytics/market-basket': '/value-loop/customer-behavior?view=market-basket',
  '/purchase-analytics/market-basket-analysis': '/value-loop/customer-behavior?view=market-basket',
  '/purchase-analytics/customer-journey': '/value-loop/customer-behavior?view=customer-journey',
  '/purchase-analytics/rfm-analysis': '/value-loop/retention?view=rfm-analysis',
  '/purchase-analytics/cohort-analysis': '/value-loop/retention?view=cohort-analysis',
  '/marketing-analytics/google-ads': '/value-loop/traffic-acquisition?view=google-ads',
  '/marketing-analytics/meta-ads': '/value-loop/traffic-acquisition?view=meta-ads',
  '/marketing-analytics/youtube-ads': '/value-loop/traffic-acquisition?view=youtube-ads',
  '/marketing-analytics/campaign-performance': '/value-loop/traffic-acquisition?view=campaign-performance',
  '/marketing-analytics/attribution': '/value-loop/traffic-acquisition?view=attribution',
  '/predictive-analytics': '/value-loop/analytics',
  '/predictive-analytics/churn-prediction': '/value-loop/analytics?view=retention-prediction',
  '/predictive-analytics/customer-lifetime-value-prediction': '/value-loop/analytics?view=value-revenue-prediction',
  '/predictive-analytics/customer-lifetime-value': '/value-loop/analytics?view=value-revenue-prediction',
  '/predictive-analytics/clv-prediction': '/value-loop/analytics?view=value-revenue-prediction',
  '/predictive-analytics/demand-forecast': '/value-loop/analytics?view=value-revenue-prediction',
  '/predictive-analytics/sales-forecast': '/value-loop/analytics?view=value-revenue-prediction',
  '/predictive-analytics/next-best-offer': '/value-loop/analytics?view=recommendations',
  '/ai-insight': '/value-loop/analytics?view=ai-insight',
  '/recommendation': '/value-loop/analytics?view=recommendations',
  '/value-loop/value-optimization': '/value-loop/profit-optimization',
  '/profil-pelanggan': '/value-loop/customer-behavior?view=customer-profile',
  '/kebutuhan-pelanggan': '/value-loop/customer-behavior?view=customer-needs',
  '/pain-points': '/value-loop/customer-behavior?view=pain-points',
  '/pendorong-motivasi': '/value-loop/customer-behavior?view=customer-motivation',
  '/persepsi-pelanggan': '/value-loop/customer-behavior?view=customer-perception',
  '/perilaku-pembelian': '/value-loop/conversion?view=conversion-funnel',
  '/insight-dashboard': '/value-loop/analytics?view=ai-insight',
  '/rekomendasi': '/value-loop/analytics?view=recommendations',
  '/laporan-kustom': '/value-loop/profit-optimization?view=recommendations',
}

export function isSidebarSection(node: SidebarMenuNode): node is SidebarSection {
  return 'children' in node
}

export function flattenSidebarItems(nodes: SidebarMenuNode[] = sidebarItems): SidebarLeafItem[] {
  return nodes.flatMap((node) => (isSidebarSection(node) ? node.children : [node]))
}

export function isMenuActive(pathname: string, itemPath: string) {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

export function isSectionActive(pathname: string, section: SidebarSection) {
  return section.children.some((item) => isMenuActive(pathname, item.path))
}
