import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const sidebar = readFileSync(resolve(root, 'src/components/layout/Sidebar/Sidebar.tsx'), 'utf8')
const sidebarStyles = readFileSync(resolve(root, 'src/components/layout/Sidebar/Sidebar.less'), 'utf8')
const topbar = readFileSync(resolve(root, 'src/components/layout/Topbar/Topbar.tsx'), 'utf8')
const topbarStyles = readFileSync(resolve(root, 'src/components/layout/Topbar/Topbar.less'), 'utf8')

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
]

const failed = checks.filter(([, pass]) => !pass)
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`)
}

if (failed.length > 0) {
  console.error(`\nProfile menu validation failed: ${failed.map(([name]) => name).join(', ')}`)
  process.exit(1)
}
