import { useCallback } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { colors } from '@wms/theme'

export type SnkSwitchProps = {
  value: string
  onChangeValue: (value: string) => void
  trueValue?: string
  falseValue?: string
  enabled?: boolean
  accessibilityLabel?: string
}

export function SnkSwitch({
  value,
  onChangeValue,
  trueValue = 'S',
  falseValue = 'N',
  enabled = true,
  accessibilityLabel,
}: SnkSwitchProps) {
  const isOn = String(value) === trueValue

  const toggle = useCallback(() => {
    if (!enabled) return
    onChangeValue(isOn ? falseValue : trueValue)
  }, [enabled, isOn, trueValue, falseValue, onChangeValue])

  return (
    <Pressable
      onPress={toggle}
      disabled={!enabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: isOn, disabled: !enabled }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.track,
        isOn && styles.trackOn,
        !enabled && styles.trackDisabled,
        pressed && enabled && styles.trackPressed,
      ]}
    >
      <View style={[styles.thumb, isOn && styles.thumbOn]} />
    </Pressable>
  )
}

const TRACK_W = 48
const TRACK_H = 26
const THUMB_SIZE = 20
const THUMB_TRAVEL = TRACK_W - THUMB_SIZE - 6

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
    alignSelf: 'flex-start',
  },
  trackOn: {
    backgroundColor: colors.primary,
  },
  trackDisabled: {
    opacity: 0.4,
  },
  trackPressed: {
    opacity: 0.8,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.surface,
    transform: [{ translateX: 0 }],
  },
  thumbOn: {
    transform: [{ translateX: THUMB_TRAVEL }],
  },
})
