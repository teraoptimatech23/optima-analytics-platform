import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const IN_DIR = 'data'
const OUT_FILE = path.join('public', 'assets', 'rfmAnalysis.json')

async function readCsv(file, onRow) {
  const lines = readline.createInterface({
    input: fs.createReadStream(path.join(IN_DIR, file), { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })
  let header = null
  for await (const line of lines) {
    if (!line) continue
    const values = splitCsv(line)
    if (!header) {
      header = values
      continue
    }
    const row = {}
    for (let i = 0; i < header.length; i += 1) row[header[i]] = values[i] ?? ''
    onRow(row)
  }
}

function splitCsv(line) {
  const out = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) {
      out.push(current)
      current = ''
    } else current += char
  }
  out.push(current)
  return out
}

function dimension(seed = []) {
  const map = new Map()
  const values = []
  function id(value) {
    const key = value || 'Unknown'
    if (!map.has(key)) {
      map.set(key, values.length)
      values.push(key)
    }
    return map.get(key)
  }
  seed.forEach(id)
  return { id, values, map }
}

const months = dimension()
const outlets = []
const outletIndex = new Map()
const genders = dimension(['Female', 'Male'])
const ageBands = dimension(['18-24', '25-35', '36-45', '46+'])
const occupations = dimension()
const customerSegments = dimension(['Champion', 'Loyal', 'Potential', 'New', 'At Risk', 'Hibernating'])
const acquisitions = dimension()
const channels = dimension(['Dine In', 'Take Away', 'GrabFood', 'GoFood', 'ShopeeFood', 'Aplikasi Kopi Kenangan'])
const products = []
const productIndex = new Map()
const categories = dimension(['Coffee', 'Non Coffee', 'Snack'])
const customers = []
const customerIndex = new Map()

await readCsv('outlets.csv', (row) => {
  outletIndex.set(row.OutletID, outlets.length)
  outlets.push({ id: row.OutletID, name: row.OutletName, city: row.City, region: row.RegionName, type: row.OutletType })
})

await readCsv('products.csv', (row) => {
  productIndex.set(row.ProductID, products.length)
  products.push({ id: row.ProductID, name: row.ProductName, category: row.Category })
  categories.id(row.Category)
})

await readCsv('customers.csv', (row) => {
  const index = customers.length
  const favoriteProduct = productIndex.get(row.FavoriteProductID) ?? -1
  customerIndex.set(row.CustomerID, index)
  customers.push([
    outletIndex.get(row.HomeOutletID) ?? -1,
    genders.id(row.Gender),
    ageBands.id(row.AgeBand),
    occupations.id(row.Occupation),
    customerSegments.id(row.Segment),
    acquisitions.id(row.AcquisitionChannel),
    +row.IsMember,
    Math.round(+row.CLV || 0),
    Math.round((+row.AvgSatisfaction || 0) * 100),
    row.NPS === '' ? -99 : +row.NPS,
    categories.id(row.FavoriteCategory),
    favoriteProduct,
  ])
})

const transactionMeta = new Map()
const monthly = new Map()
const seenTransactions = new Set()
let validTransactions = 0
let duplicateTransactions = 0
let maxDate = '1900-01-01'
let minDate = '9999-12-31'

