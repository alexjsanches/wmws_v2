import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useCallback, useEffect, useState } from 'react'
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { colors, radii, space } from '@wms/theme'
import { formatarDataBr } from '../../utils/dateBr'

export type SnkDateInputProps = {
  value: Date | undefined
  onChangeValue: (date: Date | undefined) => void
  enabled?: boolean
  placeholder?: string
  minimumDate?: Date
  maximumDate?: Date
  onBlur?: () => void
  style?: StyleProp<ViewStyle>
}

export function SnkDateInput({
  value,
  onChangeValue,
  enabled = true,
  placeholder = 'dd/mm/aaaa',
  minimumDate,
  maximumDate,
  onBlur,
  style,
}: SnkDateInputProps) {
  const [iosOpen, setIosOpen] = useState(false)
  const [iosDraft, setIosDraft] = useState<Date>(() => value ?? new Date())

  useEffect(() => {
    if (iosOpen) {
      setIosDraft(value ?? new Date())
    }
  }, [iosOpen, value])

  const openPicker = useCallback(() => {
    if (!enabled) return
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'dismissed') {
            onBlur?.()
            return
          }
          if (date) onChangeValue(date)
          onBlur?.()
        },
      })
    } else {
      setIosOpen(true)
    }
  }, [enabled, value, minimumDate, maximumDate, onChangeValue, onBlur])

  const confirmIos = useCallback(() => {
    onChangeValue(iosDraft)
    setIosOpen(false)
    onBlur?.()
  }, [iosDraft, onChangeValue, onBlur])

  const handleClear = useCallback(() => {
    onChangeValue(undefined)
  }, [onChangeValue])

  return (
    <View style={[styles.wrap, !enabled && styles.wrapDisabled, style]}>
      <Pressable
        onPress={openPicker}
        style={styles.displayArea}
        disabled={!enabled}
        accessibilityRole="button"
        accessibilityLabel={value ? formatarDataBr(value) : placeholder}
      >
        <Text style={[styles.text, !value && styles.placeholder]} numberOfLines={1}>
          {value ? formatarDataBr(value) : placeholder}
        </Text>
      </Pressable>

      {value && enabled ? (
        <Pressable
          onPress={handleClear}
          hitSlop={8}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Limpar data"
        >
          <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}

      <Pressable
        onPress={openPicker}
        disabled={!enabled}
        style={styles.iconBtn}
        accessibilityRole="button"
        accessibilityLabel="Abrir calendário"
      >
        <MaterialCommunityIcons
          name="calendar"
          size={18}
          color={enabled ? colors.textMuted : colors.border}
        />
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="fade" onRequestClose={() => setIosOpen(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} />
            <View style={styles.sheet}>
              <View style={styles.toolbar}>
                <Pressable onPress={() => setIosOpen(false)} hitSlop={12}>
                  <Text style={styles.toolbarBtn}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={confirmIos} hitSlop={12}>
                  <Text style={[styles.toolbarBtn, styles.toolbarOk]}>OK</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={iosDraft}
                mode="date"
                display="spinner"
                locale="pt-BR"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={(_, d) => {
                  if (d) setIosDraft(d)
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingLeft: space.md,
    minHeight: 44,
  },
  wrapDisabled: { opacity: 0.6 },
  displayArea: { flex: 1, paddingVertical: space.sm, justifyContent: 'center' },
  text: { fontSize: 16, color: colors.text },
  placeholder: { color: colors.textMuted },
  iconBtn: {
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    paddingBottom: space.lg,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  toolbarBtn: { fontSize: 16, color: colors.textMuted },
  toolbarOk: { fontWeight: '700', color: colors.primary },
})
