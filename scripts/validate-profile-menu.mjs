import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const sidebar = readFileSync(resolve(root, 'src/components/layout/Sidebar/Sidebar.tsx'), 'utf8')
const sidebarStyles = readFileSync(resolve(root, 'src/components/layout/Sidebar/Sidebar.less'), 'utf8')
const sidebarItemStyles = readFileSync(resolve(root, 'src/components/layout/SidebarItem/SidebarItem.less'), 'utf8')
const topbar = readFileSync(resolve(root, 'src/components/layout/Topbar/Topbar.tsx'), 'utf8')
const topbarStyles = readFileSync(resolve(root, 'src/components/layout/Topbar/Topbar.less'), 'utf8')
const summary = readFileSync(resolve(root, 'src/pages/Summary/index.tsx'), 'utf8')
const summaryStyles = readFileSync(resolve(root, 'src/pages/Summary/index.less'), 'utf8')
const sidebarItems = readFileSync(resolve(root, 'src/components/layout/Sidebar/valueLoopSidebarItems.ts'), 'utf8')
const valueLoopConfig = readFileSync(resolve(root, 'src/config/valueLoop.ts'), 'utf8')
const valueLoopPage = readFileSync(resolve(root, 'src/pages/ValueLoop/index.tsx'), 'utf8')
const predictivePage = readFileSync(resolve(root, 'src/pages/PredictiveAnalytics/index.tsx'), 'utf8')
const dataSources = readFileSync(resolve(root, 'src/data/sources/index.ts'), 'utf8')
const dataSourceTypes = readFileSync(resolve(root, 'src/data/sources/types.ts'), 'utf8')
const router = readFileSync(resolve(root, 'src/router/valueLoopRouter.tsx'), 'utf8')

