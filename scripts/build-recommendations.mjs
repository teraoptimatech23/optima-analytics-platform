import fs from 'node:fs'
import path from 'node:path'

const OUT_FILE = path.join('public', 'assets', 'recommendations.json')
const SCORE_WEIGHTS = { urgency: 0.25, impact: 0.25, affectedShare: 0.2, confidence: 0.15, feasibility: 0.15 }
const CONF_WEIGHTS = { sampleSize: 0.25, sourceReliability: 0.25, evidenceConsistency: 0.2, evidenceCount: 0.15, recency: 0.15 }
const PRIORITY = { critical: 82, high: 64, medium: 42 }
const EFFORT_SCORE = { low: 0.85, medium: 0.55, high: 0.25 }
const OWNER = {
  'customer-retention': 'CRM',
  'customer-experience': 'Customer Experience',
  product: 'Product',
  'pricing-promotion': 'Marketing',
  loyalty: 'Loyalty',
  'marketing-efficiency': 'Performance Marketing',
  'campaign-optimization': 'Performance Marketing',
  'outlet-operations': 'Operations',
  'inventory-demand': 'Inventory Planning',
  'revenue-growth': 'Management',
  'digital-experience': 'Digital Product',
  'measurement-tracking': 'Data Team',
}
const EFFORT = {
  tracking_governance: 'high',
  queue_staffing: 'medium',
  service_recovery: 'medium',
  product_quality: 'medium',
  price_value: 'medium',
  digital_friction: 'high',
  churn_winback: 'medium',
  campaign_scale: 'low',
  campaign_reduce: 'low',
  demand_capacity: 'medium',
  bundle_test: 'low',
  model_foundation: 'high',
}
const CATEGORY_LABELS = {
  'customer-retention': 'Customer Retention',
  'customer-experience': 'Customer Experience',
  product: 'Product',
  'pricing-promotion': 'Pricing & Promotion',
  loyalty: 'Loyalty',
  'marketing-efficiency': 'Marketing Efficiency',
  'campaign-optimization': 'Campaign Optimization',
  'outlet-operations': 'Outlet Operations',
  'inventory-demand': 'Inventory & Demand',
  'revenue-growth': 'Revenue Growth',
  'digital-experience': 'Digital Experience',
  'measurement-tracking': 'Measurement & Tracking',
}
const ROUTES = {
  needs: '/customer-insights/kebutuhan-pelanggan',
  pain: '/customer-insights/pain-points',
  perception: '/customer-insights/persepsi-pelanggan',
  purchase: '/purchase-analytics/perilaku-pembelian',
  rfm: '/purchase-analytics/rfm-analysis',
  basket: '/purchase-analytics/market-basket',
  journey: '/purchase-analytics/customer-journey',
  campaign: '/marketing-analytics/campaign-performance',
  attribution: '/marketing-analytics/attribution',
  churn: '/predictive-analytics/churn-prediction',
  demand: '/predictive-analytics/demand-forecast',
}

const safeDivide = (a, b) => (b ? a / b : 0)
const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v))
const fmtPct = (v) => `${(v * 100).toFixed(1).replace('.', ',')}%`
const fmtScore = (v, digits = 2) => v.toFixed(digits).replace('.', ',')
const fmtCurrency = (v) => `Rp${Math.round(v).toLocaleString('id-ID')}`
const fmtNumber = (v) => Math.round(v).toLocaleString('id-ID')
const quarterOf = (month) => `${month.slice(0, 4)}-Q${Math.ceil(Number(month.slice(5, 7)) / 3)}`
const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

const cube = readJson(path.join('src', 'data', 'insights.json'))
const perception = fs.existsSync(path.join('public', 'assets', 'customerPerception.json')) ? readJson(path.join('public', 'assets', 'customerPerception.json')) : null
const attribution = fs.existsSync(path.join('public', 'assets', 'attribution.json')) ? readJson(path.join('public', 'assets', 'attribution.json')) : null
const churn = fs.existsSync(path.join('public', 'assets', 'churnPrediction.json')) ? readJson(path.join('public', 'assets', 'churnPrediction.json')) : null
const demand = fs.existsSync(path.join('src', 'data', 'demandForecast.json')) ? readJson(path.join('src', 'data', 'demandForecast.json')) : null

function confidence({ sampleSize, sourceReliability = 0.75, consistency = 0.75, evidenceCount = 1, recency = 0.85, modelReliability = 1 }) {
  const sample = clamp(sampleSize / 500)
  const count = clamp(evidenceCount / 4)
  const base = CONF_WEIGHTS.sampleSize * sample +
    CONF_WEIGHTS.sourceReliability * sourceReliability +
    CONF_WEIGHTS.evidenceConsistency * consistency +
    CONF_WEIGHTS.evidenceCount * count +
    CONF_WEIGHTS.recency * recency
  return clamp(base * modelReliability)
}

function score({ urgency, impact, affectedShare, confidenceScore, effort }) {
  const feasibility = EFFORT_SCORE[effort] ?? 0.55
  return Math.round(100 * (
    SCORE_WEIGHTS.urgency * urgency +
    SCORE_WEIGHTS.impact * impact +
    SCORE_WEIGHTS.affectedShare * affectedShare +
    SCORE_WEIGHTS.confidence * confidenceScore +
    SCORE_WEIGHTS.feasibility * feasibility
  ))
}

function priorityFor(item) {
  if (item.criticalOverride && item.confidenceScore >= 0.5) return 'critical'
  if (item.recommendationScore >= PRIORITY.critical && item.confidenceScore >= 0.5) return 'critical'
  if (item.recommendationScore >= PRIORITY.high && item.confidenceScore >= 0.42) return 'high'
  if (item.recommendationScore >= PRIORITY.medium) return 'medium'
  return 'low'
}

function impactLabel(scoreValue) {
  if (scoreValue >= 0.72) return 'high'
  if (scoreValue >= 0.44) return 'medium'
  return 'low'
}

function confidenceLabel(value) {
  if (value >= 0.75) return 'high'
  if (value >= 0.5) return 'medium'
  return 'low'
}

function statusFor(candidate) {
  return candidate.blocker ? 'blocked' : 'new'
}

