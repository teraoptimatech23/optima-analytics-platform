import fs from 'node:fs'
import path from 'node:path'

const file = path.join('src', 'data', 'insights.json')
const cube = JSON.parse(fs.readFileSync(file, 'utf8'))

const YT = {
  month: 0,
  campaign: 1,
  location: 2,
  ageRange: 3,
  gender: 4,
  spend: 5,
  impressions: 6,
  views: 7,
  watchTimeSeconds: 8,
  completedViews: 9,
  clicks: 10,
  conversions: 11,
}

const M = { month: 0, campaign: 1, spend: 2, impressions: 3, clicks: 4, conversions: 5, views: 8 }

const errors = []
const assert = (condition, message) => {
  if (!condition) errors.push(message)
}

const finite = (value) => Number.isFinite(value)
const youtubeCampaigns = new Set(cube.dims.campaigns.map((campaign, index) => campaign.platform === 'YouTube Ads' ? index : -1).filter((index) => index >= 0))
const keys = new Set()
const summary = { spend: 0, impressions: 0, views: 0, watchTimeSeconds: 0, completedViews: 0, clicks: 0, conversions: 0 }

assert(Array.isArray(cube.youtubeAds), 'cube.youtubeAds is missing')
assert(cube.youtubeAds.length > 0, 'cube.youtubeAds has no rows')
assert(Array.isArray(cube.dims.youtubeLocations), 'dims.youtubeLocations is missing')
assert(Array.isArray(cube.dims.youtubeAgeRanges), 'dims.youtubeAgeRanges is missing')
assert(Array.isArray(cube.dims.youtubeGenders), 'dims.youtubeGenders is missing')

for (const [index, row] of cube.youtubeAds.entries()) {
  assert(row.length === 12, `row ${index} must have 12 columns`)
  const key = `${row[YT.month]}|${row[YT.campaign]}|${row[YT.location]}|${row[YT.ageRange]}|${row[YT.gender]}`
  assert(!keys.has(key), `duplicate youtube grain row: ${key}`)
  keys.add(key)
  assert(youtubeCampaigns.has(row[YT.campaign]), `row ${index} campaign is not YouTube Ads`)
  assert(cube.dims.months[row[YT.month]], `row ${index} has invalid month id`)
  assert(cube.dims.youtubeLocations[row[YT.location]], `row ${index} has invalid location id`)
  assert(cube.dims.youtubeAgeRanges[row[YT.ageRange]], `row ${index} has invalid age range id`)
  assert(cube.dims.youtubeGenders[row[YT.gender]], `row ${index} has invalid gender id`)

  for (const column of [YT.spend, YT.impressions, YT.views, YT.watchTimeSeconds, YT.completedViews, YT.clicks, YT.conversions]) {
    assert(finite(row[column]), `row ${index} column ${column} is not finite`)
    assert(row[column] >= 0, `row ${index} column ${column} is negative`)
  }

  assert(row[YT.views] <= row[YT.impressions], `row ${index} has views greater than impressions`)
  assert(row[YT.completedViews] <= row[YT.views], `row ${index} has completed views greater than views`)
  assert(row[YT.clicks] <= row[YT.impressions], `row ${index} has clicks greater than impressions`)

  summary.spend += row[YT.spend]
  summary.impressions += row[YT.impressions]
  summary.views += row[YT.views]
  summary.watchTimeSeconds += row[YT.watchTimeSeconds]
  summary.completedViews += row[YT.completedViews]
  summary.clicks += row[YT.clicks]
  summary.conversions += row[YT.conversions]
}

const mediaSummary = { spend: 0, impressions: 0, views: 0, clicks: 0, conversions: 0 }
for (const row of cube.media) {
  if (!youtubeCampaigns.has(row[M.campaign])) continue
  mediaSummary.spend += row[M.spend]
  mediaSummary.impressions += row[M.impressions]
  mediaSummary.views += row[M.views]
  mediaSummary.clicks += row[M.clicks]
  mediaSummary.conversions += row[M.conversions]
}

const within = (left, right, tolerance = 2) => Math.abs(left - right) <= tolerance
assert(within(summary.spend, mediaSummary.spend), 'youtube spend summary differs from media aggregate')
assert(within(summary.impressions, mediaSummary.impressions), 'youtube impressions summary differs from media aggregate')
assert(within(summary.views, mediaSummary.views), 'youtube views summary differs from media aggregate')
assert(within(summary.clicks, mediaSummary.clicks), 'youtube clicks summary differs from media aggregate')
assert(within(summary.conversions, mediaSummary.conversions), 'youtube conversions summary differs from media aggregate')

const viewRate = summary.impressions ? summary.views / summary.impressions : 0
const completionRate = summary.views ? summary.completedViews / summary.views : 0
const ctr = summary.impressions ? summary.clicks / summary.impressions : 0
const conversionRate = summary.clicks ? summary.conversions / summary.clicks : 0
for (const [label, value] of Object.entries({ viewRate, completionRate, ctr, conversionRate })) {
  assert(finite(value), `${label} is not finite`)
  assert(value >= 0 && value <= 1, `${label} outside 0..1`)
}

if (errors.length) {
  console.error(`YouTube Ads validation failed with ${errors.length} issue(s):`)
  for (const error of errors.slice(0, 40)) console.error(`- ${error}`)
  if (errors.length > 40) console.error(`... ${errors.length - 40} more`)
  process.exit(1)
}

console.log('YouTube Ads validation passed')
console.log(`  rows: ${cube.youtubeAds.length.toLocaleString('id-ID')}`)
console.log(`  campaigns: ${youtubeCampaigns.size.toLocaleString('id-ID')}`)
console.log(`  views: ${summary.views.toLocaleString('id-ID')}`)
console.log(`  view rate: ${(viewRate * 100).toFixed(2)}%`)
console.log(`  completion rate: ${(completionRate * 100).toFixed(2)}%`)
