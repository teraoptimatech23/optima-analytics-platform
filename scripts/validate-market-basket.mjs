import fs from 'node:fs'

const cube = JSON.parse(fs.readFileSync('src/data/insights.json', 'utf8'))
const MBB = { unique: 13, encodedItems: 15 }
const parseItems = (encoded) => String(encoded).split(',').filter(Boolean).map((item) => {
  const [product, qty, amount] = item.split(':').map(Number)
  return { product, qty, amount }
})

const productCounts = new Map()
const pairCounts = new Map()
let eligibleTransactions = 0
let multiItemTransactions = 0
let invalidQty = 0

for (const row of cube.marketBasketBaskets) {
  eligibleTransactions += 1
  const items = parseItems(row[MBB.encodedItems])
  const uniqueProducts = new Set(items.map((item) => item.product))
  if (items.some((item) => item.qty <= 0)) invalidQty += 1
  if (uniqueProducts.size !== row[MBB.unique]) throw new Error(`encoded item count mismatch on basket ${eligibleTransactions}`)
  for (const product of uniqueProducts) productCounts.set(product, (productCounts.get(product) ?? 0) + 1)
  const sorted = [...uniqueProducts].sort((a, b) => a - b)
  if (sorted.length >= 2) multiItemTransactions += 1
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const a = sorted[i]
      const b = sorted[j]
      if (a === b) throw new Error(`self-pair detected for product ${a}`)
      if (a > b) throw new Error(`non-canonical pair detected: ${a}|${b}`)
      const key = `${a}|${b}`
      pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
    }
  }
}

if (invalidQty) throw new Error(`${invalidQty} item rows have invalid quantity`)

let checked = 0
for (const [key, pairCount] of pairCounts) {
  const [a, b] = key.split('|').map(Number)
  const countA = productCounts.get(a) ?? 0
  const countB = productCounts.get(b) ?? 0
  const support = eligibleTransactions ? pairCount / eligibleTransactions : 0
  const confidenceAToB = countA ? pairCount / countA : 0
  const confidenceBToA = countB ? pairCount / countB : 0
  const lift = countA && countB && eligibleTransactions ? confidenceAToB / (countB / eligibleTransactions) : 0
  if (pairCount > countA) throw new Error(`pairCount > countA for ${key}`)
  if (pairCount > countB) throw new Error(`pairCount > countB for ${key}`)
  if (support < 0 || support > 1) throw new Error(`support out of bounds for ${key}`)
  if (confidenceAToB < 0 || confidenceAToB > 1) throw new Error(`confidence A->B out of bounds for ${key}`)
  if (confidenceBToA < 0 || confidenceBToA > 1) throw new Error(`confidence B->A out of bounds for ${key}`)
  if (lift < 0 || !Number.isFinite(lift)) throw new Error(`invalid lift for ${key}`)
  checked += 1
}

console.log('MARKET BASKET VALIDATION')
console.log('────────────────────────────────────────────────────────────────')
console.log(`  Eligible transactions              ${eligibleTransactions.toLocaleString('en-US')}`)
console.log(`  Multi-item transactions            ${multiItemTransactions.toLocaleString('en-US')}`)
console.log(`  Unique products                     ${productCounts.size.toLocaleString('en-US')}`)
console.log(`  Canonical product pairs             ${pairCounts.size.toLocaleString('en-US')}`)
console.log(`  Pair rules checked                  ${(checked * 2).toLocaleString('en-US')}`)
console.log('  Quantity validity                   OK')
console.log('  Metric bounds                       OK')
console.log('  Canonical pair uniqueness           OK')