const checks = [
  ['header logout class removed', !topbar.includes('topbar__logout') && !topbarStyles.includes('topbar__logout')],
  ['header no longer imports LogOut', !topbar.includes('LogOut')],
  ['profile trigger is semantic button', /<button[\s\S]*className=\{clsx\('sidebar__user'/.test(sidebar)],
  ['profile trigger exposes menu ARIA', sidebar.includes('aria-haspopup="menu"') && sidebar.includes('aria-expanded={profileMenuOpen}')],
  ['profile menu uses portal', sidebar.includes('createPortal(') && sidebar.includes('document.body')],
  ['menu contains Sign Out item', sidebar.includes('<span>Sign Out</span>') && sidebar.includes('openSignOutDialog')],
  ['confirmation dialog copy is present', sidebar.includes('Are you sure you want to sign out from Optima Analytics Platform?')],
  ['confirm sign out calls existing logout', /const handleSignOut = \(\) => \{[\s\S]*logout\(\)[\s\S]*navigate\('\/login'/.test(sidebar)],
  ['outside pointer listener includes trigger and menu refs', sidebar.includes("triggerRef.current?.contains(target)") && sidebar.includes("menuRef.current?.contains(target)")],
  ['escape listener is registered globally', sidebar.includes("window.addEventListener('keydown'") && sidebar.includes("document.addEventListener('keydown'")],
  ['dialog focus trap is implemented', sidebar.includes('handleDialogKeyDown') && sidebar.includes("button:not([disabled])")],
  ['expanded/collapsed/mobile portal placement styles exist', sidebarStyles.includes('sidebar__profile-menu--expanded') && sidebarStyles.includes('sidebar__profile-menu--collapsed') && sidebarStyles.includes('sidebar__profile-menu--mobile')],
  ['sidebar visual uses neutral tokenized surface', sidebarStyles.includes('--sidebar-surface') && sidebarStyles.includes('--sidebar-border') && sidebarStyles.includes('--sidebar-shadow') && !sidebarStyles.includes('fade(@cyan')],
  ['sidebar dark mode uses scoped sidebar tokens', sidebarStyles.includes(":root[data-theme='dark'] .sidebar") && sidebarStyles.includes('--sidebar-profile') && sidebarStyles.includes('--sidebar-hover-border')],
  ['sidebar active item avoids saturated gradient', !sidebarItemStyles.includes('@gradient-active') && sidebarItemStyles.includes('background: var(--sidebar-active)') && sidebarItemStyles.includes('box-shadow: var(--sidebar-active-shadow)')],
  ['sidebar active item has vertical indicator', sidebarItemStyles.includes('width: 3px') && sidebarItemStyles.includes('height: 22px') && sidebarItemStyles.includes('left: 6px')],
  ['sidebar submenu active avoids white pill', sidebarItemStyles.includes('background: rgba(47, 115, 255, .07)') && sidebarItemStyles.includes('&.sidebar-item--active') && !sidebarItemStyles.includes('background: #fff')],
  ['sidebar hover is subtle horizontal motion', sidebarItemStyles.includes('transform: translateX(2px)') && sidebarStyles.includes('transform: translateX(2px)')],
  ['sidebar profile uses subtle shared surface tokens', sidebarStyles.includes('background: var(--sidebar-profile)') && sidebarStyles.includes('background: var(--sidebar-profile-hover)')],
  ['sidebar uses DD-DVL information architecture', sidebar.includes('valueLoopSidebarItems') && sidebarItems.includes("label: 'Summary'") && sidebarItems.includes("label: 'Data-Driven Digital Value Loop'")],
  ['sidebar exposes exactly seven Value Loop stages', ['Customer Behavior', 'Traffic Acquisition', 'Conversion', 'Engagement', 'Retention', 'Analytics', 'Profit Optimization'].every((label) => valueLoopConfig.includes(`label: '${label}'`))],
  ['old analytics tree is absent from active sidebar', !sidebarItems.includes("label: 'Customer Insights'") && !sidebarItems.includes("label: 'Purchase Analytics'") && !sidebarItems.includes("label: 'Marketing Analytics'")],
  ['predictive analytics is nested in Analytics loop', !sidebarItems.includes("path: '/predictive-analytics'") && valueLoopConfig.includes("id: 'analytics'") && valueLoopConfig.includes("id: 'retention-prediction'")],
  ['summary keeps executive rows and removes detailed row three', summary.includes('summary-hero-grid') && summary.includes('summary-engines') && summary.includes('summary-bottom-grid') && !summary.includes('<section className="summary-analysis-grid"')],
  ['summary renders seven clickable DD-DVL loops', summary.includes('valueLoopStages.map') && summary.includes('to={engine.route}') && summary.includes('engine.primaryKpi') && router.includes('path="/value-loop/customer-behavior"') && router.includes('path="/value-loop/profit-optimization"')],
  ['stage containers render existing analytics components', valueLoopPage.includes('CustomerProfile') && valueLoopPage.includes('CampaignPerformance') && valueLoopPage.includes('RFMAnalysis') && valueLoopPage.includes('Recommendation') && valueLoopPage.includes('<ActiveAnalytics />')],
  ['predictive page consolidates validated existing models', predictivePage.includes('ChurnPrediction') && predictivePage.includes('CLVPrediction') && predictivePage.includes('DemandForecast') && predictivePage.includes('SalesForecast') && predictivePage.includes('<ActiveAnalytics />')],
  ['legacy routes redirect into Value Loop views', sidebarItems.includes("'/marketing-analytics/google-ads': '/value-loop/traffic-acquisition?view=google-ads'") && sidebarItems.includes("'/predictive-analytics': '/value-loop/analytics'") && router.includes('Object.entries(legacyRedirects)')],
  ['data sources are canonical and explicitly synthetic', dataSources.includes('createSyntheticDataSourceAdapter') && dataSourceTypes.includes("ConnectionStatus = 'Synthetic'") && dataSourceTypes.includes("'fact_profit'") && !dataSources.includes("connectionStatus: 'Connected'")],
  ['summary bottom grid keeps compact 3-panel structure', summary.includes('summary-bottom-grid') && summaryStyles.includes('grid-template-columns: minmax(0, .95fr) minmax(0, 1.45fr) minmax(340px, 1.35fr)')],
  ['summary key insights use compact semantic rows', summary.includes('summary-insight-row summary-insight-row--green') && summary.includes('summary-insight-row summary-insight-row--pink') && summaryStyles.includes('-webkit-line-clamp: 2')],
  ['summary recommendations use dynamic compact rows', summary.includes('const priorityRecommendations = data.recommendations.slice(0, 3)') && summary.includes('priorityRecommendations.map') && summary.includes('impactLabel(item.impact)') && !summary.includes("+Rp{index === 0 ? '480M' : '240M'}") && !summary.includes('Scale Google Ads ROAS Tinggi')],
  ['summary recommendation rows are list-like not giant cards', summaryStyles.includes('grid-template-columns: 28px 24px minmax(0, 1fr) minmax(82px, auto) auto') && summaryStyles.includes('border-bottom: 1px solid rgba(203, 213, 225, .52)') && !summaryStyles.includes('background: #f8fbff; border: 1px solid #edf2fb;')],
  ['summary executive uses horizontal intro and compact KPI footer', summary.includes('summary-executive__intro') && summaryStyles.includes('grid-template-columns: 58px minmax(0, 1fr)') && summary.includes('summary-executive__stats') && summaryStyles.includes('grid-template-columns: repeat(3, minmax(0, 1fr))')],
  ['summary bottom panels use semantic Link affordance', summary.includes('className="summary-panel summary-list-panel summary-action-panel"') && summary.includes('className="summary-panel summary-rec-panel summary-action-panel"') && !summary.includes('<a href="/ai-insight"') && !summary.includes('<a href="/recommendation"')],
  ['summary bottom CTA is compact non-nested cue', summary.includes('summary-bottom-cta') && summaryStyles.includes('.summary-bottom-cta') && summaryStyles.includes('summary-action-panel:hover .summary-bottom-cta')],
  ['summary recommendation rows expose hover cue', summary.includes('summary-rec__cue') && summaryStyles.includes('.summary-rec__cue') && summaryStyles.includes('summary-rec:hover .summary-rec__cue')],
  ['summary bottom focus and card hover polish exist', summaryStyles.includes('.summary-action-panel:focus-visible') && summaryStyles.includes('.summary-bottom-grid .summary-panel:hover') && summaryStyles.includes('translateY(-2px)')],
  ['summary impact and effort labels stay dynamic', summary.includes('function effortLabel') && summary.includes('Dampak ${impact}') && summary.includes('effortLabel(item.effort)')],
  ['summary dark mode is scoped to existing theme attribute', summaryStyles.includes(":root[data-theme='dark'] .summary-page") && summaryStyles.includes(":root[data-theme='dark'] .summary-health-card")],
  ['summary dark surfaces use shared glass tokens', summaryStyles.includes('rgba(var(--tint),') && summaryStyles.includes('rgba(var(--edge),') && summaryStyles.includes('rgba(var(--shade),')],
  ['summary dark typography uses existing text tokens', summaryStyles.includes('color: @text-primary') && summaryStyles.includes('color: @text-muted') && summaryStyles.includes('color: @text-secondary')],
  ['summary dark charts and funnel use tokenized contrast', summaryStyles.includes(":root[data-theme='dark'] .summary-chart-grid") && summaryStyles.includes(":root[data-theme='dark'] .summary-funnel-shape polygon")],
  ['summary dark business engines preserve stepper and connectors', summaryStyles.includes(":root[data-theme='dark'] .summary-engine-stepper") && summaryStyles.includes(":root[data-theme='dark'] .summary-engine-connector") && summaryStyles.includes(":root[data-theme='dark'] .summary-engine-stepper__warning")],
  ['summary dark bottom cards preserve action panels', summaryStyles.includes(":root[data-theme='dark'] .summary-bottom-grid .summary-panel") && summaryStyles.includes(":root[data-theme='dark'] .summary-action-panel:hover .summary-bottom-cta")],
]

const failed = checks.filter(([, pass]) => !pass)
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`)
}

if (failed.length > 0) {
  console.error(`\nProfile menu validation failed: ${failed.map(([name]) => name).join(', ')}`)
  process.exit(1)
}
