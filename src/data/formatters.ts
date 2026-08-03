export const formatNumber = (value: number) => Math.round(value).toLocaleString('id-ID')

export const formatCurrency = (value: number) => `Rp${Math.round(value).toLocaleString('id-ID')}`

export const formatPercent = (value: number, digits = 1) =>
  `${(value * 100).toFixed(digits).replace('.', ',')}%`

export const formatFrequency = (value: number) => `${value.toFixed(2).replace('.', ',')}x`

export const formatDays = (value: number) => `${Math.round(value).toLocaleString('id-ID')} hari`

export const formatScore = (value: number, digits = 2) => value.toFixed(digits).replace('.', ',')

export const formatSignedScore = (value: number, digits = 2) =>
  `${value > 0 ? '+' : ''}${formatScore(value, digits)}`

export const formatPriority = (value: number) => `${Math.round(value).toLocaleString('id-ID')}/100`

export const formatClv = (value: number) => {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(2).replace('.', ',')} jt`
  if (value >= 1_000) return `Rp${Math.round(value / 1_000).toLocaleString('id-ID')} rb`
  return formatCurrency(value)
}

export const formatCompactNumber = (value: number, digits = 1) =>
  new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: digits }).format(value)

export const formatCompactCurrency = (value: number, digits = 1) =>
  `Rp${new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: digits }).format(value)}`

export const formatRoas = (value: number) => `${value.toFixed(2).replace('.', ',')}x`

export const formatSignedPercent = (value: number, digits = 1) =>
  `${value > 0 ? '+' : ''}${(value * 100).toFixed(digits).replace('.', ',')}%`
