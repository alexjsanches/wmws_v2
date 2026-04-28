import { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import { space } from '@wms/theme'
import { SnkDateInput } from './SnkDateInput'
import { SnkTimeInput } from './SnkTimeInput'

export type SnkDateTimeInputProps = {
  value: Date | undefined
  onChangeValue: (date: Date | undefined) => void
  enabled?: boolean
  showDate?: boolean
  onBlur?: () => void
}

export function SnkDateTimeInput({
  value,
  onChangeValue,
  enabled = true,
  showDate = true,
  onBlur,
}: SnkDateTimeInputProps) {
  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        onChangeValue(undefined)
        return
      }
      const base = value ? new Date(value) : new Date()
      const next = new Date(date)
      next.setHours(base.getHours(), base.getMinutes(), 0, 0)
      onChangeValue(next)
    },
    [value, onChangeValue],
  )

  const handleTimeChange = useCallback(
    (hours: number, minutes: number) => {
      const base = value ? new Date(value) : new Date()
      const next = new Date(base)
      next.setHours(hours, minutes, 0, 0)
      onChangeValue(next)
    },
    [value, onChangeValue],
  )

  return (
    <View style={styles.row}>
      {showDate ? (
        <View style={styles.dateWrap}>
          <SnkDateInput
            value={value}
            onChangeValue={handleDateChange}
            enabled={enabled}
            onBlur={onBlur}
            style={styles.flex}
          />
        </View>
      ) : null}

      <View style={[styles.timeWrap, !showDate && styles.timeWrapFull]}>
        <SnkTimeInput
          hours={value?.getHours()}
          minutes={value?.getMinutes()}
          onChangeValue={handleTimeChange}
          enabled={enabled}
          onBlur={onBlur}
          style={styles.flex}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'stretch' },
  dateWrap: { flex: 1.4, minWidth: 0 },
  timeWrap: { flex: 1, minWidth: 0 },
  timeWrapFull: { flex: 1 },
  flex: { flex: 1 },
})