await readCsv('transactions.csv', (row) => {
  if (seenTransactions.has(row.TransactionID)) {
    duplicateTransactions += 1
    return
  }
  seenTransactions.add(row.TransactionID)
  const customer = customerIndex.get(row.CustomerID)
  const outlet = outletIndex.get(row.OutletID)
  if (customer === undefined || outlet === undefined) return
  const net = +row.NetAmount
  if (!Number.isFinite(net) || net < 0) return
  const status = (row.TransactionStatus || row.Status || '').toLowerCase()
  if (status.includes('cancel') || status.includes('refund')) return
  const month = months.id(row.Date.slice(0, 7))
  const channel = channels.id(row.Channel)
  const voucher = row.VoucherCode ? 1 : 0
  const campaign = row.CampaignID ? 1 : 0
  const key = `${customer}|${month}|${outlet}|${channel}`
  const cell = monthly.get(key) ?? {
    customer, month, outlet, channel, tx: 0, net: 0, gross: 0, discount: 0, voucher: 0,
    campaign: 0, memberTx: 0, satSum: 0, waitSum: 0, itemQty: 0, firstDate: row.Date, lastDate: row.Date,
  }
  cell.tx += 1
  cell.net += net
  cell.gross += +row.GrossAmount || 0
  cell.discount += +row.DiscountAmount || 0
  cell.voucher += voucher
  cell.campaign += campaign
  cell.memberTx += +row.IsMemberTransaction || 0
  cell.satSum += +row.SatisfactionScore || 0
  cell.waitSum += +row.WaitMinutes || 0
  if (row.Date < cell.firstDate) cell.firstDate = row.Date
  if (row.Date > cell.lastDate) cell.lastDate = row.Date
  monthly.set(key, cell)
  transactionMeta.set(row.TransactionID, { key, customer, month, outlet, channel })
  validTransactions += 1
  if (row.Date > maxDate) maxDate = row.Date
  if (row.Date < minDate) minDate = row.Date
})

await readCsv('transaction_items.csv', (row) => {
  const meta = transactionMeta.get(row.TransactionID)
  if (!meta) return
  const qty = +row.Qty
  if (!Number.isFinite(qty) || qty <= 0) return
  const monthlyCell = monthly.get(meta.key)
  if (monthlyCell) monthlyCell.itemQty += qty
})

const customerMonthly = [...monthly.values()]
  .sort((a, b) => a.customer - b.customer || a.month - b.month || a.outlet - b.outlet || a.channel - b.channel)
  .map((row) => [
    row.customer, row.month, row.outlet, row.channel, row.tx, Math.round(row.net),
    Math.round(row.gross), Math.round(row.discount), row.voucher, row.campaign, row.memberTx,
    Math.round(row.satSum * 100), Math.round(row.waitSum * 10), row.itemQty,
    Number(row.firstDate.replaceAll('-', '')), Number(row.lastDate.replaceAll('-', '')),
  ])

const payload = {
  meta: {
    source: 'scripts/build-rfm-analysis.mjs',
    generatedAt: new Date().toISOString(),
    period: { start: minDate, end: maxDate },
    validTransactions,
    duplicateTransactions,
    customers: customers.length,
    methodology: [
      'RFM facts are compact customer-month-outlet-channel aggregates derived from valid unique transactions.',
      'Frequency uses unique TransactionID count. Monetary uses NetAmount after discount. Transactions after active analysis date are excluded in selector.',
      'No browser component reads raw transaction rows; selectors consume customerMonthly aggregate facts and customer master preferences.',
    ],
  },
  dims: {
    customerIds: [...customerIndex.keys()],
    months: months.values,
    outlets,
    genders: genders.values,
    ageBands: ageBands.values,
    occupations: occupations.values,
    customerSegments: customerSegments.values,
    acquisitions: acquisitions.values,
    channels: channels.values,
    products,
    categories: categories.values,
  },
  // [homeOutlet, gender, ageBand, occupation, customerSegment, acquisition, member, clv, avgSatX100, nps, favoriteCategory, favoriteProduct]
  customers,
  // [customer, month, outlet, channel, uniqueTx, net, gross, discount, voucherTx, campaignTx, memberTx, satSumX100, waitSumX10, itemQty, firstDateYmd, lastDateYmd]
  customerMonthly,
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(payload))
console.log(`wrote ${OUT_FILE} ${(fs.statSync(OUT_FILE).size / 1024).toFixed(0)} KB`)
console.log(`  customers              ${customers.length.toLocaleString('en-US')}`)
console.log(`  valid transactions     ${validTransactions.toLocaleString('en-US')}`)
console.log(`  customer-month rows    ${customerMonthly.length.toLocaleString('en-US')}`)