function makeCandidate(input) {
  const confidenceScore = confidence(input.confidenceInput)
  const recommendationScore = score({ ...input.scoreInput, confidenceScore, effort: input.effort })
  const impact = impactLabel(input.scoreInput.impact)
  const priority = priorityFor({ recommendationScore, confidenceScore, criticalOverride: input.criticalOverride })
  const now = new Date().toISOString()
  return {
    id: input.id,
    dedupeKey: input.dedupeKey,
    actionType: input.actionType,
    conflictGroup: input.conflictGroup ?? '',
    conflictAction: input.conflictAction ?? '',
    category: input.category,
    title: input.title,
    summary: input.summary,
    problemOrOpportunity: input.problemOrOpportunity,
    action: input.action,
    actionSteps: input.actionSteps.map((step, index) => ({ id: `${input.id}-step-${index + 1}`, order: index + 1, label: step.label, description: step.description, owner: step.owner ?? OWNER[input.category] })),
    target: input.target,
    evidence: input.evidence,
    sourceInsightIds: input.sourceInsightIds,
    sourceModules: [...new Set(input.sourceModules)],
    owner: input.owner ?? OWNER[input.category],
    priority,
    impact,
    effort: input.effort,
    urgencyScore: Math.round(input.scoreInput.urgency * 100),
    confidenceScore,
    confidenceLabel: confidenceLabel(confidenceScore),
    recommendationScore,
    estimatedImpact: input.estimatedImpact,
    dependencyIds: input.dependencyIds ?? [],
    blocker: input.blocker,
    riskNote: input.riskNote,
    limitationNote: input.limitationNote,
    route: input.route,
    queryParams: input.queryParams ?? {},
    status: statusFor(input),
    createdForPeriod: input.period,
    createdAt: now,
    updatedAt: now,
    dimensions: input.dimensions,
    scoreFormula: '25% urgency + 25% expected impact + 20% affected share + 15% evidence confidence + 15% feasibility.',
    confidenceFormula: '25% sample size + 25% source reliability + 20% consistency + 15% evidence count + 15% recency; predictive sources apply weakest-link model reliability penalty.',
    impactBasis: input.estimatedImpact?.basis ?? 'Impact level is rule-based from observed severity and affected scope; no numeric uplift estimate is shown without historical/model basis.',
  }
}

function mergeCandidates(candidates) {
  const map = new Map()
  for (const item of candidates) {
    const existing = map.get(item.dedupeKey)
    if (!existing) {
      map.set(item.dedupeKey, { ...item })
      continue
    }
    existing.evidence = [...existing.evidence, ...item.evidence].filter((evidence, index, all) => all.findIndex((row) => row.id === evidence.id) === index)
    existing.sourceModules = [...new Set([...existing.sourceModules, ...item.sourceModules])]
    existing.sourceInsightIds = [...new Set([...existing.sourceInsightIds, ...item.sourceInsightIds])]
    existing.recommendationScore = Math.max(existing.recommendationScore, item.recommendationScore)
    existing.urgencyScore = Math.max(existing.urgencyScore, item.urgencyScore)
    existing.confidenceScore = Math.min(1, Math.max(existing.confidenceScore, item.confidenceScore) + 0.04)
    existing.confidenceLabel = confidenceLabel(existing.confidenceScore)
    existing.priority = priorityFor(existing)
    existing.summary = `${existing.summary} Evidence tambahan: ${item.sourceModules.join(', ')}.`
    existing.actionSteps = [...existing.actionSteps, ...item.actionSteps].filter((step, index, all) => all.findIndex((row) => row.label === step.label) === index).map((step, index) => ({ ...step, order: index + 1 }))
  }
  return [...map.values()].sort(stableSort)
}

function stableSort(a, b) {
  const order = { critical: 0, high: 1, medium: 2, low: 3 }
  return order[a.priority] - order[b.priority] ||
    b.recommendationScore - a.recommendationScore ||
    b.confidenceScore - a.confidenceScore ||
    (EFFORT_SCORE[b.effort] ?? 0) - (EFFORT_SCORE[a.effort] ?? 0) ||
    a.id.localeCompare(b.id)
}

const candidates = []
const risks = []
const totals = {
  transactions: cube.meta.transactions,
  customers: cube.meta.customers,
  revenue: cube.facts.reduce((sum, row) => sum + row[5], 0),
}

function pushRisk(risk) {
  risks.push(risk)
}

function push(input) {
  candidates.push(makeCandidate(input))
}

function outletDims(outletIndex, month = -1, gender = -1, age = -1) {
  const outlet = cube.dims.outlets[outletIndex]
  return {
    month,
    quarter: month >= 0 ? quarterOf(cube.dims.months[month]) : 'all',
    outlet: outletIndex,
    outletId: outlet?.id ?? '',
    city: outlet?.city ?? '',
    region: outlet?.region ?? '',
    gender,
    age,
  }
}

function globalDims(month = -1) {
  return { month, quarter: month >= 0 ? quarterOf(cube.dims.months[month]) : 'all', outlet: -1, outletId: '', city: '', region: '', gender: -1, age: -1 }
}

const F = { month: 0, outlet: 1, gender: 2, age: 3, tx: 4, net: 5, wait: 9, sat: 10 }
const N = { outlet: 0, attribute: 1, n: 2, perf: 3, imp: 4 }
const M = { month: 0, campaign: 1, spend: 2, impressions: 3, clicks: 4, conversions: 5, value: 6 }

const outletAgg = new Map()
for (const row of cube.facts) {
  const key = `${row[F.month]}|${row[F.outlet]}`
  const bucket = outletAgg.get(key) ?? { tx: 0, net: 0, wait: 0, sat: 0 }
  bucket.tx += row[F.tx]
  bucket.net += row[F.net]
  bucket.wait += row[F.wait]
  bucket.sat += row[F.sat]
  outletAgg.set(key, bucket)
}

