import { useMemo } from 'react'
import { CalendarDays, MapPin, Store, UserRound, Users2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import FilterChip from '@/components/layout/FilterChip/FilterChip'
import { quarterLabel, quarterOf, quarterShortLabel } from '@/data/cube'
import type { InsightCube } from '@/data/types'
import type { DashboardFilters, FilterKey } from '@/store/useFilterStore'
import './FilterBar.less'

export interface FilterOption {
  value: string | null
  label: string
  /** Shown on the pill when the full label is too long. */
  short?: string
}

interface FilterDefinition {
  key: FilterKey
  label: string
  icon: LucideIcon
  allLabel: string
  options: FilterOption[]
}

interface FilterBarProps {
  values: DashboardFilters
  onChange: (key: FilterKey, value: string | null) => void
  cube: InsightCube | null
}

export default function FilterBar({ values, onChange, cube }: FilterBarProps) {
  /**
   * Options come from the cube's own dimensions, so a filter can never point at
   * a slice that does not exist. Geography narrows as you go: picking a region
   * limits the city list, picking a city limits the outlet list.
   */
  const definitions = useMemo<FilterDefinition[]>(() => {
    if (!cube) return []

    const quarters = [...new Set(cube.dims.months.map(quarterOf))].sort()
    const regions = [...new Set(cube.dims.outlets.map((outlet) => outlet.region))].sort()
    const outlets = cube.dims.outlets.filter((outlet) =>
      (!values.region || outlet.region === values.region) &&
      (!values.city || outlet.city === values.city))

    const all = (label: string): FilterOption => ({ value: null, label })

    return [
      {
        key: 'quarter',
        label: 'Periode',
        icon: CalendarDays,
        allLabel: 'Semua Periode',
        options: [all('Semua Periode'), ...quarters.map((q) => ({ value: q, label: quarterLabel(q), short: quarterShortLabel(q) }))],
      },
      {
        key: 'region',
        label: 'Wilayah',
        icon: MapPin,
        allLabel: 'Semua Wilayah',
        options: [all('Semua Wilayah'), ...regions.map((r) => ({ value: r, label: r }))],
      },
      {
        key: 'outlet',
        label: 'Outlet',
        icon: Store,
        allLabel: 'Semua Outlet',
        options: [all('Semua Outlet'), ...outlets.map((o) => ({ value: o.id, label: o.name }))],
      },
      {
        key: 'gender',
        label: 'Gender',
        icon: UserRound,
        allLabel: 'Semua Gender',
        options: [
          all('Semua Gender'),
          ...cube.dims.genders.map((g) => ({ value: g, label: g === 'Female' ? 'Perempuan' : 'Laki-laki' })),
        ],
      },
      {
        key: 'ageBand',
        label: 'Usia',
        icon: Users2,
        allLabel: 'Semua Usia',
        options: [all('Semua Usia'), ...cube.dims.ageBands.map((a) => ({ value: a, label: `${a} tahun` }))],
      },
    ]
  }, [cube, values.region, values.city])

  if (!definitions.length) {
    return <div className="filter-bar filter-bar--loading" aria-hidden="true" />
  }

  return (
    <div className="filter-bar" role="group" aria-label="Filter dashboard">
      {definitions.map(({ key, label, icon, allLabel, options }) => (
        <FilterChip
          key={key}
          icon={icon}
          label={label}
          value={values[key]}
          placeholder={allLabel}
          options={options}
          onChange={(value) => onChange(key, value)}
        />
      ))}
    </div>
  )
}
