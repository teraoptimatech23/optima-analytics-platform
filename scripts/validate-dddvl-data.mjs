import { build } from 'esbuild'
import { mkdir, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const tempDir = resolve('node_modules/.tmp')
const output = resolve(tempDir, 'dddvl-pipeline-validation.mjs')
await mkdir(tempDir, { recursive: true })
await build({
  entryPoints: [resolve('src/data/sources/pipeline.ts')],
  outfile: output,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  logLevel: 'silent',
})

try {
  const pipeline = await import(pathToFileURL(output).href + '?v=' + Date.now())
  const result = pipeline.runSyntheticValueLoopPipeline()
  const sourceIds = result.canonical.dimensions.dim_source.map((source) => source.sourceId)
  const requiredSources = ['google', 'meta', 'tiktok', 'shopee', 'tokopedia', 'store', 'crm']
  const requiredLoops = ['customer-behavior', 'traffic-acquisition', 'conversion', 'engagement', 'retention', 'analytics', 'profit-optimization']
  const proofSources = ['google', 'meta', 'store', 'crm']
  const allFacts = Object.values(result.canonical.facts).flat()
  const checks = [
    ['all seven adapters normalize', requiredSources.every((source) => sourceIds.includes(source))],
    ['Google, Meta, Store, and CRM flow to canonical metadata', proofSources.every((source) => sourceIds.includes(source))],
    ['no source is mislabeled Connected', result.canonical.dimensions.dim_source.every((source) => source.connectionStatus !== 'Connected')],
    ['canonical currency is IDR', allFacts.every((row) => row.currency === 'IDR')],
    ['canonical timezone is Asia/Jakarta', allFacts.every((row) => row.timezone === 'Asia/Jakarta')],
    ['traffic facts are produced', result.canonical.facts.fact_traffic.length >= 3],
    ['commerce facts are produced', result.canonical.facts.fact_order.length >= 3],
    ['engagement facts are produced', result.canonical.facts.fact_engagement.length >= 5],
    ['retention and customer value facts are produced', result.canonical.facts.fact_retention.length >= 2 && result.canonical.facts.fact_customer_value.length >= 1],
    ['all seven loop aggregates are produced', requiredLoops.every((loop) => result.loopAggregates.some((aggregate) => aggregate.loop === loop))],
  ]

  const invalid = pipeline.validateSyntheticRecords('google', [
    { id: 'bad-1', occurredAt: '', currency: 'USD', spend: -1 },
    { id: 'bad-1', occurredAt: '', currency: 'USD', spend: -1 },
  ])
  checks.push(['invalid rows are tracked rather than silently dropped', invalid.rejectedRecordIds.includes('bad-1') && invalid.issues.some((issue) => issue.code === 'duplicate-id')])

  for (const [name, pass] of checks) console.log((pass ? 'PASS ' : 'FAIL ') + name)
  const failed = checks.filter(([, pass]) => !pass)
  if (failed.length) process.exitCode = 1
  else console.log('\nDD-DVL data flow validated: 7 sources -> canonical model -> 7 loop aggregates (' + result.validationIssues.length + ' non-blocking fixture warnings).')
} finally {
  await rm(output, { force: true })
}