for (const [key, bucket] of outletAgg.entries()) {
  if (bucket.tx < 180) continue
  const [monthText, outletText] = key.split('|')
  const month = Number(monthText)
  const outlet = Number(outletText)
  const avgWait = safeDivide(bucket.wait, bucket.tx)
  const avgSat = safeDivide(bucket.sat, bucket.tx)
  if (avgWait > 10 && avgSat < 3.75) {
    const outletLabel = cube.dims.outlets[outlet]?.name ?? 'Outlet'
    pushRisk({ id: `risk-service-${month}-${outlet}`, module: 'Pain Points', issueType: 'service_wait', target: outletLabel, reason: 'Waiting time tinggi dan satisfaction rendah.' })
    push({
      id: `rec-service-wait-${month}-${outlet}`,
      dedupeKey: `outlet-operations|queue_staffing|outlet:${outlet}|${month}`,
      actionType: 'queue_staffing',
      category: 'outlet-operations',
      title: `Optimalkan staffing dan queue management di ${outletLabel}`,
      summary: 'Waiting time tinggi berasosiasi dengan satisfaction rendah pada outlet/periode aktif.',
      problemOrOpportunity: 'Risiko pengalaman pelanggan menurun pada outlet dengan antrean panjang.',
      action: 'Review staffing peak hour, aktifkan express pickup/pre-order, dan monitor SLA antrean sebelum memperluas perubahan.',
      actionSteps: [
        { label: 'Audit jam puncak dan kapasitas kasir/barista outlet.' },
        { label: 'Uji penyesuaian roster dan jalur express pickup selama 1-2 minggu.' },
        { label: 'Pantau wait minutes, satisfaction, dan repeat behaviour setelah perubahan.' },
      ],
      target: { entityType: 'outlet', entityId: cube.dims.outlets[outlet]?.id, entityLabel: outletLabel, affectedCount: bucket.tx },
      evidence: [
        { id: `wait-${month}-${outlet}`, label: 'Avg wait minutes', formattedValue: `${fmtScore(avgWait, 1)} min`, rawValue: avgWait, sourceModule: 'Pain Points', sourceMetric: 'WaitMinutes', period: cube.dims.months[month], entityType: 'outlet', entityLabel: outletLabel },
        { id: `sat-${month}-${outlet}`, label: 'Transaction satisfaction', formattedValue: `${fmtScore(avgSat, 2)}/5`, rawValue: avgSat, sourceModule: 'Ringkasan', sourceMetric: 'SatisfactionScore', period: cube.dims.months[month], entityType: 'outlet', entityLabel: outletLabel },
      ],
      sourceInsightIds: [`service-wait-${month}-${outlet}`],
      sourceModules: ['Pain Points', 'Ringkasan'],
      effort: EFFORT.queue_staffing,
      scoreInput: { urgency: clamp((avgWait - 8) / 8), impact: clamp((3.9 - avgSat) / 1.2), affectedShare: clamp(bucket.tx / 5000) },
      confidenceInput: { sampleSize: bucket.tx, sourceReliability: 0.82, consistency: 0.8, evidenceCount: 2 },
      estimatedImpact: { metric: 'Customer experience risk', direction: 'protect', basis: 'Scenario basis from observed wait-minute severity and affected transactions; no causal uplift is claimed.' },
      limitationNote: 'Association between wait time and satisfaction is observational; test operational changes before scale-out.',
      route: ROUTES.pain,
      period: cube.dims.months[month],
      dimensions: outletDims(outlet, month),
    })
  }
}

const attrAction = {
  taste: ['product', 'product_quality', 'Audit product quality and SOP consistency', 'Review recipe execution, product availability, and outlet preparation standards.', ROUTES.perception],
  price: ['pricing-promotion', 'price_value', 'Perjelas value proposition dan struktur promo', 'Review bundle, promo messaging, and perceived value gaps before changing list price.', ROUTES.needs],
  service: ['customer-experience', 'service_recovery', 'Prioritaskan service recovery untuk gap layanan', 'Audit service SOP and queue handoff on the affected outlet/segment.', ROUTES.needs],
  ambience: ['outlet-operations', 'service_recovery', 'Perbaiki outlet ambience pada lokasi gap tinggi', 'Review seating, cleanliness, crowding, and local store condition.', ROUTES.needs],
  app: ['digital-experience', 'digital_friction', 'Audit app friction dan checkout/voucher flow', 'Review app ease, checkout, payment, and voucher redemption path.', ROUTES.perception],
}
for (const row of cube.needs) {
  const n = row[N.n]
  if (n < 100) continue
  const attr = cube.dims.attributes[row[N.attribute]]
  const importance = safeDivide(row[N.imp], n) / 100
  const perceptionScore = safeDivide(row[N.perf], n) / 100
  const gap = importance - perceptionScore
  if (gap <= 0.48) continue
  const actionDef = attrAction[attr] ?? ['customer-experience', 'service_recovery', `Tutup expectation gap ${attr}`, 'Review customer expectation gap with a scoped experiment.', ROUTES.needs]
  const outlet = row[N.outlet]
  const outletLabel = cube.dims.outlets[outlet]?.name ?? 'Outlet'
  pushRisk({ id: `risk-gap-${attr}-${outlet}`, module: 'Kebutuhan Pelanggan', issueType: `gap_${attr}`, target: outletLabel, reason: `Gap ${fmtScore(gap, 2)} pada ${attr}.` })
  push({
    id: `rec-gap-${attr}-${outlet}`,
    dedupeKey: `${actionDef[0]}|${actionDef[1]}|outlet:${outlet}|all`,
    actionType: actionDef[1],
    category: actionDef[0],
    title: actionDef[2],
    summary: `${attr} memiliki expectation gap tinggi di ${outletLabel}.`,
    problemOrOpportunity: 'Importance pelanggan lebih tinggi daripada perception/performance yang terukur.',
    action: actionDef[3],
    actionSteps: [
      { label: 'Validasi atribut gap terhadap survey dan pain point terkait.' },
      { label: 'Buat eksperimen perbaikan terbatas pada target dengan gap tertinggi.' },
      { label: 'Ukur ulang score, NPS, dan repeat rate setelah periode uji.' },
    ],
    target: { entityType: 'outlet', entityId: cube.dims.outlets[outlet]?.id, entityLabel: outletLabel, affectedCount: n },
    evidence: [
      { id: `need-gap-${attr}-${outlet}`, label: `${attr} expectation gap`, formattedValue: `+${fmtScore(gap, 2)}`, rawValue: gap, sourceModule: 'Kebutuhan Pelanggan', sourceMetric: 'importance - performance', entityType: 'outlet', entityLabel: outletLabel },
      { id: `need-imp-${attr}-${outlet}`, label: 'Importance', formattedValue: `${fmtScore(importance, 2)}/5`, rawValue: importance, sourceModule: 'Kebutuhan Pelanggan' },
      { id: `need-perf-${attr}-${outlet}`, label: 'Perception/performance', formattedValue: `${fmtScore(perceptionScore, 2)}/5`, rawValue: perceptionScore, sourceModule: 'Kebutuhan Pelanggan' },
    ],
    sourceInsightIds: [`need-gap-${attr}-${outlet}`],
    sourceModules: ['Kebutuhan Pelanggan'],
    effort: EFFORT[actionDef[1]] ?? 'medium',
    scoreInput: { urgency: clamp(gap / 1.2), impact: clamp(gap / 1.1), affectedShare: clamp(n / 1000) },
    confidenceInput: { sampleSize: n, sourceReliability: 0.84, consistency: 0.72, evidenceCount: 3 },
    estimatedImpact: { metric: 'Perception gap', direction: 'decrease', basis: 'Observed importance-performance gap; impact level is based on gap severity and respondent count.' },
    limitationNote: 'Gap prioritization is not causal impact estimation.',
    route: actionDef[4],
    period: 'all',
    dimensions: outletDims(outlet),
  })
}

