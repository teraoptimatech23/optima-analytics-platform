import fs from 'node:fs'
import path from 'node:path'

const IN_FILE = path.join('src', 'data', 'insights.json')
const OUT_FILE = path.join('public', 'assets', 'cohortAnalysis.json')

const CJ = {
  outlet: 0,
  gender: 1,
  age: 2,
  segment: 3,
  member: 4,
  acquisition: 5,
  signupDay: 6,
  cohortYm: 7,
  memberSinceDay: 8,
  visits: 9,
  netSpend: 10,
  clv: 11,
  recency: 12,
  avgSat: 13,
  nps: 14,
  firstPurchaseDay: 15,
  secondPurchaseDay: 16,
  lastPurchaseDay: 17,
  totalTx: 18,
  voucherTx: 19,
  memberTx: 20,
  activeMonths: 21,
}

const CJM = {
  customer: 0,
  outlet: 1,
  gender: 2,
  age: 3,
  segment: 4,
  month: 5,
  channel: 6,
  tx: 7,
  net: 8,
  voucherTx: 9,
  memberTx: 10,
  campaignTx: 11,
  satSum: 12,
}

const cube = JSON.parse(fs.readFileSync(IN_FILE, 'utf8'))
const dayMs = 86400000
const dayNumber = (value) => Math.floor(Date.parse(`${value}T00:00:00Z`) / dayMs)

function dayToMonthIndex(day) {
  if (day < 0) return -1
  const target = day * dayMs
  return cube.dims.months.findIndex((month, index) => {
    const [year, monthNo] = month.split('-').map(Number)
    const start = Date.UTC(year, monthNo - 1, 1)
    const nextMonth = index === cube.dims.months.length - 1
      ? Date.UTC(year, monthNo, 1)
      : Date.parse(`${cube.dims.months[index + 1]}-01T00:00:00Z`)
    return target >= start && target < nextMonth
  })
}

function cohortYmToMonthIndex(value) {
  const raw = String(value)
  if (raw.length !== 6) return -1
  const key = `${raw.slice(0, 4)}-${raw.slice(4, 6)}`
  return cube.dims.months.indexOf(key)
}

const activityByCustomer = new Map()
for (const row of cube.customerJourneyMonthly) {
  if ((row[CJM.tx] ?? 0) <= 0) continue
  const list = activityByCustomer.get(row[CJM.customer]) ?? []
  list.push(row)
  activityByCustomer.set(row[CJM.customer], list)
}

const customers = []
const activities = []

cube.customerJourney.forEach((row, customerIndex) => {
  const activityRows = activityByCustomer.get(customerIndex) ?? []
  if (!activityRows.length || row[CJ.firstPurchaseDay] < 0) return
  activityRows.sort((a, b) => a[CJM.month] - b[CJM.month] || b[CJM.tx] - a[CJM.tx])
  const firstMonth = activityRows[0][CJM.month]
  const firstMonthRows = activityRows.filter((activity) => activity[CJM.month] === firstMonth)
  const firstChannelRow = [...firstMonthRows].sort((a, b) => b[CJM.tx] - a[CJM.tx] || b[CJM.net] - a[CJM.net])[0]
  const acquisitionMonth = cohortYmToMonthIndex(row[CJ.cohortYm])
  const membershipMonth = row[CJ.memberSinceDay] >= 0 ? dayToMonthIndex(row[CJ.memberSinceDay]) : -1
  const firstCampaignMonth = activityRows.find((activity) => activity[CJM.campaignTx] > 0)?.[CJM.month] ?? -1
  const lastMonth = activityRows.at(-1)?.[CJM.month] ?? firstMonth
  const firstRevenue = firstMonthRows.reduce((sum, activity) => sum + activity[CJM.net], 0)
  const firstTransactions = firstMonthRows.reduce((sum, activity) => sum + activity[CJM.tx], 0)

  customers.push([
    customerIndex,
    row[CJ.outlet],
    row[CJ.gender],
    row[CJ.age],
    row[CJ.segment],
    row[CJ.member],
    row[CJ.acquisition],
    firstMonth,
    acquisitionMonth,
    membershipMonth,
    firstCampaignMonth,
    row[CJ.firstPurchaseDay],
    row[CJ.secondPurchaseDay],
    row[CJ.lastPurchaseDay],
    row[CJ.totalTx],
    row[CJ.netSpend],
    row[CJ.clv],
    firstChannelRow?.[CJM.channel] ?? -1,
    firstMonthRows.some((activity) => activity[CJM.voucherTx] > 0) ? 1 : 0,
    firstMonthRows.some((activity) => activity[CJM.campaignTx] > 0) ? 1 : 0,
    firstTransactions,
    Math.round(firstRevenue),
    lastMonth,
  ])

  for (const activity of activityRows) {
    activities.push([
      customerIndex,
      activity[CJM.month],
      activity[CJM.outlet],
      activity[CJM.channel],
      activity[CJM.tx],
      Math.round(activity[CJM.net]),
      activity[CJM.voucherTx],
      activity[CJM.memberTx],
      activity[CJM.campaignTx],
      Math.round(activity[CJM.satSum]),
    ])
  }
})

const payload = {
  meta: {
    source: 'scripts/build-cohort-analysis.mjs',
    input: IN_FILE,
    generatedAt: new Date().toISOString(),
    period: cube.meta.period,
    analysisCutoff: cube.meta.period.end,
    analysisCutoffDay: dayNumber(cube.meta.period.end),
    analysisCutoffMonth: dayToMonthIndex(dayNumber(cube.meta.period.end)),
    customers: customers.length,
    activityRows: activities.length,
  },
  dims: {
    months: cube.dims.months,
    outlets: cube.dims.outlets,
    genders: cube.dims.genders,
    ageBands: cube.dims.ageBands,
    segments: cube.dims.segments,
    channels: cube.dims.channels,
    acquisitions: cube.dims.acquisitions,
  },
  // [customer, outlet, gender, age, segment, memberAtEntryProxy, acquisition, firstPurchaseMonth, acquisitionMonth, membershipJoinMonth, firstCampaignMonth, firstPurchaseDay, secondPurchaseDay, lastPurchaseDay, totalTx, netSpend, clv, firstChannel, voucherAtEntry, campaignAtEntry, firstMonthTx, firstMonthRevenue, lastActiveMonth]
  customers,
  // [customer, month, outlet, channel, tx, net, voucherTx, memberTx, campaignTx, satSumX100]
  activities,
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(payload))
console.log(`wrote ${OUT_FILE} ${(fs.statSync(OUT_FILE).size / 1024).toFixed(0)} KB`)
console.log(`  customers    ${customers.length.toLocaleString('en-US')}`)
console.log(`  activities   ${activities.length.toLocaleString('en-US')}`)
