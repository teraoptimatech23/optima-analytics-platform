import fs from 'node:fs'
import path from 'node:path'

const file = path.join('public', 'assets', 'attribution.json')
const payload = JSON.parse(fs.readFileSync(file, 'utf8'))

function assert(condition, message) {
  if (!condition) {
    console.error(`Attribution validation failed: ${message}`)
    process.exit(1)
  }
}

const models = ['first-touch', 'last-touch', 'linear', 'position-based', 'time-decay']
const windows = new Set([1, 7, 14, 30])
const validation = payload.meta?.validation

assert(payload.meta && payload.dims, 'missing top-level meta/dims')
assert(payload.meta.modelFamily === 'transparent-rule-based-attribution', 'unexpected attribution model family')
assert(payload.meta.limitation.includes('not causal incrementality'), 'causality limitation missing')
assert(Array.isArray(payload.summaryFacts) && payload.summaryFacts.length > 0, 'summary facts missing')
assert(Array.isArray(payload.creditFacts) && payload.creditFacts.length > 0, 'credit facts missing')
assert(Array.isArray(payload.pathFacts) && payload.pathFacts.length > 0, 'path facts missing')
assert(Array.isArray(payload.mediaFacts), 'media facts missing')
assert(validation, 'pipeline validation summary missing')
assert(validation.duplicateConversions === 0, 'duplicate conversion ids found during build')
assert(validation.creditSumErrors === 0, 'per-conversion credit did not sum to 1')
assert(validation.revenueSumErrors === 0, 'per-conversion attributed revenue did not equal conversion revenue')
assert(validation.nonFiniteCredit === 0, 'non-finite or negative credit found')
assert(validation.checkedConversions > 0, 'no attributed conversion checked')

for (const [index, row] of payload.summaryFacts.entries()) {
  assert(windows.has(row[0]), `invalid window in summary row ${index}`)
  for (const value of row) assert(Number.isFinite(value), `non-finite summary value row ${index}`)
  assert(row[8] >= 0 && row[8] <= 2, `invalid path type row ${index}`)
  assert(row[11] >= row[13], `attributed conversions exceed total row ${index}`)
  assert(row[12] >= row[14], `attributed revenue exceeds total row ${index}`)
  assert(row[11] === row[13] + row[15], `attributed + unattributed mismatch row ${index}`)
}

for (const [index, row] of payload.creditFacts.entries()) {
  assert(windows.has(row[0]), `invalid window in credit row ${index}`)
  assert(row[1] >= 0 && row[1] < models.length, `invalid model in credit row ${index}`)
  assert(row[9] >= 0 && row[9] <= 2, `invalid path type in credit row ${index}`)
  assert(row[12] >= 0 && row[12] < payload.dims.channels.length, `invalid channel in credit row ${index}`)
  assert(row[13] >= 0 && row[13] < payload.dims.campaigns.length, `invalid campaign in credit row ${index}`)
  for (const value of row) assert(Number.isFinite(value), `non-finite credit value row ${index}`)
  assert(row[14] >= 0, `negative credit row ${index}`)
  assert(row[15] >= 0, `negative revenue row ${index}`)
}

for (const [index, row] of payload.pathFacts.entries()) {
  assert(windows.has(row[0]), `invalid window in path row ${index}`)
  assert(row[8] >= 0 && row[8] <= 2, `invalid path type row ${index}`)
  assert(row[11] >= 0 && row[11] < payload.dims.paths.length, `invalid path index row ${index}`)
  for (const value of row) assert(Number.isFinite(value), `non-finite path value row ${index}`)
  assert(row[12] > 0, `empty path count row ${index}`)
}

const summaryByWindow = new Map()
for (const row of payload.summaryFacts) {
  const current = summaryByWindow.get(row[0]) ?? { attributedRevenue: 0, attributedConversions: 0 }
  current.attributedRevenue += row[14]
  current.attributedConversions += row[13]
  summaryByWindow.set(row[0], current)
}

for (const window of windows) {
  const summary = summaryByWindow.get(window)
  assert(summary && summary.attributedConversions > 0, `no attributed conversions for ${window}d window`)
  for (let model = 0; model < models.length; model += 1) {
    const rows = payload.creditFacts.filter((row) => row[0] === window && row[1] === model)
    const revenue = rows.reduce((sum, row) => sum + row[15], 0)
    const credit = rows.reduce((sum, row) => sum + row[14], 0)
    assert(rows.length > 0, `missing ${models[model]} rows for ${window}d`)
    assert(Math.abs(revenue - summary.attributedRevenue) <= Math.max(1000, summary.attributedRevenue * 0.0005), `model revenue conservation failed for ${models[model]} ${window}d`)
    assert(Math.abs(credit - summary.attributedConversions) <= Math.max(0.01, summary.attributedConversions * 0.0005), `model credit conservation failed for ${models[model]} ${window}d`)
  }
}

console.log('Attribution validation passed')
console.log(`  models                    ${models.join(', ')}`)
console.log(`  windows                   ${[...windows].join(', ')} days`)
console.log(`  attributed conversions    ${validation.attributedConversions.toLocaleString('en-US')}`)
console.log(`  multi-touch conversions   ${validation.multiTouchConversions.toLocaleString('en-US')}`)
console.log(`  unattributed conversions  ${validation.unattributedConversions.toLocaleString('en-US')}`)