if (perception) {
  const dimStart = 16
  const attrStart = 24
  const tail = 50
  const groups = new Map()
  for (const row of perception.customerFacts) {
    const key = `${row[1]}|${row[2]}|${row[3]}|${row[4]}`
    const bucket = groups.get(key) ?? { n: 0, loyalty: 0, digital: 0, negative: 0 }
    bucket.n += 1
    bucket.loyalty += row[dimStart + 7]
    bucket.digital += row[dimStart + 5]
    bucket.negative += row[tail + 4]
    groups.set(key, bucket)
  }
  for (const [key, bucket] of groups.entries()) {
    if (bucket.n < 80) continue
    const [monthText, outletText, genderText, ageText] = key.split('|')
    const month = Number(monthText)
    const outlet = Number(outletText)
    const gender = Number(genderText)
    const age = Number(ageText)
    const loyaltyScore = safeDivide(bucket.loyalty, bucket.n)
    const digitalScore = safeDivide(bucket.digital, bucket.n)
    const negativeRate = safeDivide(bucket.negative, bucket.n)
    const outletLabel = perception.dims.outlets[outlet]?.name ?? 'Outlet'
    if (loyaltyScore < 3.25 && negativeRate > 0.01) {
      push({
        id: `rec-loyalty-${month}-${outlet}-${gender}-${age}`,
        dedupeKey: `loyalty|churn_winback|outlet:${outlet}|${month}`,
        actionType: 'churn_winback',
        category: 'loyalty',
        title: `Perbaiki loyalty value perception di ${outletLabel}`,
        summary: 'Loyalty perception proxy rendah dan negative perception terukur pada scope ini.',
        problemOrOpportunity: 'Member/repeat behaviour belum cukup mendukung persepsi nilai loyalty.',
        action: 'Audit benefit member, redemption clarity, and targeted lifecycle messaging for affected segment.',
        actionSteps: [
          { label: 'Pisahkan cohort member aktif, dormant, dan non-member pada scope target.' },
          { label: 'Uji komunikasi benefit loyalty dengan kontrol holdout sederhana.' },
          { label: 'Pantau redemption, repeat rate, dan perception score periode berikutnya.' },
        ],
        target: { entityType: 'outlet', entityId: perception.dims.outlets[outlet]?.id, entityLabel: outletLabel, affectedCount: bucket.n },
        evidence: [
          { id: `loyalty-score-${key}`, label: 'Loyalty proxy score', formattedValue: `${fmtScore(loyaltyScore, 2)}/5`, rawValue: loyaltyScore, sourceModule: 'Persepsi Pelanggan', sourceMetric: 'loyalty behavioural proxy', period: perception.dims.months[month], entityType: 'outlet', entityLabel: outletLabel },
          { id: `negative-perception-${key}`, label: 'Negative perception rate', formattedValue: fmtPct(negativeRate), rawValue: negativeRate, sourceModule: 'Persepsi Pelanggan' },
        ],
        sourceInsightIds: [`perception-loyalty-${key}`],
        sourceModules: ['Persepsi Pelanggan', 'Perilaku Pembelian'],
        effort: EFFORT.churn_winback,
        scoreInput: { urgency: clamp((3.4 - loyaltyScore) / 1.2), impact: clamp(negativeRate * 6), affectedShare: clamp(bucket.n / 700) },
        confidenceInput: { sampleSize: bucket.n, sourceReliability: 0.62, consistency: 0.66, evidenceCount: 2 },
        estimatedImpact: { metric: 'Retention opportunity', direction: 'protect', basis: 'Behavioural proxy and perception association; no guaranteed uplift.' },
        limitationNote: 'Loyalty dimension is behavioural proxy, not direct opinion.',
        route: ROUTES.perception,
        period: perception.dims.months[month],
        dimensions: {
          month,
          quarter: quarterOf(perception.dims.months[month]),
          outlet,
          outletId: perception.dims.outlets[outlet]?.id,
          city: perception.dims.outlets[outlet]?.city,
          region: perception.dims.outlets[outlet]?.region,
          gender,
          age,
        },
      })
    }
    if (digitalScore < 4.1 && bucket.n >= 120) {
      push({
        id: `rec-digital-${month}-${outlet}-${gender}-${age}`,
        dedupeKey: `digital-experience|digital_friction|outlet:${outlet}|${month}`,
        actionType: 'digital_friction',
        category: 'digital-experience',
        title: `Audit app friction pada pelanggan ${perception.dims.ageBands[age] ?? ''}`,
        summary: 'Digital experience score berada di bawah benchmark internal pada scope pelanggan ini.',
        problemOrOpportunity: 'Friction digital dapat menghambat ordering ease, voucher redemption, dan repeat ordering.',
        action: 'Review checkout, payment, and voucher redemption events; prioritize fixes with observable friction evidence.',
        actionSteps: [
          { label: 'Bandingkan score app dengan ordering dan voucher usage pada scope ini.' },
          { label: 'Audit funnel checkout/voucher tanpa mengirim tindakan otomatis.' },
          { label: 'Jalankan usability review sebelum perubahan besar.' },
        ],
        target: { entityType: 'customer-segment', entityLabel: `${perception.dims.ageBands[age]} · ${outletLabel}`, affectedCount: bucket.n },
        evidence: [
          { id: `digital-score-${key}`, label: 'Digital experience score', formattedValue: `${fmtScore(digitalScore, 2)}/5`, rawValue: digitalScore, sourceModule: 'Persepsi Pelanggan' },
        ],
        sourceInsightIds: [`perception-digital-${key}`],
        sourceModules: ['Persepsi Pelanggan'],
        effort: EFFORT.digital_friction,
        scoreInput: { urgency: clamp((4.2 - digitalScore) / 1.2), impact: clamp((4.2 - digitalScore) / 1), affectedShare: clamp(bucket.n / 1000) },
        confidenceInput: { sampleSize: bucket.n, sourceReliability: 0.78, consistency: 0.7, evidenceCount: 1 },
        blocker: 'Need app event-level friction data before execution planning.',
        estimatedImpact: { metric: 'Digital experience risk', direction: 'protect', basis: 'Structured survey score below benchmark; execution is blocked until event-level friction is available.' },
        limitationNote: 'No app event log is available in the dashboard asset; recommendation is blocked pending measurement.',
        route: ROUTES.perception,
        period: perception.dims.months[month],
        dimensions: {
          month,
          quarter: quarterOf(perception.dims.months[month]),
          outlet,
          outletId: perception.dims.outlets[outlet]?.id,
          city: perception.dims.outlets[outlet]?.city,
          region: perception.dims.outlets[outlet]?.region,
          gender,
          age,
        },
      })
    }
  }
}

