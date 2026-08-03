import fs from 'node:fs'
import path from 'node:path'

const file = path.join('public', 'assets', 'customerPerception.json')
const payload = JSON.parse(fs.readFileSync(file, 'utf8'))

function assert(condition, message) {
  if (!condition) {
    console.error(`Customer Perception validation failed: ${message}`)
    process.exit(1)
  }
}

const baseOffset = 15
const dimensionOffset = 16
const attributeOffset = dimensionOffset + payload.dims.dimensions.length
const importanceOffset = attributeOffset + payload.dims.attributes.length
const tailOffset = importanceOffset + payload.dims.attributes.length

assert(payload.meta && payload.dims && Array.isArray(payload.customerFacts), 'missing payload shape')
assert(payload.meta.surveyHasOpenText === false, 'open text flag must be false for this dataset')
assert(payload.customerFacts.length > 0, 'no customer perception facts')
assert(payload.meta.duplicateSurveyPeriods === 0, 'duplicate respondent-period found')
assert(payload.dims.attributes.length === payload.dims.attributeDimensions.length, 'attribute dimension map mismatch')
assert(payload.dims.attributes.length === payload.dims.attributeSourceTypes.length, 'attribute source map mismatch')

const seen = new Set()
for (const [index, row] of payload.customerFacts.entries()) {
  for (const value of row) assert(Number.isFinite(value), `non-finite value row ${index}`)
  const key = `${row[0]}|${row[1]}`
  assert(!seen.has(key), `duplicate customer snapshot ${key}`)
  seen.add(key)
  assert(row[baseOffset] >= 1 && row[baseOffset] <= 5, `overall score out of range row ${index}`)
  for (let i = 0; i < payload.dims.dimensions.length; i += 1) {
    const score = row[dimensionOffset + i]
    assert(score >= 1 && score <= 5, `dimension score out of range row ${index}/${i}`)
  }
  let positive = 0
  let neutral = 0
  let negative = 0
  for (let i = 0; i < payload.dims.attributes.length; i += 1) {
    const score = row[attributeOffset + i]
    assert(score >= 1 && score <= 5, `attribute score out of range row ${index}/${i}`)
    const importance = row[importanceOffset + i]
    assert(importance === 0 || (importance >= 1 && importance <= 5), `importance out of range row ${index}/${i}`)
    if (score >= 4) positive += 1
    else if (score <= 2) negative += 1
    else neutral += 1
  }
  const total = payload.dims.attributes.length
  const positiveRate = row[tailOffset + 3]
  const negativeRate = row[tailOffset + 4]
  assert(Math.abs(positiveRate - positive / total) <= 0.0002, `positive rate mismatch row ${index}`)
  assert(Math.abs(negativeRate - negative / total) <= 0.0002, `negative rate mismatch row ${index}`)
  assert(Math.abs((positive + neutral + negative) / total - 1) <= 0.000001, `bucket distribution mismatch row ${index}`)
  assert(row[14] >= 0 && row[14] < payload.dims.personas.length, `invalid persona row ${index}`)
  assert(row[tailOffset + 1] >= 0 && row[tailOffset + 1] <= 10, `NPS out of range row ${index}`)
  assert(row[tailOffset + 9] >= 0 && row[tailOffset + 9] <= 1, `repeat rate out of range row ${index}`)
}

console.log('Customer Perception validation passed')
console.log(`  respondents        ${payload.customerFacts.length.toLocaleString('en-US')}`)
console.log(`  dimensions         ${payload.dims.dimensions.length}`)
console.log(`  attributes         ${payload.dims.attributes.length}`)
console.log(`  open text survey   ${payload.meta.surveyHasOpenText}`)
