import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useCallback } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { colors, space } from '@wms/theme'

export type SnkCheckboxValue = boolean | 'I'

export type SnkCheckboxProps = {
  value: SnkCheckboxValue
  onChangeValue: (value: boolean) => void
  label?: string
  enabled?: boolean
  acceptIndeterminate?: boolean
}

export function SnkCheckbox({
  value,
  onChangeValue,
  label,
  enabled = true,
  acceptIndeterminate = false,
}: SnkCheckboxProps) {
  const isChecked = value === true
  const isIndeterminate = acceptIndeterminate && value === 'I'

  const toggle = useCallback(() => {
    if (!enabled) return
    if (isIndeterminate) {
      onChangeValue(false)
    } else {
      onChangeValue(!isChecked)
    }
  }, [enabled, isChecked, isIndeterminate, onChangeValue])

  const icon = isIndeterminate
    ? 'minus-box'
    : isChecked
      ? 'checkbox-marked'
      : 'checkbox-blank-outline'

  const iconColor = !enabled
    ? colors.border
    : isChecked || isIndeterminate
      ? colors.primary
      : colors.textMuted

  return (
    <Pressable
      onPress={toggle}
      disabled={!enabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isIndeterminate ? 'mixed' : isChecked, disabled: !enabled }}
      style={({ pressed }) => [styles.wrap, pressed && enabled && styles.pressed]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      {label ? (
        <Text style={[styles.label, !enabled && styles.labelDisabled]} numberOfLines={2}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: 2,
  },
  pressed: { opacity: 0.65 },
  label: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  labelDisabled: { opacity: 0.5 },
})
