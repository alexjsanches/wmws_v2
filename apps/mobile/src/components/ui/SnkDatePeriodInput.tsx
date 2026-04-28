import { StyleSheet, Text, View } from 'react-native'
import { colors, space } from '@wms/theme'
import { inicioDoDia } from '../../utils/dateBr'
import { SnkDateInput } from './SnkDateInput'

export type DatePeriod = {
  dtIni: Date | undefined
  dtFin: Date | undefined
}

export type SnkDatePeriodInputProps = {
  value: DatePeriod
  onChangeValue: (period: DatePeriod) => void
  enabled?: boolean
}

export function SnkDatePeriodInput({ value, onChangeValue, enabled = true }: SnkDatePeriodInputProps) {
  return (
    <View style={styles.row}>
      <View style={styles.dateWrap}>
        <SnkDateInput
          value={value.dtIni}
          onChangeValue={(d) => onChangeValue({ ...value, dtIni: d })}
          enabled={enabled}
          placeholder="Início"
          maximumDate={value.dtFin ? inicioDoDia(value.dtFin) : undefined}
        />
      </View>

      <Text style={styles.sep}>a</Text>

      <View style={styles.dateWrap}>
        <SnkDateInput
          value={value.dtFin}
          onChangeValue={(d) => {
            if (!d) {
              onChangeValue({ ...value, dtFin: undefined })
              return
            }
            const end = new Date(d)
            end.setHours(23, 59, 0, 0)
            onChangeValue({ ...value, dtFin: end })
          }}
          enabled={enabled}
          placeholder="Fim"
          minimumDate={value.dtIni ? inicioDoDia(value.dtIni) : undefined}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dateWrap: { flex: 1, minWidth: 0 },
  sep: { fontSize: 14, color: colors.textMuted, paddingHorizontal: 2 },
})
