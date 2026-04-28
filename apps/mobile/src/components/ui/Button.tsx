import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps, type TextStyle, type ViewStyle } from 'react-native'
import { colors, radii, space } from '@wms/theme'

type Variant = 'default' | 'primary' | 'ghost' | 'outline' | 'success' | 'danger'

type ButtonProps = Omit<PressableProps, 'style'> & {
  children: ReactNode
  variant?: Variant
  style?: ViewStyle | ViewStyle[]
  textStyle?: TextStyle
  loading?: boolean
}

export function Button({
  children,
  variant = 'default',
  disabled,
  loading = false,
  style,
  textStyle,
  ...rest
}: ButtonProps) {
  const v = variants[variant]
  const isDisabled = disabled || loading
  const spinnerColor = v.label.color ?? '#FFFFFF'
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        v.container,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator size="small" color={spinnerColor} /> : null}
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text style={[styles.label, v.label, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm + 2,
    paddingHorizontal: space.lg,
    borderRadius: radii.md,
    gap: space.xs,
  },
  label: { fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.88 },
})

const variants: Record<
  Variant,
  { container: ViewStyle; label: TextStyle }
> = {
  default: {
    container: { backgroundColor: colors.primary },
    label: { color: '#FFFFFF' },
  },
  primary: {
    container: { backgroundColor: '#FFFFFF' },
    label: { color: colors.primary },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    label: { color: colors.text },
  },
  outline: {
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: { color: colors.textMuted },
  },
  success: {
    container: { backgroundColor: colors.success },
    label: { color: '#FFFFFF' },
  },
  danger: {
    container: { backgroundColor: colors.danger },
    label: { color: '#FFFFFF' },
  },
}
