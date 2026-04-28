import { useCallback } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, space } from '@wms/theme'
import { SnkCheckbox, type SnkCheckboxValue } from './SnkCheckbox'

export type SnkCheckboxOption = {
  data: string | number
  value: string
}

export type SnkCheckboxListProps = {
  label?: string
  options: SnkCheckboxOption[]
  selected: Array<string | number>
  onChangeSelected: (selected: Array<string | number>) => void
  singleSelection?: boolean
  enabled?: boolean
  /**
   * `true` = lista sem `ScrollView` interno — evita scroll aninhado quando o pai já é `ScrollView`.
   */
  embedded?: boolean
}

export function SnkCheckboxList({
  label,
  options,
  selected,
  onChangeSelected,
  singleSelection = false,
  enabled = true,
  embedded = false,
}: SnkCheckboxListProps) {
  const allChecked = options.length > 0 && selected.length === options.length
  const someChecked = selected.length > 0 && selected.length < options.length
  const headerValue: SnkCheckboxValue = allChecked ? true : someChecked ? 'I' : false

  const toggleAll = useCallback(() => {
    if (allChecked || someChecked) {
      onChangeSelected([])
    } else {
      onChangeSelected(options.map((o) => o.data))
    }
  }, [allChecked, someChecked, options, onChangeSelected])

  const toggleItem = useCallback(
    (data: string | number) => {
      if (singleSelection) {
        onChangeSelected(selected.includes(data) ? [] : [data])
        return
      }
      if (selected.includes(data)) {
        onChangeSelected(selected.filter((s) => s !== data))
      } else {
        onChangeSelected([...selected, data])
      }
    },
    [selected, singleSelection, onChangeSelected],
  )

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.groupLabel}>{label}</Text> : null}

      {!singleSelection ? (
        <SnkCheckbox
          value={headerValue}
          onChangeValue={() => toggleAll()}
          label="Todos"
          enabled={enabled}
          acceptIndeterminate
        />
      ) : null}

      {!singleSelection ? <View style={styles.divider} /> : null}

      {embedded ? (
        <View style={styles.listEmbedded}>
          {options.map((opt) => (
            <SnkCheckbox
              key={String(opt.data)}
              value={selected.includes(opt.data)}
              onChangeValue={() => toggleItem(opt.data)}
              label={opt.value}
              enabled={enabled}
            />
          ))}
        </View>
      ) : (
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {options.map((opt) => (
            <SnkCheckbox
              key={String(opt.data)}
              value={selected.includes(opt.data)}
              onChangeValue={() => toggleItem(opt.data)}
              label={opt.value}
              enabled={enabled}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  list: { maxHeight: 300 },
  listEmbedded: { gap: 2 },
})
