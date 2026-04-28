import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useEffect, useState } from 'react'
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { colors, radii, space } from '@wms/theme'
import { formatarDataBr } from '../../utils/dateBr'

type Props = {
  label: string
  value: Date
  onChange: (d: Date) => void
  minimumDate?: Date
  maximumDate?: Date
  /** Quando true, não abre o calendário (só exibe o valor). */
  disabled?: boolean
}

export function DatePickerField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  disabled = false,
}: Props) {
  const [iosOpen, setIosOpen] = useState(false)
  const [iosDraft, setIosDraft] = useState(value)

  useEffect(() => {
    if (iosOpen) {
      setIosDraft(value)
    }
  }, [iosOpen, value])

  const openPicker = () => {
    if (disabled) return
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'dismissed') return
          if (date) onChange(date)
        },
      })
    } else {
      setIosOpen(true)
    }
  }

  const confirmIos = () => {
    onChange(iosDraft)
    setIosOpen(false)
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.press,
          disabled && styles.pressDisabled,
          !disabled && pressed && styles.pressPressed,
        ]}
      >
        <Text style={[styles.value, disabled && styles.valueDisabled]}>{formatarDataBr(value)}</Text>
        <MaterialCommunityIcons
          name="calendar"
          size={20}
          color={disabled ? colors.border : colors.textMuted}
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
  wrap: { marginTop: 0 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 4, marginTop: space.sm },
  press: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
  },
  pressPressed: { opacity: 0.85 },
  pressDisabled: { opacity: 0.55, backgroundColor: colors.background },
  value: { fontSize: 16, color: colors.text },
  valueDisabled: { color: colors.textMuted },
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