if (churn) {
  const P = { outlet: 1, gender: 2, age: 3, segment: 4, acquisition: 5, horizon: 8, score: 9, band: 10, recency: 12, monetary: 15, clv: 24 }
  const rows = churn.predictions['60'] ?? []
  const bySegment = new Map()
  const model = churn.models['60']
  const modelReliability = clamp((model?.selected?.prAuc ?? 0.5) / 0.8)
  for (const row of rows) {
    const riskScore = row[P.score] / 10000
    const band = churn.dims.riskBands[row[P.band]]
    if (riskScore < 0.55 && band !== 'High') continue
    const key = `${row[P.outlet]}|${row[P.gender]}|${row[P.age]}|${row[P.segment]}`
    const bucket = bySegment.get(key) ?? { n: 0, score: 0, clv: 0, monetary: 0 }
    bucket.n += 1
    bucket.score += riskScore
    bucket.clv += row[P.clv] ?? 0
    bucket.monetary += row[P.monetary] ?? 0
    bySegment.set(key, bucket)
  }
  for (const [key, bucket] of bySegment.entries()) {
    if (bucket.n < 40) continue
    const [outletText, genderText, ageText, segmentText] = key.split('|')
    const outlet = Number(outletText)
    const gender = Number(genderText)
    const age = Number(ageText)
    const avgRisk = safeDivide(bucket.score, bucket.n)
    const valueAtRisk = bucket.clv * avgRisk
    const outletLabel = churn.dims.outlets[outlet]?.name ?? 'Outlet'
    push({
      id: `rec-churn-${outlet}-${gender}-${age}-${segmentText}`,
      dedupeKey: `customer-retention|churn_winback|outlet:${outlet}|segment:${segmentText}|all`,
      actionType: 'churn_winback',
      category: 'customer-retention',
      title: `Prioritaskan win-back untuk ${churn.dims.customerSegments[Number(segmentText)] ?? 'customer segment'}`,
      summary: 'Churn score tinggi pada pelanggan dengan value at risk terukur.',
      problemOrOpportunity: 'Ada risiko kehilangan nilai pelanggan dalam horizon prediksi 60 hari.',
      action: 'Bangun CRM win-back berbasis favorite channel/product dan pisahkan holdout untuk membaca arah dampak.',
      actionSteps: [
        { label: 'Buat audience high-risk eligible dengan history cukup.' },
        { label: 'Prioritaskan customer value at risk tertinggi dan hindari blanket discount.' },
        { label: 'Gunakan holdout agar dampak tidak disalahartikan sebagai causality.' },
      ],
      target: { entityType: 'customer-segment', entityLabel: `${churn.dims.customerSegments[Number(segmentText)]} · ${outletLabel}`, affectedCount: bucket.n },
      evidence: [
        { id: `churn-risk-${key}`, label: 'Average churn score', formattedValue: fmtPct(avgRisk), rawValue: avgRisk, sourceModule: 'Churn Prediction', sourceMetric: 'uncalibrated risk score', entityType: 'customer-segment' },
        { id: `value-risk-${key}`, label: 'Scenario value at risk', formattedValue: fmtCurrency(valueAtRisk), rawValue: valueAtRisk, sourceModule: 'Churn Prediction', sourceMetric: 'CLV x risk score' },
      ],
      sourceInsightIds: [`churn-high-risk-${key}`],
      sourceModules: ['Churn Prediction', 'RFM Analysis'],
      effort: EFFORT.churn_winback,
      scoreInput: { urgency: clamp(avgRisk), impact: clamp(valueAtRisk / 500_000_000), affectedShare: clamp(bucket.n / churn.dims.customerIds.length) },
      confidenceInput: { sampleSize: bucket.n, sourceReliability: 0.78, consistency: 0.72, evidenceCount: 2, modelReliability },
      estimatedImpact: { metric: 'Value at risk', direction: 'protect', rangeLow: valueAtRisk * 0.05, rangeHigh: valueAtRisk * 0.15, unit: 'IDR', basis: 'Scenario range = value at risk x conservative recovery range 5%-15%; not a guaranteed uplift.' },
      limitationNote: 'Churn score is decision support and does not claim a customer will certainly churn.',
      route: ROUTES.churn,
      period: churn.meta.predictionReferenceDate,
      dimensions: { month: -1, quarter: 'all', outlet, outletId: churn.dims.outlets[outlet]?.id, city: churn.dims.outlets[outlet]?.city, region: churn.dims.outlets[outlet]?.region, gender, age },
      criticalOverride: valueAtRisk > 250_000_000 && avgRisk > 0.7,
    })
  }
}

