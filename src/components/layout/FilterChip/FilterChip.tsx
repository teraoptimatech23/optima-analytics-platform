import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import type { FilterOption } from '@/components/layout/FilterBar/FilterBar'
import './FilterChip.less'

/** Radix Select has no concept of "no value", so nulls ride on a sentinel. */
const ALL = '__all__'

interface FilterChipProps {
  icon?: LucideIcon
  label: string
  value: string | null
  placeholder: string
  options: FilterOption[]
  onChange: (value: string | null) => void
}

export default function FilterChip({ icon: Icon, label, value, placeholder, options, onChange }: FilterChipProps) {
  const selected = options.find((option) => option.value === value)
  const display = selected?.short ?? selected?.label ?? placeholder

  return (
    <Select.Root value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? null : next)}>
      <Select.Trigger
        className={clsx('filter-chip', value && 'filter-chip--active')}
        aria-label={`${label}: ${display}`}
      >
        {Icon && <Icon className="filter-chip__icon" size={14} strokeWidth={1.9} />}
        <span className="filter-chip__label">{label}</span>
        <strong className="filter-chip__value">{display}</strong>
        <Select.Icon className="filter-chip__caret">
          <ChevronDown size={14} strokeWidth={2} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="filter-menu" position="popper" sideOffset={8} align="start">
          <Select.Viewport className="filter-menu__viewport">
            {options.map((option) => (
              <Select.Item className="filter-menu__item" key={option.value ?? ALL} value={option.value ?? ALL}>
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="filter-menu__check">
                  <Check size={14} strokeWidth={2.4} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
