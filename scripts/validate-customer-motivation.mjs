import fs from 'node:fs'

const FILE = 'src/data/customerMotivation.json'
const payload = JSON.parse(fs.readFileSync(FILE, 'utf8'))
const errors = []
const assert = (condition, message) => {
  if (!condition) errors.push(message)
}

const CM = {
  outlet: 0, gender: 1, age: 2, segment: 3, occupation: 4, acquisition: 5,
  member: 6, visits: 7, netSpend: 8, avgBasket: 9, voucherUses: 10,
  deliveryShare: 11, avgSat: 12, nps: 13, recency: 14, freq: 15, clv: 16,
  favoriteCategory: 17, favoriteProduct: 18, tasteScore: 19, tasteImp: 20,
  parkingImp: 38, surveyCount: 39, wouldRecommend: 40,
}
const CMM = { customer: 0, month: 1, channel: 2, tx: 3, net: 4, voucher: 5, campaign: 6, itemQty: 12, coffeeQty: 13, snackQty: 14 }

assert(payload.meta.customers === payload.customerMotivation.length, 'meta customer count must match customerMotivation rows')
assert(payload.customerMotivation.length > 0, 'customerMotivation is empty')
assert(payload.customerMotivationMonthly.length > 0, 'customerMotivationMonthly is empty')

payload.customerMotivation.forEach((row, index) => {
  assert(row[CM.outlet] >= 0 && row[CM.outlet] < payload.dims.outlets.length, `customer ${index} invalid outlet`)
  assert(row[CM.gender] >= 0 && row[CM.gender] < payload.dims.genders.length, `customer ${index} invalid gender`)
  assert(row[CM.age] >= 0 && row[CM.age] < payload.dims.ageBands.length, `customer ${index} invalid age`)
  assert(row[CM.segment] >= 0 && row[CM.segment] < payload.dims.segments.length, `customer ${index} invalid segment`)
  assert(row[CM.surveyCount] >= 1, `customer ${index} missing survey response`)
  assert(row[CM.visits] >= 0 && row[CM.netSpend] >= 0 && row[CM.clv] >= 0, `customer ${index} invalid monetary/visit values`)
  assert(row[CM.nps] >= -1 && row[CM.nps] <= 10, `customer ${index} invalid NPS`)
  for (let col = CM.tasteScore; col <= CM.parkingImp; col += 1) {
    assert(row[col] >= 0 && row[col] <= 500, `customer ${index} survey score col ${col} out of 0-500 range`)
  }
  assert(row[CM.wouldRecommend] >= 0 && row[CM.wouldRecommend] <= 100, `customer ${index} wouldRecommend out of range`)
})

let totalTx = 0
let totalItems = 0
payload.customerMotivationMonthly.forEach((row, index) => {
  assert(row[CMM.customer] >= 0 && row[CMM.customer] < payload.customerMotivation.length, `monthly row ${index} invalid customer`)
  assert(row[CMM.month] >= 0 && row[CMM.month] < payload.dims.months.length, `monthly row ${index} invalid month`)
  assert(row[CMM.channel] >= 0 && row[CMM.channel] < payload.dims.channels.length, `monthly row ${index} invalid channel`)
  assert(row[CMM.tx] > 0, `monthly row ${index} must have positive tx`)
  assert(row[CMM.net] >= 0 && row[CMM.itemQty] >= 0, `monthly row ${index} invalid net/items`)
  assert(row[CMM.coffeeQty] + row[CMM.snackQty] <= row[CMM.itemQty], `monthly row ${index} category quantity exceeds item quantity`)
  totalTx += row[CMM.tx]
  totalItems += row[CMM.itemQty]
})

assert(totalTx > 0, 'monthly transaction total must be positive')
assert(totalItems > 0, 'monthly item total must be positive')

if (errors.length) {
  console.error('\nCustomer Motivation validation failed:')
  errors.slice(0, 30).forEach((error) => console.error('  - ' + error))
  if (errors.length > 30) console.error(`  ... ${errors.length - 30} more errors`)
  process.exit(1)
}

console.log('Customer Motivation validation passed')
console.log(`  customers              ${payload.customerMotivation.length.toLocaleString('en-US')}`)
console.log(`  customer-month rows    ${payload.customerMotivationMonthly.length.toLocaleString('en-US')}`)
console.log(`  transactions covered   ${totalTx.toLocaleString('en-US')}`)
console.log(`  item units covered     ${totalItems.toLocaleString('en-US')}`)
