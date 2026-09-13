import { CANONICAL_CURRENCY, CANONICAL_TIMEZONE } from './types'
import type { DataSourceId, SyntheticSourceRecord, ValidationIssue, ValidationResult } from './types'

const nonNegativeFields = ['impressions', 'reach', 'clicks', 'spend', 'conversions', 'revenue', 'grossRevenue', 'discount', 'netRevenue', 'cost', 'quantity', 'interactionValue', 'recency', 'frequency', 'historicalClv', 'predictedClv'] as const

export function validateSyntheticRecords(source: DataSourceId, records: readonly SyntheticSourceRecord[]): ValidationResult {
  const issues: ValidationIssue[] = []
  const rejected = new Set<string>()
  const seen = new Set<string>()

  const issue = (recordId: string, field: string, code: ValidationIssue['code'], message: string, severity: ValidationIssue['severity']) => {
    issues.push({ recordId, field, code, message, severity })
    if (severity === 'error') rejected.add(recordId)
  }

  records.forEach((record) => {
    if (seen.has(record.id)) issue(record.id, 'id', 'duplicate-id', 'Duplicate source record ID.', 'error')
    seen.add(record.id)
    if (!record.occurredAt || Number.isNaN(Date.parse(record.occurredAt))) issue(record.id, 'occurredAt', 'missing-date', 'A valid event date is required.', 'error')
    if (record.timezone && record.timezone !== CANONICAL_TIMEZONE) issue(record.id, 'timezone', 'timezone', `Timezone must be normalized from ${record.timezone} to ${CANONICAL_TIMEZONE} before aggregation.`, 'warning')
    if (record.currency && record.currency !== CANONICAL_CURRENCY) issue(record.id, 'currency', 'currency', 'Currency conversion must be explicit before canonical normalization.', 'error')
    nonNegativeFields.forEach((field) => {
      const value = record[field]
      if (typeof value === 'number' && (!Number.isFinite(value) || value < 0)) issue(record.id, field, 'negative-value', `${field} must be a finite non-negative value.`, 'error')
    })
    if (record.customerId && !record.canonicalCustomerId) issue(record.id, 'customerId', 'customer-mapping', 'Source identity remains unresolved; no synthetic identity stitching was performed.', 'warning')
    if (record.campaignId === '' || record.channel === '') issue(record.id, 'campaignId', 'attribution-mapping', 'Empty attribution keys are not accepted.', 'error')
    if (!source) issue(record.id, 'source', 'source-mapping', 'Source must map to a registered adapter.', 'error')
  })

  const acceptedRecordIds = records.map((record) => record.id).filter((id) => !rejected.has(id))
  return {
    status: rejected.size > 0 ? 'invalid' : issues.length > 0 ? 'valid-with-warnings' : 'valid',
    acceptedRecordIds,
    rejectedRecordIds: [...rejected],
    issues,
  }
}