if (attribution) {
  const S = { window: 0, conversions: 11, revenue: 12, attributedConversions: 13, attributedRevenue: 14, unattributedConversions: 15 }
  const row7 = attribution.summaryFacts.filter((row) => row[S.window] === 7)
  const totals7 = row7.reduce((acc, row) => {
    acc.conversions += row[S.conversions]
    acc.unattributed += row[S.unattributedConversions]
    acc.revenue += row[S.revenue]
    acc.attributedRevenue += row[S.attributedRevenue]
    return acc
  }, { conversions: 0, unattributed: 0, revenue: 0, attributedRevenue: 0 })
  const unattributedRate = safeDivide(totals7.unattributed, totals7.conversions)
  if (unattributedRate > 0.5) {
    pushRisk({ id: 'risk-attribution-tracking', module: 'Attribution', issueType: 'tracking_gap', target: 'Business', reason: `Unattributed conversion rate ${fmtPct(unattributedRate)}.` })
    push({
      id: 'rec-attribution-tracking-governance',
      dedupeKey: 'measurement-tracking|tracking_governance|business|all',
      actionType: 'tracking_governance',
      category: 'measurement-tracking',
      title: 'Perbaiki attribution tracking dan identity mapping',
      summary: 'Sebagian besar conversion tidak memiliki eligible campaign touchpoint dalam attribution window.',
      problemOrOpportunity: 'Budget allocation berisiko bias bila coverage tracking rendah.',
      action: 'Audit UTM governance, conversion tracking, CampaignID propagation, dan identity mapping sebelum memakai attribution untuk keputusan budget besar.',
      actionSteps: [
        { label: 'Buat checklist UTM dan CampaignID wajib untuk paid channel.' },
        { label: 'Bandingkan conversion platform vs transaction-level CampaignID.' },
        { label: 'Tandai dashboard attribution sebagai decision support sampai coverage membaik.' },
      ],
      target: { entityType: 'business', entityLabel: 'Cross-channel measurement', affectedCount: totals7.conversions },
      evidence: [
        { id: 'attribution-unattributed-rate', label: 'Unattributed conversion rate', formattedValue: fmtPct(unattributedRate), rawValue: unattributedRate, sourceModule: 'Attribution' },
        { id: 'attribution-checked', label: 'Attributed conversions checked', formattedValue: fmtNumber(attribution.meta.validation.checkedConversions), rawValue: attribution.meta.validation.checkedConversions, sourceModule: 'Attribution' },
      ],
      sourceInsightIds: ['attribution-tracking-coverage'],
      sourceModules: ['Attribution', 'Campaign Performance'],
      effort: EFFORT.tracking_governance,
      scoreInput: { urgency: clamp(unattributedRate), impact: clamp(unattributedRate), affectedShare: clamp(totals7.conversions / totals.transactions) },
      confidenceInput: { sampleSize: totals7.conversions, sourceReliability: 0.9, consistency: 0.86, evidenceCount: 2 },
      estimatedImpact: { metric: 'Measurement coverage', direction: 'increase', basis: 'Observed unattributed rate; no revenue uplift is estimated.' },
      limitationNote: 'Attribution is not causal incrementality and should not directly trigger budget changes.',
      route: ROUTES.attribution,
      period: 'all',
      dimensions: globalDims(),
      criticalOverride: unattributedRate > 0.8,
    })
  }
}

const campaignAgg = new Map()
for (const row of cube.media) {
  const campaign = cube.dims.campaigns[row[M.campaign]]
  const bucket = campaignAgg.get(row[M.campaign]) ?? { spend: 0, conversions: 0, value: 0, clicks: 0, impressions: 0, months: new Set(), platform: campaign?.platform ?? 'Unknown', name: campaign?.name ?? 'Campaign' }
  bucket.spend += row[M.spend]
  bucket.conversions += row[M.conversions]
  bucket.value += row[M.value]
  bucket.clicks += row[M.clicks]
  bucket.impressions += row[M.impressions]
  bucket.months.add(row[M.month])
  campaignAgg.set(row[M.campaign], bucket)
}
for (const [campaignIndex, bucket] of campaignAgg.entries()) {
  if (bucket.spend < 60_000_000 || bucket.conversions < 100) continue
  const cpa = safeDivide(bucket.spend, bucket.conversions)
  const roas = safeDivide(bucket.value, bucket.spend)
  const actionScale = roas > 2.5 && cpa < 45_000
  const actionReduce = roas < 1.1 && cpa > 90_000
  if (!actionScale && !actionReduce) continue
  push({
    id: `rec-campaign-${actionScale ? 'scale' : 'reduce'}-${campaignIndex}`,
    dedupeKey: `campaign-optimization|${actionScale ? 'campaign_scale' : 'campaign_reduce'}|campaign:${campaignIndex}|all`,
    actionType: actionScale ? 'campaign_scale' : 'campaign_reduce',
    conflictGroup: `campaign:${campaignIndex}`,
    conflictAction: actionScale ? 'scale_budget' : 'reduce_budget',
    category: 'campaign-optimization',
    title: `${actionScale ? 'Scale bertahap' : 'Audit dan kurangi bertahap'} campaign ${bucket.name}`,
    summary: actionScale ? 'Campaign menunjukkan return tinggi dan CPA relatif rendah.' : 'Campaign memakai spend besar dengan return rendah.',
    problemOrOpportunity: actionScale ? 'Ada opportunity efisiensi marketing, tetapi scaling tetap perlu bertahap.' : 'Ada risiko budget leakage pada campaign underperforming.',
    action: actionScale ? 'Scale budget secara bertahap dengan guardrail CPA/ROAS dan monitoring harian.' : 'Audit targeting, creative, landing flow, lalu kurangi budget bertahap bila tidak membaik.',
    actionSteps: [
      { label: actionScale ? 'Naikkan budget kecil bertahap, bukan perubahan agresif.' : 'Audit creative, audience, keyword, dan placement.' },
      { label: 'Pantau CPA, ROAS, conversion volume, dan spend share.' },
      { label: 'Stop atau rollback bila guardrail memburuk.' },
    ],
    target: { entityType: 'campaign', entityId: cube.dims.campaigns[campaignIndex]?.id, entityLabel: bucket.name, affectedCount: Math.round(bucket.conversions) },
    evidence: [
      { id: `campaign-roas-${campaignIndex}`, label: 'ROAS', formattedValue: `${fmtScore(roas, 2)}x`, rawValue: roas, sourceModule: 'Campaign Performance' },
      { id: `campaign-cpa-${campaignIndex}`, label: 'CPA', formattedValue: fmtCurrency(cpa), rawValue: cpa, sourceModule: 'Campaign Performance' },
      { id: `campaign-spend-${campaignIndex}`, label: 'Spend', formattedValue: fmtCurrency(bucket.spend), rawValue: bucket.spend, sourceModule: bucket.platform },
    ],
    sourceInsightIds: [`campaign-efficiency-${campaignIndex}`],
    sourceModules: ['Campaign Performance', bucket.platform],
    effort: actionScale ? EFFORT.campaign_scale : EFFORT.campaign_reduce,
    scoreInput: { urgency: actionReduce ? clamp(cpa / 140_000) : 0.55, impact: clamp(actionScale ? roas / 4 : cpa / 140_000), affectedShare: clamp(bucket.spend / 1_000_000_000) },
    confidenceInput: { sampleSize: bucket.conversions, sourceReliability: 0.82, consistency: 0.72, evidenceCount: 3 },
    estimatedImpact: { metric: actionScale ? 'Efficient volume opportunity' : 'Budget leakage risk', direction: actionScale ? 'increase' : 'protect', basis: 'Scenario based on historical campaign CPA/ROAS; no causal incrementality is claimed.' },
    limitationNote: 'Platform-reported performance and transaction attribution may not be deduplicated cross-channel.',
    route: ROUTES.campaign,
    period: 'all',
    dimensions: globalDims(),
  })
}

