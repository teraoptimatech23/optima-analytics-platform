import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const IN_DIR = 'data'
const OUT_FILE = path.join('public', 'assets', 'attribution.json')
const WINDOWS = [1, 7, 14, 30]
const MODELS = ['first-touch', 'last-touch', 'linear', 'position-based', 'time-decay']
const POSITION = { first: 0.4, middle: 0.2, last: 0.4 }
const HALF_LIFE_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

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
  for (const char of line) {
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
  const values = []
  const map = new Map()
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

const round = (value, digits = 4) => Math.round(value * 10 ** digits) / 10 ** digits
const safeDivide = (a, b) => (b ? a / b : 0)
const toEpoch = (date, time = '00:00') => new Date(`${date}T${time || '00:00'}:00`).getTime()
const daysBetween = (fromEpoch, toEpochValue) => (toEpochValue - fromEpoch) / DAY_MS

function addBucket(map, key, patch) {
  const bucket = map.get(key) ?? {}
  for (const [field, value] of Object.entries(patch)) bucket[field] = (bucket[field] ?? 0) + value
  map.set(key, bucket)
}

function buildKey(parts) {
  return parts.join('|')
}

function allocate(model, touchpoints, conversionEpoch) {
  const count = touchpoints.length
  if (count === 0) return []
  if (count === 1) return [{ index: 0, credit: 1 }]
  if (model === 'first-touch') return [{ index: 0, credit: 1 }]
  if (model === 'last-touch') return [{ index: count - 1, credit: 1 }]
  if (model === 'linear') return touchpoints.map((_, index) => ({ index, credit: 1 / count }))
  if (model === 'position-based') {
    if (count === 2) return [{ index: 0, credit: 0.5 }, { index: 1, credit: 0.5 }]
    return touchpoints.map((_, index) => {
      if (index === 0) return { index, credit: POSITION.first }
      if (index === count - 1) return { index, credit: POSITION.last }
      return { index, credit: POSITION.middle / (count - 2) }
    })
  }
  const weights = touchpoints.map((touchpoint) => Math.pow(0.5, Math.max(0, daysBetween(touchpoint.epoch, conversionEpoch)) / HALF_LIFE_DAYS))
  const total = weights.reduce((sum, value) => sum + value, 0)
  return weights.map((weight, index) => ({ index, credit: weight / total }))
}

const months = dimension()
const outlets = []
const outletIndex = new Map()
const outletById = new Map()
const genders = dimension(['Female', 'Male'])
const ageBands = dimension(['18-24', '25-35', '36-45', '46+'])
const segments = dimension(['Champion', 'Loyal', 'Potential', 'New', 'At Risk', 'Hibernating'])
const acquisitions = dimension()
const channels = dimension(['Google Ads', 'Meta Ads', 'YouTube Ads', 'Unattributed'])
const campaigns = []
const campaignIndex = new Map()
const pathDim = dimension(['Unattributed'])
const customerMeta = new Map()
const txByCustomer = new Map()
const mediaAgg = new Map()

await readCsv('outlets.csv', (row) => {
  const outlet = { id: row.OutletID, name: row.OutletName, city: row.City, region: row.RegionName, type: row.OutletType }
  outletIndex.set(row.OutletID, outlets.length)
  outletById.set(row.OutletID, outlet)
  outlets.push(outlet)
})

await readCsv('campaigns.csv', (row) => {
  const campaign = {
    id: row.CampaignID,
    name: row.CampaignName,
    platform: row.Platform,
    objective: row.Objective,
    startDate: row.StartDate,
    endDate: row.EndDate,
    monthlyBudget: Number(row.MonthlyBudget) || 0,
  }
  campaignIndex.set(row.CampaignID, campaigns.length)
  campaigns.push(campaign)
  channels.id(row.Platform)
})

await readCsv('customers.csv', (row) => {
  customerMeta.set(row.CustomerID, {
    gender: genders.id(row.Gender),
    ageBand: ageBands.id(row.AgeBand),
    segment: segments.id(row.Segment),
    acquisition: acquisitions.id(row.AcquisitionChannel),
    homeOutlet: outletIndex.get(row.HomeOutletID) ?? 0,
    clv: Number(row.CLV) || 0,
  })
})

function addMedia(row, spendField, impressionsField, clicksField, conversionsField) {
  const campaign = campaignIndex.get(row.CampaignID)
  if (campaign === undefined) return
  const month = months.id(row.Date.slice(0, 7))
  const key = buildKey([month, campaign])
  addBucket(mediaAgg, key, {
    spend: Number(row[spendField]) || 0,
    impressions: Number(row[impressionsField]) || 0,
    clicks: Number(row[clicksField]) || 0,
    platformConversions: Number(row[conversionsField]) || 0,
  })
}

await readCsv('google_ads_performance.csv', (row) => addMedia(row, 'Cost', 'Impressions', 'Clicks', 'Conversions'))
await readCsv('meta_ads_performance.csv', (row) => addMedia(row, 'Spend', 'Impressions', 'Clicks', 'Conversions'))
await readCsv('youtube_ads_performance.csv', (row) => addMedia(row, 'Spend', 'Impressions', 'Clicks', 'Conversions'))

await readCsv('transactions.csv', (row) => {
  const revenue = Number(row.NetAmount) || 0
  if (!row.TransactionID || !row.CustomerID || !row.Date || revenue < 0) return
  const month = months.id(row.Date.slice(0, 7))
  const outlet = outletIndex.get(row.OutletID) ?? 0
  const meta = customerMeta.get(row.CustomerID)
  const campaign = campaignIndex.get(row.CampaignID)
  const tx = {
    id: row.TransactionID,
    customer: row.CustomerID,
    date: row.Date,
    month,
    epoch: toEpoch(row.Date, row.Time),
    outlet,
    gender: meta?.gender ?? genders.id('Unknown'),
    ageBand: meta?.ageBand ?? ageBands.id('Unknown'),
    segment: meta?.segment ?? segments.id('Unknown'),
    acquisition: meta?.acquisition ?? acquisitions.id('Unknown'),
    revenue,
    campaign,
  }
  const rows = txByCustomer.get(tx.customer) ?? []
  rows.push(tx)
  txByCustomer.set(tx.customer, rows)
})

for (const rows of txByCustomer.values()) {
  rows.sort((a, b) => a.epoch - b.epoch || a.id.localeCompare(b.id))
}

const summaryAgg = new Map()
const creditAgg = new Map()
const pathAgg = new Map()
const positionAgg = new Map()
const pairAgg = new Map()
const validation = {
  checkedConversions: 0,
  attributedConversions: 0,
  unattributedConversions: 0,
  multiTouchConversions: 0,
  touchpointAfterConversion: 0,
  touchpointOutsideWindow: 0,
  duplicateConversions: 0,
  creditSumErrors: 0,
  revenueSumErrors: 0,
  nonFiniteCredit: 0,
}

const seenConversions = new Set()

for (const [customerId, rows] of txByCustomer.entries()) {
  const firstTransactionId = rows[0]?.id
  const campaignEvents = rows
    .filter((row) => row.campaign !== undefined)
    .map((row) => ({ ...row, channel: channels.id(campaigns[row.campaign].platform) }))

  for (const conversion of rows) {
    if (seenConversions.has(conversion.id)) validation.duplicateConversions += 1
    seenConversions.add(conversion.id)
    const isNew = conversion.id === firstTransactionId ? 1 : 0

    for (const windowDays of WINDOWS) {
      const eligible = []
      const seenTouchpoints = new Set()
      for (const event of campaignEvents) {
        if (event.epoch > conversion.epoch) {
          validation.touchpointAfterConversion += 1
          continue
        }
        const ageDays = daysBetween(event.epoch, conversion.epoch)
        if (ageDays > windowDays) {
          if (event.epoch <= conversion.epoch) validation.touchpointOutsideWindow += 1
          continue
        }
        const touchpointKey = `${event.id}:${event.campaign}`
        if (seenTouchpoints.has(touchpointKey)) continue
        seenTouchpoints.add(touchpointKey)
        eligible.push({ id: touchpointKey, campaign: event.campaign, channel: event.channel, epoch: event.epoch })
      }

      eligible.sort((a, b) => a.epoch - b.epoch || a.id.localeCompare(b.id))
      const firstChannel = eligible.length ? eligible[0].channel : channels.id('Unattributed')
      const lastChannel = eligible.length ? eligible[eligible.length - 1].channel : channels.id('Unattributed')
      const pathType = eligible.length === 0 ? 0 : eligible.length === 1 ? 1 : 2
      const baseDims = [conversion.month, conversion.outlet, conversion.gender, conversion.ageBand, conversion.segment, conversion.acquisition, isNew, pathType, firstChannel, lastChannel]
      const summaryKey = buildKey([windowDays, ...baseDims])
      addBucket(summaryAgg, summaryKey, {
        conversions: 1,
        revenue: conversion.revenue,
        attributedConversions: eligible.length ? 1 : 0,
        attributedRevenue: eligible.length ? conversion.revenue : 0,
        unattributedConversions: eligible.length ? 0 : 1,
        multiTouchConversions: eligible.length > 1 ? 1 : 0,
        assistedConversions: eligible.length > 1 ? 1 : 0,
        touchpoints: eligible.length,
        timeHours: eligible.length ? daysBetween(eligible[0].epoch, conversion.epoch) * 24 : 0,
        newConversions: isNew,
        attributedNewConversions: eligible.length ? isNew : 0,
      })

      const pathLabel = eligible.length ? eligible.map((event) => campaigns[event.campaign].platform).join(' > ') : 'Unattributed'
      const pathKey = buildKey([windowDays, ...baseDims, pathDim.id(pathLabel)])
      addBucket(pathAgg, pathKey, {
        count: 1,
        revenue: conversion.revenue,
        touchpoints: eligible.length,
        timeHours: eligible.length ? daysBetween(eligible[0].epoch, conversion.epoch) * 24 : 0,
        newConversions: isNew,
      })

      if (eligible.length > 1) {
        for (let i = 0; i < eligible.length - 1; i += 1) {
          const pairKey = buildKey([windowDays, conversion.month, eligible[i].channel, eligible[i + 1].channel])
          addBucket(pairAgg, pairKey, { count: 1, revenue: conversion.revenue, timeHours: daysBetween(eligible[i].epoch, eligible[i + 1].epoch) * 24, newConversions: isNew })
        }
      }

      if (!eligible.length) {
        validation.unattributedConversions += 1
        continue
      }

      validation.checkedConversions += 1
      validation.attributedConversions += 1
      if (eligible.length > 1) validation.multiTouchConversions += 1

      for (const model of MODELS) {
        const allocation = allocate(model, eligible, conversion.epoch)
        const creditSum = allocation.reduce((sum, row) => sum + row.credit, 0)
        const revenueSum = allocation.reduce((sum, row) => sum + row.credit * conversion.revenue, 0)
        if (Math.abs(creditSum - 1) > 0.000001) validation.creditSumErrors += 1
        if (Math.abs(revenueSum - conversion.revenue) > 0.01) validation.revenueSumErrors += 1

        for (const item of allocation) {
          if (!Number.isFinite(item.credit) || item.credit < 0) validation.nonFiniteCredit += 1
          const touchpoint = eligible[item.index]
          const isFirst = item.index === 0 ? 1 : 0
          const isLast = item.index === eligible.length - 1 ? 1 : 0
          const isAssist = eligible.length > 1 && item.index < eligible.length - 1 ? 1 : 0
      const creditKey = buildKey([windowDays, model, ...baseDims, touchpoint.channel, touchpoint.campaign])
          addBucket(creditAgg, creditKey, {
            credit: item.credit,
            revenue: item.credit * conversion.revenue,
            newCredit: item.credit * isNew,
            firstConversions: isFirst,
            lastConversions: isLast,
            assistedConversions: isAssist,
            positionCredit: item.credit * (eligible.length === 1 ? 1 : item.index / (eligible.length - 1)),
            timeHoursCredit: item.credit * daysBetween(touchpoint.epoch, conversion.epoch) * 24,
          })
          const position = isFirst ? 'first' : isLast ? 'last' : 'middle'
          const positionKey = buildKey([windowDays, conversion.month, touchpoint.channel, position])
          addBucket(positionAgg, positionKey, { count: item.credit, revenue: item.credit * conversion.revenue })
        }
      }
    }
  }
}

function rowsFromAgg(map, parser) {
  return [...map.entries()].map(([key, value]) => parser(key.split('|'), value))
}

const summaryFacts = rowsFromAgg(summaryAgg, (parts, value) => [
  Number(parts[0]), Number(parts[1]), Number(parts[2]), Number(parts[3]), Number(parts[4]), Number(parts[5]), Number(parts[6]), Number(parts[7]), Number(parts[8]), Number(parts[9]), Number(parts[10]),
  value.conversions ?? 0,
  Math.round(value.revenue ?? 0),
  value.attributedConversions ?? 0,
  Math.round(value.attributedRevenue ?? 0),
  value.unattributedConversions ?? 0,
  value.multiTouchConversions ?? 0,
  value.assistedConversions ?? 0,
  value.touchpoints ?? 0,
  Math.round(value.timeHours ?? 0),
  value.newConversions ?? 0,
  value.attributedNewConversions ?? 0,
])

const creditFacts = rowsFromAgg(creditAgg, (parts, value) => [
  Number(parts[0]), MODELS.indexOf(parts[1]), Number(parts[2]), Number(parts[3]), Number(parts[4]), Number(parts[5]), Number(parts[6]), Number(parts[7]), Number(parts[8]), Number(parts[9]), Number(parts[10]), Number(parts[11]),
  Number(parts[12]), Number(parts[13]),
  round(value.credit ?? 0, 6),
  Math.round(value.revenue ?? 0),
  round(value.newCredit ?? 0, 6),
  round(value.firstConversions ?? 0, 6),
  round(value.lastConversions ?? 0, 6),
  round(value.assistedConversions ?? 0, 6),
  round(value.positionCredit ?? 0, 6),
  Math.round(value.timeHoursCredit ?? 0),
])

const pathFacts = rowsFromAgg(pathAgg, (parts, value) => [
  Number(parts[0]), Number(parts[1]), Number(parts[2]), Number(parts[3]), Number(parts[4]), Number(parts[5]), Number(parts[6]), Number(parts[7]), Number(parts[8]), Number(parts[9]), Number(parts[10]), Number(parts[11]),
  value.count ?? 0,
  Math.round(value.revenue ?? 0),
  value.touchpoints ?? 0,
  Math.round(value.timeHours ?? 0),
  value.newConversions ?? 0,
])

const positionFacts = rowsFromAgg(positionAgg, (parts, value) => [
  Number(parts[0]), Number(parts[1]), Number(parts[2]), ['first', 'middle', 'last'].indexOf(parts[3]),
  round(value.count ?? 0, 6),
  Math.round(value.revenue ?? 0),
])

const pairFacts = rowsFromAgg(pairAgg, (parts, value) => [
  Number(parts[0]), Number(parts[1]), Number(parts[2]), Number(parts[3]),
  value.count ?? 0,
  Math.round(value.revenue ?? 0),
  Math.round(value.timeHours ?? 0),
  value.newConversions ?? 0,
])

const mediaFacts = rowsFromAgg(mediaAgg, (parts, value) => [
  Number(parts[0]), Number(parts[1]),
  Math.round(value.spend ?? 0),
  Math.round(value.impressions ?? 0),
  Math.round(value.clicks ?? 0),
  Math.round(value.platformConversions ?? 0),
])

const period = {
  start: months.values[0],
  end: months.values[months.values.length - 1],
}

const payload = {
  meta: {
    generatedAt: new Date().toISOString(),
    modelFamily: 'transparent-rule-based-attribution',
    defaultModel: 'position-based',
    defaultWindow: 7,
    attributionWindows: WINDOWS,
    attributionModels: MODELS,
    positionWeights: POSITION,
    timeDecayHalfLifeDays: HALF_LIFE_DAYS,
    conversionDefinition: 'Valid transaction rows keyed by TransactionID with NetAmount as conversion revenue.',
    touchpointDefinition: 'Campaign-attributed transactions for the same CustomerID where CampaignID is present, timestamp is before or equal to the conversion timestamp, and timestamp falls inside the selected attribution window.',
    limitation: 'Dataset does not include anonymous/session-level marketing touchpoints. Unmatched conversions remain unattributed; this rule-based attribution is not causal incrementality.',
    period,
    validation,
    rowSchemas: {
      summaryFacts: ['window', 'month', 'outlet', 'gender', 'ageBand', 'segment', 'acquisition', 'customerType', 'pathType', 'firstTouch', 'lastTouch', 'conversions', 'revenue', 'attributedConversions', 'attributedRevenue', 'unattributedConversions', 'multiTouchConversions', 'assistedConversions', 'touchpoints', 'timeHours', 'newConversions', 'attributedNewConversions'],
      creditFacts: ['window', 'model', 'month', 'outlet', 'gender', 'ageBand', 'segment', 'acquisition', 'customerType', 'pathType', 'firstTouch', 'lastTouch', 'channel', 'campaign', 'credit', 'revenue', 'newCredit', 'firstConversions', 'lastConversions', 'assistedConversions', 'positionCredit', 'timeHoursCredit'],
      pathFacts: ['window', 'month', 'outlet', 'gender', 'ageBand', 'segment', 'acquisition', 'customerType', 'pathType', 'firstTouch', 'lastTouch', 'path', 'count', 'revenue', 'touchpoints', 'timeHours', 'newConversions'],
      positionFacts: ['window', 'month', 'channel', 'position', 'credit', 'revenue'],
      pairFacts: ['window', 'month', 'sourceChannel', 'targetChannel', 'count', 'revenue', 'timeHours', 'newConversions'],
      mediaFacts: ['month', 'campaign', 'spend', 'impressions', 'clicks', 'platformConversions'],
    },
  },
  dims: {
    months: months.values,
    outlets,
    genders: genders.values,
    ageBands: ageBands.values,
    segments: segments.values,
    acquisitions: acquisitions.values,
    channels: channels.values,
    campaigns,
    paths: pathDim.values,
    models: MODELS,
    positions: ['first', 'middle', 'last'],
  },
  summaryFacts,
  creditFacts,
  pathFacts,
  positionFacts,
  pairFacts,
  mediaFacts,
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(payload))

console.log('Attribution build complete')
console.log(`  conversions checked       ${validation.checkedConversions.toLocaleString('en-US')}`)
console.log(`  unattributed conversions  ${validation.unattributedConversions.toLocaleString('en-US')}`)
console.log(`  credit rows               ${creditFacts.length.toLocaleString('en-US')}`)
console.log(`  output                    ${OUT_FILE}`)
