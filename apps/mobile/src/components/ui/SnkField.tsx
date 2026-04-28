import type { ReactNode } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors, space } from '@wms/theme'

export type SnkFieldProps = {
  label: string
  required?: boolean
  visible?: boolean
  enabled?: boolean
  error?: string
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export function SnkField({
  label,
  required = false,
  visible = true,
  enabled = true,
  error,
  children,
  style,
}: SnkFieldProps) {
  if (!visible) return null

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, !enabled && styles.labelDisabled]} numberOfLines={1}>
          {label}
        </Text>
        {required ? <Text style={styles.aster}>*</Text> : null}
      </View>

      <View style={[styles.inputWrap, !enabled && styles.inputWrapDisabled]}>{children}</View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  labelDisabled: {
    opacity: 0.5,
  },
  aster: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  inputWrap: {},
  inputWrapDisabled: {
    opacity: 0.5,
  },
  error: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 3,
  },
})