if (demand) {
  const highDemandSeries = demand.series
    .filter((series) => ['outlet', 'category', 'product'].includes(series.level))
    .map((series) => {
      const first14 = series.forecast.slice(0, 14)
      const point = first14.reduce((sum, row) => sum + row[1], 0)
      const upper = first14.reduce((sum, row) => sum + row[4], 0)
      const recent = series.recentComparable || 1
      return { series, point, upper, recent, growth: safeDivide(point - recent, recent) }
    })
    .filter((row) => row.growth > 0.18 && row.series.reliabilityScore >= 50)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 8)
  for (const row of highDemandSeries) {
    const outletIndex = row.series.outletId ? demand.dims.outlets.findIndex((outlet) => outlet.id === row.series.outletId) : -1
    push({
      id: `rec-demand-${slug(row.series.id)}`,
      dedupeKey: `inventory-demand|demand_capacity|${row.series.level}:${row.series.id}|forecast`,
      actionType: 'demand_capacity',
      category: 'inventory-demand',
      title: `Review capacity planning untuk ${row.series.label}`,
      summary: 'Demand forecast naik dibanding recent comparable dengan prediction interval tersedia.',
      problemOrOpportunity: 'Ada risiko service/capacity bila demand berada dekat upper interval.',
      action: 'Gunakan upper interval untuk replenishment/capacity review dan hindari keputusan agresif bila reliability sedang.',
      actionSteps: [
        { label: 'Bandingkan forecast point dan upper interval untuk 14 hari pertama.' },
        { label: 'Review staffing, bahan baku, dan outlet capacity pada target.' },
        { label: 'Gunakan fallback aggregate bila reliability turun.' },
      ],
      target: { entityType: row.series.level === 'outlet' ? 'outlet' : row.series.level === 'product' ? 'product' : 'category', entityId: row.series.outletId ?? row.series.productId ?? row.series.category, entityLabel: row.series.label, affectedCount: Math.round(row.point) },
      evidence: [
        { id: `demand-growth-${row.series.id}`, label: '14d forecast vs recent comparable', formattedValue: fmtPct(row.growth), rawValue: row.growth, sourceModule: 'Demand Forecast' },
        { id: `demand-upper-${row.series.id}`, label: '14d upper interval', formattedValue: fmtNumber(row.upper), rawValue: row.upper, sourceModule: 'Demand Forecast' },
        { id: `demand-reliability-${row.series.id}`, label: 'Forecast reliability', formattedValue: `${row.series.reliabilityScore}/100`, rawValue: row.series.reliabilityScore, sourceModule: 'Demand Forecast' },
      ],
      sourceInsightIds: [`demand-spike-${row.series.id}`],
      sourceModules: ['Demand Forecast'],
      effort: EFFORT.demand_capacity,
      scoreInput: { urgency: clamp(row.growth * 2), impact: clamp(row.upper / 1500), affectedShare: clamp(row.point / 2500) },
      confidenceInput: { sampleSize: row.series.historyDays, sourceReliability: row.series.reliabilityScore / 100, consistency: 0.7, evidenceCount: 3, modelReliability: row.series.reliabilityScore / 100 },
      estimatedImpact: { metric: 'Forecast demand coverage', direction: 'protect', rangeLow: row.point, rangeHigh: row.upper, unit: 'units', basis: 'Forecast point-to-upper interval from temporal backtested demand model.' },
      limitationNote: 'Forecast has about 12 months of history; use intervals and review frequently.',
      route: ROUTES.demand,
      period: demand.meta.historyEnd,
      dimensions: outletIndex >= 0 ? outletDims(outletIndex) : globalDims(),
    })
  }
}

