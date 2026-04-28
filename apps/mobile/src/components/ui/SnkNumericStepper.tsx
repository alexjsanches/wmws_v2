import { useCallback } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radii, space } from '@wms/theme'
import { SnkNumberInput } from './SnkNumberInput'

export type SnkNumericStepperProps = {
  value: string
  onChangeValue: (value: string) => void
  enabled?: boolean
  minValue?: number
  maxValue?: number
  step?: number
}

export function SnkNumericStepper({
  value,
  onChangeValue,
  enabled = true,
  minValue,
  maxValue,
  step = 1,
}: SnkNumericStepperProps) {
  const numeric = parseFloat(String(value).replace(',', '.')) || 0

  const clamp = useCallback(
    (val: number): number => {
      let v = val
      if (minValue !== undefined && v < minValue) v = minValue
      if (maxValue !== undefined && v > maxValue) v = maxValue
      return v
    },
    [minValue, maxValue],
  )

  const dec = useCallback(() => {
    if (!enabled) return
    onChangeValue(String(clamp(numeric - step)))
  }, [enabled, numeric, step, clamp, onChangeValue])

  const inc = useCallback(() => {
    if (!enabled) return
    onChangeValue(String(clamp(numeric + step)))
  }, [enabled, numeric, step, clamp, onChangeValue])

  const atMin = minValue !== undefined && numeric <= minValue
  const atMax = maxValue !== undefined && numeric >= maxValue

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Diminuir"
        onPress={dec}
        disabled={!enabled || atMin}
        style={({ pressed }) => [
          styles.btn,
          (!enabled || atMin) && styles.btnDisabled,
          pressed && enabled && !atMin && styles.btnPressed,
        ]}
      >
        <Text style={styles.btnText}>−</Text>
      </Pressable>

      <View style={styles.inputWrap}>
        <SnkNumberInput
          value={value}
          onChangeValue={onChangeValue}
          precision={0}
          enabled={enabled}
          style={styles.inputFlex}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Aumentar"
        onPress={inc}
        disabled={!enabled || atMax}
        style={({ pressed }) => [
          styles.btn,
          (!enabled || atMax) && styles.btnDisabled,
          pressed && enabled && !atMax && styles.btnPressed,
        ]}
      >
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnPressed: { opacity: 0.65 },
  btnText: {
    fontSize: 20,
    color: colors.text,
    lineHeight: 22,
  },
  inputWrap: {
    flex: 1,
    minWidth: 80,
  },
  inputFlex: {
    flex: 1,
    minWidth: 0,
  },
})
