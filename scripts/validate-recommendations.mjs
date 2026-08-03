import fs from 'node:fs'
import path from 'node:path'

const file = path.join('public', 'assets', 'recommendations.json')
const payload = JSON.parse(fs.readFileSync(file, 'utf8'))

const priorities = new Set(['critical', 'high', 'medium', 'low'])
const impacts = new Set(['high', 'medium', 'low'])
const efforts = new Set(['high', 'medium', 'low'])
const statuses = new Set(['new', 'review', 'planned', 'in-progress', 'completed', 'dismissed', 'blocked'])
const owners = new Set(payload.dims?.owners ?? [])

function assert(condition, message) {
  if (!condition) {
    console.error(`Recommendation validation failed: ${message}`)
    process.exit(1)
  }
}

assert(payload.meta && payload.dims && Array.isArray(payload.recommendations), 'missing payload shape')
assert(payload.meta.decisionSupportNote.includes('not automated actions'), 'decision support note missing')
assert(payload.recommendations.length > 0, 'no recommendations generated')

const ids = new Set()
const exact = new Set()
for (const [index, item] of payload.recommendations.entries()) {
  assert(item.id && !ids.has(item.id), `duplicate or missing id row ${index}`)
  ids.add(item.id)
  assert(item.title && item.summary && item.action, `missing title/summary/action ${item.id}`)
  assert(item.target && item.target.entityType && item.target.entityLabel, `invalid target ${item.id}`)
  assert(Array.isArray(item.evidence) && item.evidence.length >= 1, `missing evidence ${item.id}`)
  assert(Array.isArray(item.sourceModules) && item.sourceModules.length >= 1, `missing source modules ${item.id}`)
  assert(priorities.has(item.priority), `invalid priority ${item.id}`)
  assert(impacts.has(item.impact), `invalid impact ${item.id}`)
  assert(efforts.has(item.effort), `invalid effort ${item.id}`)
  assert(statuses.has(item.status), `invalid status ${item.id}`)
  assert(owners.has(item.owner), `invalid owner ${item.id}`)
  assert(item.confidenceScore >= 0 && item.confidenceScore <= 1, `confidence out of range ${item.id}`)
  assert(item.recommendationScore >= 0 && item.recommendationScore <= 100, `score out of range ${item.id}`)
  assert(Number.isFinite(item.urgencyScore), `urgency invalid ${item.id}`)
  assert(item.limitationNote, `missing limitation note ${item.id}`)
  assert(item.impactBasis || item.estimatedImpact?.basis, `missing impact basis ${item.id}`)
  if (item.estimatedImpact) assert(item.estimatedImpact.basis, `estimated impact missing basis ${item.id}`)
  if (item.blocker) assert(item.status === 'blocked', `blocked recommendation not marked blocked ${item.id}`)
  for (const evidence of item.evidence) {
    assert(evidence.id && evidence.label && evidence.formattedValue && evidence.sourceModule, `invalid evidence in ${item.id}`)
    if (evidence.rawValue !== undefined) assert(Number.isFinite(evidence.rawValue), `non-finite evidence raw value ${item.id}`)
  }
  for (const dep of item.dependencyIds ?? []) assert(ids.has(dep) || payload.recommendations.some((row) => row.id === dep), `invalid dependency ${dep} in ${item.id}`)
  const exactKey = `${item.category}|${item.actionType}|${item.target.entityType}|${item.target.entityId ?? item.target.entityLabel}|${item.createdForPeriod}`
  assert(!exact.has(exactKey), `exact duplicate recommendation ${exactKey}`)
  exact.add(exactKey)
}

for (const conflict of payload.conflicts ?? []) {
  assert(conflict.primaryRecommendationId && ids.has(conflict.primaryRecommendationId), `invalid conflict primary ${conflict.id}`)
  assert(conflict.recommendationIds.length >= 2, `conflict without multiple recommendations ${conflict.id}`)
  for (const id of conflict.recommendationIds) assert(ids.has(id), `conflict references unknown recommendation ${id}`)
}

for (const dep of payload.dependencies ?? []) {
  assert(ids.has(dep.sourceRecommendationId), `dependency source unknown ${dep.sourceRecommendationId}`)
  assert(ids.has(dep.targetRecommendationId), `dependency target unknown ${dep.targetRecommendationId}`)
}

assert(payload.coverage.eligibleRisks >= payload.coverage.risksWithRecommendation, 'coverage count invalid')
assert(payload.coverage.actionCoverage >= 0 && payload.coverage.actionCoverage <= 1, 'coverage rate invalid')

console.log('Recommendation validation passed')
console.log(`  recommendations   ${payload.recommendations.length.toLocaleString('en-US')}`)
console.log(`  conflicts         ${(payload.conflicts ?? []).length.toLocaleString('en-US')}`)
console.log(`  unaddressed risks ${(payload.unaddressedRisks ?? []).length.toLocaleString('en-US')}`)
console.log(`  action coverage   ${(payload.coverage.actionCoverage * 100).toFixed(1)}%`)