const blockedModules = [
  ['clv-prediction', 'Customer Lifetime Value Prediction model output belum tersedia sebagai production asset.', '/predictive-analytics/customer-lifetime-value-prediction'],
  ['next-best-offer', 'Next Best Offer model output belum tersedia; offer conflict tidak dapat divalidasi.', '/predictive-analytics/next-best-offer'],
  ['sales-forecast', 'Sales Forecast page masih placeholder; revenue forecast belum dapat dijadikan action basis.', '/predictive-analytics/sales-forecast'],
]
for (const [id, blocker, route] of blockedModules) {
  pushRisk({ id: `risk-blocked-${id}`, module: id, issueType: 'missing_model_output', target: 'Business', reason: blocker })
  push({
    id: `rec-blocked-${id}`,
    dedupeKey: `measurement-tracking|model_foundation|${id}|all`,
    actionType: 'model_foundation',
    category: 'measurement-tracking',
    title: `Siapkan fondasi data untuk ${id.replaceAll('-', ' ')}`,
    summary: 'Recommendation belum dapat dieksekusi karena source model/output belum tersedia.',
    problemOrOpportunity: blocker,
    action: 'Definisikan data contract, validator, dan reliability threshold sebelum recommendation berbasis model ini dipakai.',
    actionSteps: [
      { label: 'Definisikan target, fitur, dan horizon atau business metric yang valid.' },
      { label: 'Tambahkan pipeline, validator, dan page output sebelum action recommendation dibuat.' },
    ],
    target: { entityType: 'business', entityLabel: id.replaceAll('-', ' ') },
    evidence: [{ id: `blocked-${id}`, label: 'Missing source output', formattedValue: 'Blocked', sourceModule: 'Recommendation Engine', sourceMetric: 'dependency' }],
    sourceInsightIds: [`blocked-${id}`],
    sourceModules: ['Recommendation Engine'],
    effort: EFFORT.model_foundation,
    scoreInput: { urgency: 0.45, impact: 0.5, affectedShare: 0.7 },
    confidenceInput: { sampleSize: 1, sourceReliability: 0.35, consistency: 0.5, evidenceCount: 1 },
    blocker,
    estimatedImpact: { metric: 'Decision support readiness', direction: 'increase', basis: 'No numeric impact estimate because source model output is unavailable.' },
    limitationNote: 'Blocked recommendations are shown as dependency gaps, not executable actions.',
    route,
    period: 'all',
    dimensions: globalDims(),
  })
}

let recommendations = mergeCandidates(candidates)

function detectConflicts(items) {
  const conflicts = []
  const byGroup = new Map()
  for (const item of items) {
    if (!item.conflictGroup || !item.conflictAction) continue
    const list = byGroup.get(item.conflictGroup) ?? []
    list.push(item)
    byGroup.set(item.conflictGroup, list)
  }
  for (const [group, list] of byGroup.entries()) {
    const scale = list.filter((item) => item.conflictAction.includes('scale') || item.conflictAction.includes('increase'))
    const reduce = list.filter((item) => item.conflictAction.includes('reduce') || item.conflictAction.includes('decrease'))
    if (scale.length && reduce.length) {
      const all = [...scale, ...reduce].sort(stableSort)
      const primary = all[0]
      for (const item of all) item.conflictIds = all.filter((other) => other.id !== item.id).map((other) => other.id)
      conflicts.push({ id: `conflict-${slug(group)}`, entity: group, primaryRecommendationId: primary.id, recommendationIds: all.map((item) => item.id), reason: 'Scale and reduce actions exist for the same target; manual review required.' })
    }
  }
  return conflicts
}

const conflicts = detectConflicts(recommendations)
const recommendationRiskKeys = new Set(recommendations.flatMap((rec) => rec.sourceInsightIds))
const unaddressedRisks = risks
  .filter((risk) => !recommendations.some((rec) => rec.sourceInsightIds.some((id) => id.includes(risk.issueType) || id.includes(risk.id.replace('risk-', '')))))
  .slice(0, 20)
  .map((risk) => ({ ...risk, reasonRecommendationMissing: 'No rule passed evidence threshold or source dependency is blocked.' }))

const dependencies = recommendations
  .filter((rec) => rec.actionType === 'churn_winback')
  .flatMap((rec) => recommendations.filter((other) => other.actionType === 'tracking_governance').map((other) => ({ sourceRecommendationId: rec.id, targetRecommendationId: other.id, relation: 'related' })))

const payload = {
  meta: {
    generatedAt: new Date().toISOString(),
    engineVersion: 'deterministic-decision-support-v1',
    sourceAssets: ['src/data/insights.json', 'public/assets/customerPerception.json', 'public/assets/attribution.json', 'public/assets/churnPrediction.json', 'src/data/demandForecast.json'].filter((file) => fs.existsSync(file)),
    decisionSupportNote: 'Recommendations are data-driven decision support, not automated actions.',
    scoreFormula: '25% urgency + 25% expected impact + 20% affected share + 15% evidence confidence + 15% feasibility.',
    confidenceFormula: '25% sample size + 25% source reliability + 20% consistency + 15% evidence count + 15% recency; predictive reliability applies weakest-link penalty.',
    deduplicationMethod: 'Stable key = category + actionType + target entity + active period; evidence and source modules are merged.',
    conflictMethod: 'Opposing action directions in the same conflict group are flagged and kept visible for manual review.',
    rows: recommendations.length,
    unaddressedRisks: unaddressedRisks.length,
  },
  dims: {
    months: cube.dims.months,
    outlets: cube.dims.outlets,
    genders: cube.dims.genders,
    ageBands: cube.dims.ageBands,
    categories: Object.keys(CATEGORY_LABELS),
    categoryLabels: CATEGORY_LABELS,
    owners: [...new Set(Object.values(OWNER))],
  },
  recommendations,
  conflicts,
  dependencies,
  risks,
  unaddressedRisks,
  coverage: {
    eligibleRisks: risks.length,
    risksWithRecommendation: risks.length - unaddressedRisks.length,
    actionCoverage: safeDivide(risks.length - unaddressedRisks.length, risks.length),
  },
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(payload))

console.log('Recommendations build complete')
console.log(`  candidates        ${candidates.length.toLocaleString('en-US')}`)
console.log(`  recommendations   ${recommendations.length.toLocaleString('en-US')}`)
console.log(`  conflicts         ${conflicts.length.toLocaleString('en-US')}`)
console.log(`  unaddressed risks ${unaddressedRisks.length.toLocaleString('en-US')}`)
console.log(`  output            ${OUT_FILE}`)
